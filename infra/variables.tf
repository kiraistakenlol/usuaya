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
  default     = "db.t3.micro" # Free tier eligible instance
}

variable "rds_db_name" {
  description = "Name for the RDS database"
  type        = string
  default     = "usuaya_db"
}

variable "rds_username" {
  description = "Username for the RDS database master user"
  type        = string
  default     = "usuaya_admin"
}

variable "rds_password_secret_arn" {
  description = "ARN of the AWS Secrets Manager secret containing the RDS password"
  type        = string
  default     = "arn:aws:secretsmanager:us-east-1:480238144173:secret:usuaya/rds/password-RATQvG"
}

variable "s3_audio_bucket_name" {
  description = "Globally unique name for the S3 bucket for audio storage"
  type        = string
  default     = "usuaya-audio-storage-dev"
}

variable "github_oauth_token_secret_arn" {
  description = "ARN of the AWS Secrets Manager secret containing the GitHub personal access token for Amplify"
  type        = string
  default     = "arn:aws:secretsmanager:us-east-1:480238144173:secret:usuaya/github/pat-NdueOl"
}

variable "frontend_branch_name" {
  description = "The Git branch Amplify should deploy"
  type        = string
  default     = "main"
}
