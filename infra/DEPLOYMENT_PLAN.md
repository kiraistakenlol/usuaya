# AWS Deployment Plan (Terraform + Manual Steps)

This plan outlines the steps to provision the necessary AWS infrastructure using Terraform and deploy the backend and frontend applications for a **minimalistic setup**.

**Assumptions:**

*   Terraform is installed.
*   AWS CLI is installed and configured with the `personal` profile having sufficient (assumed Admin) permissions.
*   Primary AWS Region: **us-east-1**
*   Project code (backend & frontend) is available locally or in a Git repository.
*   `infra/` directory contains the Terraform configuration files.
*   **No custom domain** will be used; default AWS-provided URLs are acceptable.
*   Secrets (like DB password) will be managed via **AWS Secrets Manager** for basic security.

## Phase 1: Prerequisites & Initial Setup

*   [ ] **AWS Account:** Ensure you have an active AWS account.
*   [ ] **Verify AWS CLI Profile:** Run `aws sts get-caller-identity --profile personal --region us-east-1` to confirm profile works.
*   [ ] **Terraform Code:** Write or review the Terraform code (`.tf` files) in `infra/` for resources: RDS, S3, ECR, App Runner, Amplify, Secrets Manager, necessary IAM roles/policies. (VPC/Networking can use defaults for simplicity if acceptable, otherwise define basic VPC).
*   [ ] **Secrets:** Create necessary secrets (e.g., RDS password) in AWS Secrets Manager (`us-east-1`). Note their ARNs.
*   [ ] **Terraform Init:** Run `terraform init` in the `infra/` directory.

## Phase 2: Provision Core Infrastructure (Terraform)

*   [ ] **Terraform Plan:** Run `terraform plan -var="aws_region=us-east-1" -var="aws_profile=personal"` (or ensure region/profile are set via environment/provider block) to review resources.
*   [ ] **Terraform Apply:** Run `terraform apply -var="aws_region=us-east-1" -var="aws_profile=personal"` and confirm. This creates:
    *   [ ] RDS Database Instance (using default or basic VPC/Security Group)
    *   [ ] S3 Bucket for Audio Storage
    *   [ ] ECR Repository for Backend Image
    *   [ ] Secrets Manager Secrets reference points (if defined in TF)
    *   [ ] Necessary IAM Roles (e.g., for App Runner access to ECR/S3/Secrets)
*   [ ] **Record Outputs:** Note Terraform outputs: RDS endpoint, ECR repo URI, S3 bucket name, App Runner Service ARN (once created later).

## Phase 3: Backend Deployment

*   [ ] **Build Backend Docker Image:**
    *   [ ] Create/Verify `backend-ts/Dockerfile`.
    *   [ ] Navigate to `backend-ts` directory.
    *   [ ] Authenticate Docker CLI to ECR: Run `aws ecr get-login-password --region us-east-1 --profile personal | docker login --username AWS --password-stdin <your-ecr-repo-uri>`
    *   [ ] Build image: `docker build -t <your-ecr-repo-uri>:latest .`
    *   [ ] Push image: `docker push <your-ecr-repo-uri>:latest`
*   [ ] **Create/Update App Runner Service (Terraform):**
    *   [ ] Ensure `aws_apprunner_service` resource in Terraform is configured:
        *   Points to ECR image: `<your-ecr-repo-uri>:latest`.
        *   Includes environment variables referencing Secrets Manager ARNs for sensitive data (DB connection string), S3 bucket name, etc.
        *   Assigns necessary IAM execution role.
    *   [ ] Run `terraform plan/apply` again (using `-var` for region/profile) to create/update App Runner.
*   [ ] **Record App Runner URL:** Get the default service URL from Terraform output or AWS Console.
*   [ ] **Verify Backend:** Access the App Runner service URL. Test API endpoints. Check App Runner logs.

## Phase 4: Frontend Deployment

*   [ ] **Configure Backend URL:** Ensure frontend code uses an environment variable (`NEXT_PUBLIC_API_URL`) for the backend API URL.
*   [ ] **Create/Update Amplify App (Terraform):**
    *   [ ] Ensure `aws_amplify_app` resource is configured:
        *   Points to Git repository and branch (`main`).
        *   Sets `platform = "WEB_COMPUTE"` for Next.js SSR/ISR or `platform = "WEB"` for static SPA.
    *   [ ] Run `terraform plan/apply` again (using `-var` for region/profile).
*   [ ] **Configure Amplify Build:**
    *   [ ] Access Amplify console (`us-east-1`).
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

