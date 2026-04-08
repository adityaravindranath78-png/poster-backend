#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# Poster App — AWS Infrastructure Setup
# Region: ap-south-1
# Idempotent: checks if each resource exists before creating
# ──────────────────────────────────────────────────────────────

REGION="ap-south-1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUTS_FILE="${SCRIPT_DIR}/outputs.json"

# Resource names
USER_POOL_NAME="poster-app-users"
APP_CLIENT_NAME="poster-app-client"
DYNAMO_TABLE="poster-app"
S3_BUCKET="poster-app-assets-techveda"
CF_OAC_NAME="poster-app-oac"
CF_COMMENT="poster-app-distribution"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[SKIP]${NC}  $*"; }
err()   { echo -e "${RED}[ERR]${NC}   $*"; }
header(){ echo -e "\n${BOLD}━━━ $* ━━━${NC}"; }

# Initialize outputs
declare -A OUTPUTS

save_outputs() {
  cat > "$OUTPUTS_FILE" <<OJSON
{
  "region": "${REGION}",
  "cognito_user_pool_id": "${OUTPUTS[cognito_user_pool_id]:-}",
  "cognito_client_id": "${OUTPUTS[cognito_client_id]:-}",
  "dynamodb_table": "${OUTPUTS[dynamodb_table]:-}",
  "s3_bucket": "${OUTPUTS[s3_bucket]:-}",
  "cloudfront_distribution_id": "${OUTPUTS[cloudfront_distribution_id]:-}",
  "cloudfront_domain": "${OUTPUTS[cloudfront_domain]:-}",
  "cloudfront_oac_id": "${OUTPUTS[cloudfront_oac_id]:-}"
}
OJSON
}

# ──────────────────────────────────────────────────────────────
# 1. Cognito User Pool
# ──────────────────────────────────────────────────────────────
header "Cognito User Pool"

EXISTING_POOL_ID=$(aws cognito-idp list-user-pools --max-results 60 --region "$REGION" \
  --query "UserPools[?Name=='${USER_POOL_NAME}'].Id | [0]" --output text 2>/dev/null || echo "None")

if [[ "$EXISTING_POOL_ID" != "None" && -n "$EXISTING_POOL_ID" ]]; then
  warn "User Pool '${USER_POOL_NAME}' already exists: ${EXISTING_POOL_ID}"
  USER_POOL_ID="$EXISTING_POOL_ID"
else
  info "Creating User Pool '${USER_POOL_NAME}'..."
  USER_POOL_ID=$(aws cognito-idp create-user-pool \
    --pool-name "$USER_POOL_NAME" \
    --region "$REGION" \
    --auto-verified-attributes phone_number \
    --username-attributes phone_number \
    --username-configuration "CaseSensitive=false" \
    --policies '{
      "PasswordPolicy": {
        "MinimumLength": 8,
        "RequireUppercase": false,
        "RequireLowercase": false,
        "RequireNumbers": false,
        "RequireSymbols": false,
        "TemporaryPasswordValidityDays": 7
      }
    }' \
    --schema '[
      {"Name":"phone_number","AttributeDataType":"String","Mutable":true,"Required":true},
      {"Name":"name","AttributeDataType":"String","Mutable":true,"Required":false}
    ]' \
    --mfa-configuration OFF \
    --account-recovery-setting '{
      "RecoveryMechanisms": [{"Priority":1,"Name":"verified_phone_number"}]
    }' \
    --query 'UserPool.Id' --output text)
  ok "Created User Pool: ${USER_POOL_ID}"
fi
OUTPUTS[cognito_user_pool_id]="$USER_POOL_ID"

# ── App Client ──
header "Cognito App Client"

EXISTING_CLIENT_ID=$(aws cognito-idp list-user-pool-clients --user-pool-id "$USER_POOL_ID" --region "$REGION" \
  --query "UserPoolClients[?ClientName=='${APP_CLIENT_NAME}'].ClientId | [0]" --output text 2>/dev/null || echo "None")

if [[ "$EXISTING_CLIENT_ID" != "None" && -n "$EXISTING_CLIENT_ID" ]]; then
  warn "App Client '${APP_CLIENT_NAME}' already exists: ${EXISTING_CLIENT_ID}"
  CLIENT_ID="$EXISTING_CLIENT_ID"
