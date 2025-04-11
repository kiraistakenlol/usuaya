variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "aws_profile" {
  description = "AWS CLI profile name"
  type        = string
  default     = "personal"
}

variable "project_name" {
  description = "A unique name for the project resources"
  type        = string
  default     = "usuaya" # Keep this short and DNS-compatible
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro" # Small instance for cost-saving
}

variable "rds_db_name" {
  description = "Name for the RDS database"
  type        = string
  default     = "vibecodingdb"
}

variable "rds_username" {
  description = "Username for the RDS database master user"
  type        = string
  default     = "vibeadmin"
}

variable "rds_password_secret_arn" {
  description = "ARN of the AWS Secrets Manager secret containing the RDS password"
  type        = string
  # No default - MUST be provided by user after creating the secret
  # Example: "arn:aws:secretsmanager:us-east-1:123456789012:secret:rds-db-password-abcdef"
}

variable "github_repo_url" {
  description = "URL of the GitHub repository for the frontend (e.g., https://github.com/your_user/your_repo)"
  type        = string
  # No default - MUST be provided by user
}

variable "github_oauth_token_secret_arn" {
  description = "ARN of the AWS Secrets Manager secret containing the GitHub personal access token for Amplify"
  type        = string
  # No default - MUST be provided by user after creating the secret
}

variable "frontend_branch_name" {
  description = "The Git branch Amplify should deploy"
  type        = string
  default     = "main"
}
