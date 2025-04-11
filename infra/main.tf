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
# Retrieve the actual password from the secret created manually by the user
data "aws_secretsmanager_secret_version" "rds_password" {
  secret_id = var.rds_password_secret_arn
}

# Retrieve the GitHub token from the secret created manually by the user
data "aws_secretsmanager_secret_version" "github_token" {
  secret_id = var.github_oauth_token_secret_arn
}


# --- RDS (Database) ---
resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "${var.project_name}-rds-subnet-group"
  subnet_ids = data.aws_subnets.default.ids
  tags = {
    Name = "${var.project_name}-rds-subnet-group"
  }
}

# Security Group for RDS allowing access from App Runner (needs App Runner SG later)
resource "aws_security_group" "rds_sg" {
  name        = "${var.project_name}-rds-sg"
  description = "Allow PostgreSQL traffic from App Runner"
  vpc_id      = data.aws_vpc.default.id

  # Ingress rule will be added later once App Runner's SG is known,
  # or could allow broader access from within VPC for initial simplicity (less secure)
  # Example: Allow access from default SG (simplistic, potentially too open)
  # ingress {
  #   from_port       = 5432
  #   to_port         = 5432
  #   protocol        = "tcp"
  #   security_groups = [data.aws_security_group.default.id]
  # }

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
  allocated_storage      = 20 # Minimum GB
  engine                 = "postgres"
  engine_version         = "15" # Specify a recent version
  instance_class         = var.rds_instance_class
  db_name                = var.rds_db_name
  username               = var.rds_username
  password               = data.aws_secretsmanager_secret_version.rds_password.secret_string
  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  skip_final_snapshot    = true # For easier cleanup during testing, set false for production
  publicly_accessible    = false # Keep DB private

  tags = {
    Name = "${var.project_name}-rds-db"
  }
}


# --- S3 (Audio Storage) ---
resource "aws_s3_bucket" "audio_storage" {
  bucket = "${var.project_name}-audio-${random_id.bucket_suffix.hex}" # Ensure unique bucket name
  # Consider adding ACLs, policies, CORS config as needed later
  tags = {
    Name = "${var.project_name}-audio-storage"
  }
}

# Generates a random suffix for the S3 bucket name to help ensure uniqueness
resource "random_id" "bucket_suffix" {
  byte_length = 4
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
        Effect   = "Allow"
        Resource = [
          aws_s3_bucket.audio_storage.arn,
          "${aws_s3_bucket.audio_storage.arn}/*"
        ]
      },
      {
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Effect   = "Allow"
        Resource = [
          var.rds_password_secret_arn,
          var.github_oauth_token_secret_arn
          # Add other secret ARNs if needed
        ]
      }
      # Add CloudWatch Logs permissions if not using default App Runner role
      # {
      #   Action = [
      #     "logs:CreateLogStream",
      #     "logs:CreateLogGroup",
      #     "logs:DescribeLogStreams",
      #     "logs:PutLogEvents"
      #   ]
      #   Effect = "Allow"
      #   Resource = "arn:aws:logs:${var.aws_region}:*:log-group:/aws/apprunner/*:*"
      # }
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
      image_identifier      = "${aws_ecr_repository.backend_repo.repository_url}:latest" # Use :latest or a specific tag
      image_repository_type = "ECR"
      image_configuration {
        port = "8000" # Assuming NestJS runs on port 8000 inside the container
      }
    }
    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_execution_role.arn
    }
    auto_deployments_enabled = true # Re-deploy when new image pushed to ECR
  }

  instance_configuration {
    cpu    = "1024" # 1 vCPU
    memory = "2048" # 2 GB RAM
    # instance_role_arn = aws_iam_role.apprunner_execution_role.arn # For accessing other AWS services from running code
  }

  # Network configuration - Using default VPC public access for simplicity
  # network_configuration {
  #   egress_configuration {
  #     egress_type = "DEFAULT"
  #   }
  # }
  # If RDS needs private access, configure VPC connector here:
  # network_configuration {
  #    ingress_configuration {
  #      is_publicly_accessible = true # Set to false if only accessed via internal LB/API Gateway
  #    }
  #   egress_configuration {
  #     egress_type = "VPC"
  #     vpc_connector_arn = aws_apprunner_vpc_connector.app_runner_vpc_connector.arn
  #   }
  # }


  # Environment variables - reference secrets!
  # Example - structure needs to be adapted based on how NestJS reads connection string
  health_check_configuration {
      protocol = "TCP"
      port = "8000" # same as container port
      # path = "/health" # Add a health check endpoint to NestJS if desired
  }

  tags = {
    Name = "${var.project_name}-backend-service"
  }
}

# --- Amplify (Frontend Hosting) ---
resource "aws_amplify_app" "frontend_app" {
  name                       = "${var.project_name}-frontend-app"
  repository                 = var.github_repo_url
  access_token               = data.aws_secretsmanager_secret_version.github_token.secret_string
  platform                   = "WEB_COMPUTE" # For Next.js SSR/ISR. Use "WEB" for static SPA (React, Vue, Angular).
  build_spec                 = <<-EOT
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci # Use ci for faster installs in CI/CD
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: .next # For Next.js default build output
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
  EOT
  # Environment variables set via Amplify Console usually, but can be defined here too
  # environment_variables = {
  #   NEXT_PUBLIC_API_URL = aws_apprunner_service.backend_service.service_url
  # }

  tags = {
    Name = "${var.project_name}-frontend-app"
  }
}

resource "aws_amplify_branch" "frontend_branch" {
  app_id      = aws_amplify_app.frontend_app.id
  branch_name = var.frontend_branch_name
  framework   = "Next.js - SSR" # Or "React" etc. depending on your frontend
  stage       = "PRODUCTION" # Or DEVELOPMENT etc.

  # Enable features if needed
  enable_auto_build = true
  # enable_pull_request_preview = true
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