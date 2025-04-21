# Infrastructure (`infra/`)

This directory contains the Terraform configuration files used to define, provision, and manage the AWS infrastructure for the **Usuaya** project.

**Important:** The `infra/` directory is located at the root of the project repository.

**Target Environment:**

*   **AWS Region:** `us-east-1`
*   **AWS CLI Profile:** `personal` (Assumed to have necessary permissions)
*   **Domain:** Default AWS URLs (No custom domain)
*   **Approach:** Minimalistic setup focusing on simplicity.

## Structure

*   **`main.tf`**: Defines the core resources (RDS, S3, ECR, App Runner, Amplify, Secrets Manager, basic IAM).
*   **`variables.tf`**: Declares input variables (e.g., `project_name` defaults to `usuaya`, instance sizes, secrets ARNs).
*   **`outputs.tf`**: Defines outputs (RDS endpoint, App Runner URL, Amplify App URL, ECR URI, S3 Bucket Name).
*   **`providers.tf`**: Configures the AWS provider (version, region=`us-east-1`).
*   **`.gitignore`**: Excludes Terraform state files (`.terraform*`, `*.tfstate*`, `.terraform.lock.hcl`).

## Docker Image Building

### Building and Pushing the Backend Image

Build the Docker image for the backend service, tagging it appropriately for your ECR repository, and push it.

```bash
# BuildKit needed for multi-platform builds if your local machine isn't linux/amd64
# export DOCKER_BUILDKIT=1 

# Build and tag
docker buildx build --platform linux/amd64 -t YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/usuaya/backend:latest -f src/backend/Dockerfile src/backend

# Login to ECR (Replace YOUR_AWS_ACCOUNT_ID and us-east-1 if different)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Push
docker push YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/usuaya/backend:latest
```

## Usage

1.  **Prerequisites:**
    *   Ensure AWS CLI profile `personal` is configured and working in region `us-east-1`.
    *   Manually create two secrets in AWS Secrets Manager (`us-east-1`):
        *   `usuaya/rds/password`: Containing the desired RDS master password.
        *   `usuaya/github/pat`: Containing a GitHub Personal Access Token with `repo` scope.
    *   Note the ARNs for both secrets.
    *   Have the HTTPS URL for the frontend's GitHub repository ready.
2.  **Initialize:** `terraform init` (run in `infra/` directory)
3.  **Plan:** `terraform plan -var="rds_password_secret_arn=ARN_FOR_RDS_SECRET" -var="github_oauth_token_secret_arn=ARN_FOR_GITHUB_SECRET" -var="github_repo_url=YOUR_GITHUB_REPO_URL"` (substitute actual values; can also use `terraform.tfvars`)
4.  **Apply:** `terraform apply -var="rds_password_secret_arn=ARN_FOR_RDS_SECRET" -var="github_oauth_token_secret_arn=ARN_FOR_GITHUB_SECRET" -var="github_repo_url=YOUR_GITHUB_REPO_URL"` (substitute actual values; requires confirmation)
5.  **Destroy:** `terraform destroy` (requires confirmation)

Refer to `DEPLOYMENT_PLAN.md` for the step-by-step deployment process.

