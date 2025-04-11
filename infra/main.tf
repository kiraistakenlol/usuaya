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

  # Temporarily allow access from the default SG for initial setup.
  # TODO: Refine this to allow access specifically from App Runner.
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [data.aws_security_group.default.id]
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
  engine_version         = "15.6" # Use a specific minor version for stability
  instance_class         = var.rds_instance_class
  db_name                = var.rds_db_name
  username               = var.rds_username
  password               = data.aws_secretsmanager_secret_version.rds_password.secret_string
  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  skip_final_snapshot    = true  # For easier cleanup during testing
  publicly_accessible    = false # Keep DB private
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
    # Note: port configuration is inside source_configuration.image_repository.image_configuration
  }

  # Networking configuration (using default VPC for now)
  network_configuration {
    egress_configuration {
      egress_type = "DEFAULT" # Allow outbound traffic to the internet
    }
    # ingress_configuration {
    #   is_publicly_accessible = true # Make the service accessible from the internet
    # }
  }

  # health_check_configuration {
  #   protocol            = "TCP"
  #   port                = "8000"        # Port the container listens on for health checks
  #   path                = "/api/health" # Assuming a health check endpoint exists
  #   interval            = 10            # seconds
  #   timeout             = 5             # seconds
  #   healthy_threshold   = 1
  #   unhealthy_threshold = 2
  # }

  tags = {
    Name = "${var.project_name}-backend-service"
  }
}

# --- Amplify (Frontend Hosting) ---
# TODO: Uncomment and configure once GitHub repo URL is set
# resource "aws_amplify_app" "frontend_app" {
#   name       = "${var.project_name}-frontend-app"
#   repository = var.github_repo_url
#   oauth_token = data.aws_secretsmanager_secret_version.github_token.secret_string

#   # Build settings (example for Next.js)
#   build_spec = <<-EOT
#     version: 1
#     frontend:
#       phases:
#         preBuild:
#           commands:
#             - cd frontend
#             - npm ci
#         build:
#           commands:
#             - npm run build
#       artifacts:
#         baseDirectory: frontend/.next
#         files:
#           - '**/*'
#       cache:
#         paths:
#           - frontend/node_modules/**/*
#   EOT

#   # Environment variables for the frontend build/runtime
#   # environment_variables = {
#   #   NEXT_PUBLIC_API_URL = aws_apprunner_service.backend_service.service_url # Or your custom domain
#   # }

#   # Custom rules (e.g., for Next.js routing)
#   # custom_rules {
#   #   source = "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>"
#   #   target = "/index.html"
#   #   status = "200"
#   # }

#   tags = {
#     Name = "${var.project_name}-frontend-app"
#   }
# }

# resource "aws_amplify_branch" "frontend_branch" {
#   app_id      = aws_amplify_app.frontend_app.id
#   branch_name = var.frontend_branch_name
#   stage       = "PRODUCTION" # Or DEVELOPMENT, etc.
#   enable_auto_build = true

#   tags = {
#     Name = "${var.project_name}-frontend-branch-${var.frontend_branch_name}"
#   }
# }

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