else
  info "Creating App Client '${APP_CLIENT_NAME}'..."
  CLIENT_ID=$(aws cognito-idp create-user-pool-client \
    --user-pool-id "$USER_POOL_ID" \
    --client-name "$APP_CLIENT_NAME" \
    --region "$REGION" \
    --no-generate-secret \
    --explicit-auth-flows ALLOW_USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_PASSWORD_AUTH \
    --supported-identity-providers COGNITO \
    --prevent-user-existence-errors ENABLED \
    --query 'UserPoolClient.ClientId' --output text)
  ok "Created App Client: ${CLIENT_ID}"
fi
OUTPUTS[cognito_client_id]="$CLIENT_ID"

# ── Google Identity Provider (placeholder) ──
header "Cognito Google IdP (placeholder)"

EXISTING_IDP=$(aws cognito-idp describe-identity-provider \
  --user-pool-id "$USER_POOL_ID" --provider-name Google \
  --region "$REGION" --query 'IdentityProvider.ProviderName' --output text 2>/dev/null || echo "None")

if [[ "$EXISTING_IDP" != "None" && -n "$EXISTING_IDP" ]]; then
  warn "Google IdP already configured"
else
  info "Creating Google IdP placeholder (update client_id and client_secret later)..."
  aws cognito-idp create-identity-provider \
    --user-pool-id "$USER_POOL_ID" \
    --provider-name Google \
    --provider-type Google \
    --region "$REGION" \
    --provider-details '{
      "client_id": "REPLACE_WITH_GOOGLE_CLIENT_ID",
      "client_secret": "REPLACE_WITH_GOOGLE_CLIENT_SECRET",
      "authorize_scopes": "openid email profile"
    }' \
    --attribute-mapping '{"email":"email","name":"name","username":"sub"}' \
    > /dev/null
  ok "Created Google IdP placeholder — update credentials in AWS Console"
fi

# ──────────────────────────────────────────────────────────────
# 2. DynamoDB Table
# ──────────────────────────────────────────────────────────────
header "DynamoDB Table"

TABLE_EXISTS=$(aws dynamodb describe-table --table-name "$DYNAMO_TABLE" --region "$REGION" \
  --query 'Table.TableName' --output text 2>/dev/null || echo "None")

if [[ "$TABLE_EXISTS" != "None" && -n "$TABLE_EXISTS" ]]; then
  warn "DynamoDB table '${DYNAMO_TABLE}' already exists"
else
  info "Creating DynamoDB table '${DYNAMO_TABLE}'..."
  aws dynamodb create-table \
    --table-name "$DYNAMO_TABLE" \
    --region "$REGION" \
    --attribute-definitions \
      AttributeName=PK,AttributeType=S \
      AttributeName=SK,AttributeType=S \
      AttributeName=category,AttributeType=S \
      AttributeName=language,AttributeType=S \
      AttributeName=scheduled_date,AttributeType=S \
      AttributeName=created_at,AttributeType=N \
    --key-schema \
      AttributeName=PK,KeyType=HASH \
      AttributeName=SK,KeyType=RANGE \
    --global-secondary-indexes '[
      {
        "IndexName": "category-language-index",
        "KeySchema": [
          {"AttributeName":"category","KeyType":"HASH"},
          {"AttributeName":"language","KeyType":"RANGE"}
        ],
        "Projection": {"ProjectionType":"ALL"}
      },
      {
        "IndexName": "scheduled-date-index",
        "KeySchema": [
          {"AttributeName":"scheduled_date","KeyType":"HASH"},
          {"AttributeName":"created_at","KeyType":"RANGE"}
        ],
        "Projection": {"ProjectionType":"ALL"}
      }
    ]' \
    --billing-mode PAY_PER_REQUEST \
    > /dev/null

  info "Waiting for table to become active..."
  aws dynamodb wait table-exists --table-name "$DYNAMO_TABLE" --region "$REGION"

  info "Enabling point-in-time recovery..."
  aws dynamodb update-continuous-backups \
    --table-name "$DYNAMO_TABLE" \
    --region "$REGION" \
    --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
    > /dev/null

  ok "Created DynamoDB table with GSIs and PITR enabled"
fi
OUTPUTS[dynamodb_table]="$DYNAMO_TABLE"

# ──────────────────────────────────────────────────────────────
# 3. S3 Bucket
# ──────────────────────────────────────────────────────────────
header "S3 Bucket"

