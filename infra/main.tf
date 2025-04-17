# infra/main.tf

# --- Networking ---
# Using default VPC and subnets for simplicity.
# Fetching default VPC details
data "aws_vpc" "default" {
  default = true
}

# Fetching default subnet IDs
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Default Security Group (Allows all outbound, allows inbound from itself)
# Note: For RDS, we'll create a specific group allowing App Runner access.
data "aws_security_group" "default" {
  name   = "default"
  vpc_id = data.aws_vpc.default.id
}


# --- Secrets Manager Data Sources ---
# Retrieve the actual password from the secret using the provided ARN
data "aws_secretsmanager_secret_version" "rds_password" {
  secret_id = var.rds_password_secret_arn
}

# Retrieve the GitHub token from the secret using the provided ARN
data "aws_secretsmanager_secret_version" "github_token" {
  secret_id = var.github_oauth_token_secret_arn
}

# Retrieve the Anthropic API key
data "aws_secretsmanager_secret_version" "anthropic_api_key" {
  secret_id = var.anthropic_api_key_secret_arn
}

# Retrieve the ElevenLabs API key
data "aws_secretsmanager_secret_version" "elevenlabs_api_key" {
  secret_id = var.elevenlabs_api_key_secret_arn
}

# Retrieve the ElevenLabs Voice ID
data "aws_secretsmanager_secret_version" "elevenlabs_voice_id" {
  secret_id = var.elevenlabs_voice_id_secret_arn
}

# Retrieve the Grok API key
data "aws_secretsmanager_secret_version" "grok_api_key" {
  secret_id = var.grok_api_key_secret_arn
}


# --- RDS (Database) ---
resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "${var.project_name}-rds-subnet-group"
  subnet_ids = data.aws_subnets.default.ids
  tags = {
    Name = "${var.project_name}-rds-subnet-group"
  }
}

# Security Group for RDS allowing public access
resource "aws_security_group" "rds_sg" {
  name        = "${var.project_name}-rds-sg"
  description = "Allow ALL PostgreSQL traffic from public internet"
  vpc_id      = data.aws_vpc.default.id

  # Allow PostgreSQL traffic from anywhere
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-rds-sg"
  }
}


resource "aws_db_instance" "postgres_db" {
  allocated_storage      = 20 # GB, Free tier eligible storage size with t3.micro
  engine                 = "postgres"
  engine_version         = "15.7" # Changed from 15.6 - Verify this version is available
  instance_class         = var.rds_instance_class
  db_name                = var.rds_db_name
  username               = var.rds_username
  password               = data.aws_secretsmanager_secret_version.rds_password.secret_string
  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  skip_final_snapshot    = true  # For easier cleanup during testing
  publicly_accessible    = true  # Make DB publicly accessible
  apply_immediately      = true  # Useful during development

  tags = {
    Name = "${var.project_name}-rds-db"
  }
}


# --- S3 (Audio Storage) ---
resource "aws_s3_bucket" "audio_storage" {
  bucket = var.s3_audio_bucket_name # Use the variable for the bucket name

  # Add lifecycle rule to expire objects after some time? (Optional)
  # Add CORS rules if frontend needs direct access (Likely not needed if backend handles uploads)

  tags = {
    Name = "${var.project_name}-audio-storage"
  }
}


# --- ECR (Backend Image Registry) ---
resource "aws_ecr_repository" "backend_repo" {
  name                 = "${var.project_name}/backend"
  image_tag_mutability = "MUTABLE" # Or IMMUTABLE

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "${var.project_name}-backend-repo"
  }
}


# --- IAM Roles & Policies ---
# Basic Execution Role for App Runner
resource "aws_iam_role" "apprunner_execution_role" {
  name = "${var.project_name}-apprunner-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "build.apprunner.amazonaws.com"
        }
      },
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "tasks.apprunner.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-apprunner-execution-role"
  }
}

# Policy allowing App Runner to access ECR, S3, Secrets Manager
resource "aws_iam_policy" "apprunner_access_policy" {
  name        = "${var.project_name}-apprunner-access-policy"
  description = "Policy for App Runner to access ECR, S3, and Secrets Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetRepositoryPolicy",
          "ecr:DescribeRepositories",
          "ecr:ListImages",
          "ecr:DescribeImages",
          "ecr:GetAuthorizationToken"
        ]
        Effect   = "Allow"
        Resource = aws_ecr_repository.backend_repo.arn
      },
      {
        Action = [
          "ecr:GetAuthorizationToken"
        ]
        Effect   = "Allow"
        Resource = "*" # Necessary for ECR auth
      },
      {
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket",
          "s3:DeleteObject"
          # Add other S3 permissions as needed
        ]
        Effect = "Allow"
        Resource = [
          aws_s3_bucket.audio_storage.arn,
          "${aws_s3_bucket.audio_storage.arn}/*"
        ]
      },
      {
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Effect = "Allow"
        Resource = [
          var.rds_password_secret_arn,
          var.github_oauth_token_secret_arn,
          var.anthropic_api_key_secret_arn,
          var.elevenlabs_api_key_secret_arn,
          var.elevenlabs_voice_id_secret_arn,
          var.grok_api_key_secret_arn
        ]
      }
    ]
  })
}

