# infra/secrets.tfvars
# Store sensitive variable values here

rds_password_secret_arn        = "arn:aws:secretsmanager:us-east-1:480238144173:secret:usuaya/rds/password-RATQvG"
github_oauth_token_secret_arn  = "arn:aws:secretsmanager:us-east-1:480238144173:secret:usuaya/github/pat-NdueOl"
anthropic_api_key_secret_arn   = "arn:aws:secretsmanager:us-east-1:480238144173:secret:usuaya/llm/anthropic-JorKH3"
elevenlabs_api_key_secret_arn  = "arn:aws:secretsmanager:us-east-1:480238144173:secret:usuaya/tts/elevenlabs-ISNfM6"
elevenlabs_voice_id_secret_arn = "arn:aws:secretsmanager:us-east-1:480238144173:secret:usuaya/tts/elevenlabs_voice_id-g1DBoG"
grok_api_key_secret_arn        = "arn:aws:secretsmanager:us-east-1:480238144173:secret:usuaya/llm/grok-KxYfx3"
github_repo_url                = "https://github.com/kiraistakenlol/usuaya"
frontend_branch_name           = "master" # Specify the correct branch name