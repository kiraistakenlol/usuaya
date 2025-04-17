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
  description = "ARN of the Secrets Manager secret for RDS password"
  type        = string
}

variable "s3_audio_bucket_name" {
  description = "Globally unique name for the S3 bucket for audio storage"
  type        = string
  default     = "usuaya-audio-storage-dev"
}

variable "github_oauth_token_secret_arn" {
  description = "ARN of the Secrets Manager secret for GitHub PAT (for Amplify)"
  type        = string
  # default     = "" # Or make it optional if Amplify isn't always used
}

variable "frontend_branch_name" {
  description = "The Git branch Amplify should deploy"
  type        = string
  default     = "master"
}

variable "anthropic_api_key_secret_arn" {
  description = "ARN of the Secrets Manager secret for Anthropic API Key"
  type        = string
}

variable "elevenlabs_api_key_secret_arn" {
  description = "ARN of the Secrets Manager secret for ElevenLabs API Key"
  type        = string
}

variable "elevenlabs_voice_id_secret_arn" {
  description = "ARN of the Secrets Manager secret for ElevenLabs Voice ID"
  type        = string
}

variable "grok_api_key_secret_arn" {
  description = "ARN of the Secrets Manager secret for Grok API Key"
  type        = string
}

variable "github_repo_url" {
  description = "URL of the GitHub repository"
  type        = string
}