# Attach the policy to the role
resource "aws_iam_role_policy_attachment" "apprunner_execution_policy_attachment" {
  role       = aws_iam_role.apprunner_execution_role.name
  policy_arn = aws_iam_policy.apprunner_access_policy.arn
}

# --- App Runner (Backend Service) ---
resource "aws_apprunner_service" "backend_service" {
  service_name = "${var.project_name}-backend-service"

  source_configuration {
    image_repository {
      image_identifier      = "${aws_ecr_repository.backend_repo.repository_url}:latest"
      image_repository_type = "ECR"
      image_configuration {
        port = "8000" # CONFIRM: Port your NestJS app listens on (e.g., 3000 or 8000)
        runtime_environment_variables = { # Renamed from environment_variables as per v5.x docs for clarity
          # --- Database Connection ---
          DB_HOST     = aws_db_instance.postgres_db.address
          DB_PORT     = tostring(aws_db_instance.postgres_db.port)
          DB_USERNAME = var.rds_username
          DB_PASSWORD = data.aws_secretsmanager_secret_version.rds_password.secret_string
          DB_DATABASE = var.rds_db_name

          # --- LLM Keys (Referencing Secrets) ---
          ANTHROPIC_API_KEY = data.aws_secretsmanager_secret_version.anthropic_api_key.secret_string
          GROK_API_KEY      = data.aws_secretsmanager_secret_version.grok_api_key.secret_string
          GROK_MODEL_NAME   = "grok-1" # Added Grok model name

          # --- Audio Keys (Referencing Secrets) ---
          ELEVENLABS_API_KEY  = data.aws_secretsmanager_secret_version.elevenlabs_api_key.secret_string
          ELEVENLABS_VOICE_ID = data.aws_secretsmanager_secret_version.elevenlabs_voice_id.secret_string
          ELEVENLABS_MODEL_ID = "eleven_multilingual_v2" # Added ElevenLabs model ID

          # --- Other Config ---
          NODE_ENV = "production"
          # Add any other non-secret env vars your app needs
        }
      }
    }
    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_execution_role.arn
    }
    auto_deployments_enabled = true
  }

  instance_configuration {
    cpu    = "1024" # 1 vCPU
    memory = "2048" # 2 GB RAM
  }

  network_configuration {
    egress_configuration {
      egress_type = "DEFAULT"
    }
  }

  # Optional: Add health check config if needed
  # health_check_configuration {
  #   protocol = "TCP" # Or HTTP
  #   port     = "8000" # Match image_configuration.port
  #   # path = "/healthz" # If using HTTP
  # }

  tags = {
    Name = "${var.project_name}-backend-service"
  }
}

# --- Amplify (Frontend Hosting) ---
resource "aws_amplify_app" "frontend_app" {
  name       = "${var.project_name}-frontend-app"
  repository = var.github_repo_url
  oauth_token = data.aws_secretsmanager_secret_version.github_token.secret_string

  # Build spec is now defined in amplify.yml in the repo root
  # build_spec = <<-EOT
  #   ...
  # EOT

  # Environment variables managed by amplify.yml or local .env if needed
  # environment_variables = {
  #   VITE_API_URL = "https://${aws_apprunner_service.backend_service.service_url}" # Example if needed
  # }

  # Custom rule for Single Page Application (SPA) routing (Vite)
  custom_rule {
    source = "/<*>"
    target = "/index.html"
    status = "404-200" # Changed from 200 to 404-200 for SPA rewrite
  }

  tags = {
    Name = "${var.project_name}-frontend-app"
  }
}

resource "aws_amplify_branch" "frontend_branch" {
  app_id      = aws_amplify_app.frontend_app.id
  branch_name = var.frontend_branch_name # Use variable
  stage       = "PRODUCTION" # Or make this configurable
  enable_auto_build = true

  tags = {
    Name = "${var.project_name}-frontend-branch-${var.frontend_branch_name}"
  }
}

# Need to allow RDS Security group ingress from App Runner
# This depends on App Runner creating its own outbound Security Group when using VPC egress.
# This requires more complex setup and potentially using null_resource or waiting mechanisms.
# For simplicity now, we might manually allow the App Runner Outbound SG after initial apply,
# or allow broader access initially (e.g., from the default VPC SG).

# --- RDS Security Group Rule (Manual Step Indicated) ---
# resource "aws_security_group_rule" "allow_apprunner_to_rds" {
#   type              = "ingress"
#   from_port         = 5432
#   to_port           = 5432
#   protocol          = "tcp"
#   security_group_id = aws_security_group.rds_sg.id
#   # This source security group ID needs to be determined after App Runner VPC egress is configured
#   # source_security_group_id = <App Runner Outbound Security Group ID> # Placeholder
#   description = "Allow App Runner access to RDS"
# } 