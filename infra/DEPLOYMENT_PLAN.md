# AWS Deployment Plan (Terraform + Manual Steps)

This plan outlines the steps to provision the necessary AWS infrastructure using Terraform and deploy the backend and frontend applications for a **minimalistic setup** for the **Usuaya** project.

**Assumptions:**

*   Terraform is installed.
*   AWS CLI is installed and configured with the `personal` profile having sufficient (assumed Admin) permissions.
*   Primary AWS Region: **us-east-1**
*   Project code (backend & frontend) is available locally or in a Git repository.
*   `infra/` directory contains the Terraform configuration files.
*   **No custom domain** will be used; default AWS-provided URLs are acceptable.
*   Secrets (like DB password) will be managed via **AWS Secrets Manager** for basic security.

## Phase 1: Prerequisites & Initial Setup

*   `[x]` **AWS Account:** Ensure you have an active AWS account.
*   `[x]` **Verify AWS CLI Profile:** Run `aws sts get-caller-identity --profile personal --region us-east-1` to confirm profile works.
*   `[x]` **Terraform Code:** Base Terraform files created (`providers.tf`, `variables.tf` (default `project_name="usuaya"`), `main.tf`, `outputs.tf`, `.gitignore`).
*   `[x]` **Secrets:** Manually created secrets in Secrets Manager (`us-east-1`):
    *   `usuaya/rds/password` (containing RDS password)
    *   `usuaya/github/pat` (containing GitHub PAT with `repo` scope)
*   `[x]` **Terraform Init:** `terraform init` completed successfully in `infra/`.

## Phase 2: Provision Core Infrastructure (Terraform)

*   [ ] **Terraform Plan:** Run `terraform plan -var="rds_password_secret_arn=ARN_FOR_RDS_SECRET" -var="github_oauth_token_secret_arn=ARN_FOR_GITHUB_SECRET" -var="github_repo_url=YOUR_GITHUB_REPO_URL"` (substitute actual values) to review resources.
*   [ ] **Terraform Apply:** Run `terraform apply -var="rds_password_secret_arn=ARN_FOR_RDS_SECRET" -var="github_oauth_token_secret_arn=ARN_FOR_GITHUB_SECRET" -var="github_repo_url=YOUR_GITHUB_REPO_URL"` (substitute actual values) and confirm. This creates:
    *   [ ] RDS Database Instance (`usuaya-rds-db`)
    *   [ ] S3 Bucket for Audio Storage (`usuaya-audio-...`)
    *   [ ] ECR Repository for Backend Image (`usuaya/backend`)
    *   [ ] Necessary IAM Roles (`usuaya-apprunner-execution-role`)
*   [ ] **Record Outputs:** Note Terraform outputs: RDS endpoint, ECR repo URI, S3 bucket name.

## Phase 3: Backend Deployment

*   [ ] **Build Backend Docker Image:**
    *   [ ] Create/Verify `backend-ts/Dockerfile`.
    *   [ ] Navigate to `backend-ts` directory.
    *   [ ] Authenticate Docker CLI to ECR: Run `aws ecr get-login-password --region us-east-1 --profile personal | docker login --username AWS --password-stdin <your-ecr-repo-uri>` (Use ECR URI from Terraform output).
    *   [ ] Build image: `docker build -t <your-ecr-repo-uri>:latest .`
    *   [ ] Push image: `docker push <your-ecr-repo-uri>:latest`
*   [ ] **Create/Update App Runner Service (Terraform):**
    *   [ ] Ensure `aws_apprunner_service` resource (`usuaya-backend-service`) in Terraform is configured correctly (image URI, env vars referencing secrets, IAM role).
    *   [ ] Run `terraform plan/apply` again (providing secret ARNs and repo URL) to create/update App Runner.
*   [ ] **Record App Runner URL:** Get the default service URL (`usuaya-backend-service...`) from Terraform output or AWS Console.
*   [ ] **Verify Backend:** Access the App Runner service URL. Test API endpoints. Check App Runner logs.

## Phase 4: Frontend Deployment

*   [ ] **Configure Backend URL:** Ensure frontend code uses an environment variable (`NEXT_PUBLIC_API_URL`) for the backend API URL.
*   [ ] **Create/Update Amplify App (Terraform):**
    *   [ ] Ensure `aws_amplify_app` resource (`usuaya-frontend-app`) in Terraform is configured (repo URL, branch, platform).
    *   [ ] Run `terraform plan/apply` again (providing secret ARNs and repo URL).
*   [ ] **Configure Amplify Build:**
    *   [ ] Access Amplify console (`us-east-1`) for the `usuaya-frontend-app`.
    *   [ ] Go to "Environment variables".
    *   [ ] Add `NEXT_PUBLIC_API_URL` with the value of your App Runner service URL.
    *   [ ] Verify build settings/`amplify.yml` (if used).
*   [ ] **Trigger Build:** Trigger first build via Amplify console or Git push.
*   [ ] **Record Amplify URL:** Get the default Amplify app URL (e.g., `https://main.d12345.amplifyapp.com`).
*   [ ] **Verify Frontend:** Access the Amplify app URL. Test functionality.

## Phase 5: Final Checks

*   [ ] **HTTPS:** Confirm HTTPS works (handled by App Runner/Amplify).
*   [ ] **CORS:** Ensure backend NestJS CORS setup allows the Amplify app URL origin.
*   [ ] **Functionality Test:** Perform end-to-end tests.
*   [ ] **Cleanup:** Remove unneeded local Docker images etc.