BUCKET_EXISTS=$(aws s3api head-bucket --bucket "$S3_BUCKET" --region "$REGION" 2>/dev/null && echo "yes" || echo "no")

if [[ "$BUCKET_EXISTS" == "yes" ]]; then
  warn "S3 bucket '${S3_BUCKET}' already exists"
else
  info "Creating S3 bucket '${S3_BUCKET}'..."
  aws s3api create-bucket \
    --bucket "$S3_BUCKET" \
    --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION" \
    > /dev/null
  ok "Created S3 bucket"

  info "Blocking all public access..."
  aws s3api put-public-access-block \
    --bucket "$S3_BUCKET" \
    --public-access-block-configuration \
      BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true \
    > /dev/null

  info "Enabling versioning..."
  aws s3api put-bucket-versioning \
    --bucket "$S3_BUCKET" \
    --versioning-configuration Status=Enabled \
    > /dev/null

  info "Setting CORS..."
  aws s3api put-bucket-cors \
    --bucket "$S3_BUCKET" \
    --cors-configuration '{
      "CORSRules": [{
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET"],
        "AllowedOrigins": ["*"],
        "MaxAgeSeconds": 3600
      }]
    }' \
    > /dev/null

  ok "S3 bucket configured (public access blocked, versioning on, CORS set)"
fi
OUTPUTS[s3_bucket]="$S3_BUCKET"

# ──────────────────────────────────────────────────────────────
# 4. CloudFront Distribution with OAC
# ──────────────────────────────────────────────────────────────
header "CloudFront Origin Access Control"

EXISTING_OAC_ID=$(aws cloudfront list-origin-access-controls --region "$REGION" \
  --query "OriginAccessControlList.Items[?Name=='${CF_OAC_NAME}'].Id | [0]" --output text 2>/dev/null || echo "None")

if [[ "$EXISTING_OAC_ID" != "None" && -n "$EXISTING_OAC_ID" ]]; then
  warn "OAC '${CF_OAC_NAME}' already exists: ${EXISTING_OAC_ID}"
  OAC_ID="$EXISTING_OAC_ID"
else
  info "Creating Origin Access Control..."
  OAC_ID=$(aws cloudfront create-origin-access-control \
    --origin-access-control-config "{
      \"Name\": \"${CF_OAC_NAME}\",
      \"Description\": \"OAC for poster-app S3 bucket\",
      \"SigningProtocol\": \"sigv4\",
      \"SigningBehavior\": \"always\",
      \"OriginAccessControlOriginType\": \"s3\"
    }" \
    --query 'OriginAccessControl.Id' --output text)
  ok "Created OAC: ${OAC_ID}"
fi
OUTPUTS[cloudfront_oac_id]="$OAC_ID"

header "CloudFront Distribution"

S3_ORIGIN_DOMAIN="${S3_BUCKET}.s3.${REGION}.amazonaws.com"

EXISTING_DIST_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='${CF_COMMENT}'].Id | [0]" --output text 2>/dev/null || echo "None")

if [[ "$EXISTING_DIST_ID" != "None" && -n "$EXISTING_DIST_ID" ]]; then
  warn "CloudFront distribution already exists: ${EXISTING_DIST_ID}"
  CF_DIST_ID="$EXISTING_DIST_ID"
  CF_DOMAIN=$(aws cloudfront get-distribution --id "$CF_DIST_ID" \
    --query 'Distribution.DomainName' --output text)
else
  info "Creating CloudFront distribution..."
  CALLER_REF="poster-app-$(date +%s)"

  DIST_CONFIG=$(cat <<DISTJSON
{
  "CallerReference": "${CALLER_REF}",
  "Comment": "${CF_COMMENT}",
  "Enabled": true,
  "PriceClass": "PriceClass_200",
  "HttpVersion": "http2and3",
  "DefaultRootObject": "",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-${S3_BUCKET}",
        "DomainName": "${S3_ORIGIN_DOMAIN}",
        "OriginAccessControlId": "${OAC_ID}",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-${S3_BUCKET}",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
    "Compress": true
  },
  "ViewerCertificate": {
    "CloudFrontDefaultCertificate": true
  },
  "Restrictions": {
    "GeoRestriction": {
      "RestrictionType": "none",
      "Quantity": 0
    }
  }
}
DISTJSON
)

  DIST_OUTPUT=$(aws cloudfront create-distribution \
    --distribution-config "$DIST_CONFIG" \
    --query 'Distribution.{Id:Id,DomainName:DomainName}' --output json)

  CF_DIST_ID=$(echo "$DIST_OUTPUT" | python3 -c "import sys,json; print(json.load(sys.stdin)['Id'])")
  CF_DOMAIN=$(echo "$DIST_OUTPUT" | python3 -c "import sys,json; print(json.load(sys.stdin)['DomainName'])")

  ok "Created CloudFront distribution: ${CF_DIST_ID}"
  ok "Domain: ${CF_DOMAIN}"
