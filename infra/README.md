# Infrastructure (`infra/`)

This directory contains the Terraform configuration files used to define, provision, and manage the AWS infrastructure for the Vibe Coding project.

**Target Environment:**

*   **AWS Region:** `us-east-1`
*   **AWS CLI Profile:** `personal` (Assumed to have necessary permissions)
*   **Domain:** Default AWS URLs (No custom domain)
*   **Approach:** Minimalistic setup focusing on simplicity.

## Structure

*   **`main.tf`**: Defines the core resources (RDS, S3, ECR, App Runner, Amplify, Secrets Manager, basic IAM).
*   **`variables.tf`**: Declares input variables (e.g., instance sizes, potentially placeholder secrets for initial plan).
*   **`outputs.tf`**: Defines outputs (RDS endpoint, App Runner URL, Amplify App URL, ECR URI, S3 Bucket Name).
*   **`providers.tf`**: Configures the AWS provider (version, region=`us-east-1`).
*   **`.gitignore`**: Excludes Terraform state files (`.terraform*`, `*.tfstate*`, `.terraform.lock.hcl`).

## Usage

1.  **Prerequisites:** Ensure AWS CLI profile `personal` is configured and working in region `us-east-1`.
2.  **Initialize:** `terraform init`
3.  **Plan:** `terraform plan -var="aws_profile=personal"` (or set `AWS_PROFILE=personal` environment variable)
4.  **Apply:** `terraform apply -var="aws_profile=personal"` (or set `AWS_PROFILE=personal` environment variable)
5.  **Destroy:** `terraform destroy -var="aws_profile=personal"` (or set `AWS_PROFILE=personal` environment variable)

Refer to `DEPLOYMENT_PLAN.md` for the step-by-step deployment process.

