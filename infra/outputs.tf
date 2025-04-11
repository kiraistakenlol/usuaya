output "rds_endpoint" {
  description = "The endpoint address of the RDS database instance"
  value       = aws_db_instance.postgres_db.endpoint
}

output "rds_db_name" {
  description = "The name of the RDS database"
  value       = aws_db_instance.postgres_db.db_name
}

output "s3_audio_bucket_name" {
  description = "The name of the S3 bucket for audio storage"
  value       = aws_s3_bucket.audio_storage.bucket
}

output "ecr_repository_url" {
  description = "The URL of the ECR repository for the backend image"
  value       = aws_ecr_repository.backend_repo.repository_url
}

output "app_runner_service_url" {
  description = "The default URL of the App Runner service"
  value       = aws_apprunner_service.backend_service.service_url
  sensitive   = true # URL might be considered sensitive
}

output "app_runner_service_arn" {
  description = "The ARN of the App Runner service"
  value       = aws_apprunner_service.backend_service.arn
}

# output "amplify_app_default_domain" {
#   description = "The default domain URL of the Amplify app"
#   value       = aws_amplify_app.frontend_app.default_domain
# }

# output "amplify_app_id" {
#   description = "The ID of the Amplify app"
#   value       = aws_amplify_app.frontend_app.id
# } 