fi
OUTPUTS[cloudfront_distribution_id]="$CF_DIST_ID"
OUTPUTS[cloudfront_domain]="$CF_DOMAIN"

# ──────────────────────────────────────────────────────────────
# 5. S3 Bucket Policy for CloudFront OAC
# ──────────────────────────────────────────────────────────────
header "S3 Bucket Policy (CloudFront OAC)"

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)

BUCKET_POLICY=$(cat <<BPJSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipalReadOnly",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::${S3_BUCKET}/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::${AWS_ACCOUNT_ID}:distribution/${CF_DIST_ID}"
        }
      }
    }
  ]
}
BPJSON
)

aws s3api put-bucket-policy --bucket "$S3_BUCKET" --policy "$BUCKET_POLICY" > /dev/null
ok "Bucket policy applied for CloudFront OAC"

# ──────────────────────────────────────────────────────────────
# Save outputs
# ──────────────────────────────────────────────────────────────
save_outputs
ok "Outputs saved to ${OUTPUTS_FILE}"

# ──────────────────────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║           POSTER APP — INFRASTRUCTURE SUMMARY           ║${NC}"
echo -e "${BOLD}╠══════════════════════════════════════════════════════════╣${NC}"
echo -e "${BOLD}║${NC} Region:              ${GREEN}${REGION}${NC}"
echo -e "${BOLD}║${NC}"
echo -e "${BOLD}║${NC} ${CYAN}Cognito${NC}"
echo -e "${BOLD}║${NC}   User Pool ID:     ${GREEN}${OUTPUTS[cognito_user_pool_id]}${NC}"
echo -e "${BOLD}║${NC}   Client ID:        ${GREEN}${OUTPUTS[cognito_client_id]}${NC}"
echo -e "${BOLD}║${NC}"
echo -e "${BOLD}║${NC} ${CYAN}DynamoDB${NC}"
echo -e "${BOLD}║${NC}   Table:            ${GREEN}${OUTPUTS[dynamodb_table]}${NC}"
echo -e "${BOLD}║${NC}"
echo -e "${BOLD}║${NC} ${CYAN}S3${NC}"
echo -e "${BOLD}║${NC}   Bucket:           ${GREEN}${OUTPUTS[s3_bucket]}${NC}"
echo -e "${BOLD}║${NC}"
echo -e "${BOLD}║${NC} ${CYAN}CloudFront${NC}"
echo -e "${BOLD}║${NC}   Distribution ID:  ${GREEN}${OUTPUTS[cloudfront_distribution_id]}${NC}"
echo -e "${BOLD}║${NC}   Domain:           ${GREEN}${OUTPUTS[cloudfront_domain]}${NC}"
echo -e "${BOLD}║${NC}   OAC ID:           ${GREEN}${OUTPUTS[cloudfront_oac_id]}${NC}"
echo -e "${BOLD}╠══════════════════════════════════════════════════════════╣${NC}"
echo -e "${BOLD}║${NC} ${YELLOW}TODO: Update Google IdP credentials in Cognito Console${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Add these to your ${BOLD}.env${NC} files:"
echo ""
echo "  AWS_REGION=${REGION}"
echo "  COGNITO_USER_POOL_ID=${OUTPUTS[cognito_user_pool_id]}"
echo "  COGNITO_CLIENT_ID=${OUTPUTS[cognito_client_id]}"
echo "  DYNAMODB_TABLE=${OUTPUTS[dynamodb_table]}"
echo "  S3_BUCKET=${OUTPUTS[s3_bucket]}"
echo "  CDN_BASE_URL=https://${OUTPUTS[cloudfront_domain]}"
echo ""
