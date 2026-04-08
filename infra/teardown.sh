#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# Poster App — AWS Infrastructure Teardown
# Deletes all resources created by setup.sh
# ──────────────────────────────────────────────────────────────

REGION="ap-south-1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUTS_FILE="${SCRIPT_DIR}/outputs.json"

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

# Load outputs if available
if [[ -f "$OUTPUTS_FILE" ]]; then
  COGNITO_POOL_ID=$(python3 -c "import json; print(json.load(open('${OUTPUTS_FILE}'))['cognito_user_pool_id'])" 2>/dev/null || echo "")
  DYNAMO_TABLE=$(python3 -c "import json; print(json.load(open('${OUTPUTS_FILE}'))['dynamodb_table'])" 2>/dev/null || echo "")
  S3_BUCKET=$(python3 -c "import json; print(json.load(open('${OUTPUTS_FILE}'))['s3_bucket'])" 2>/dev/null || echo "")
  CF_DIST_ID=$(python3 -c "import json; print(json.load(open('${OUTPUTS_FILE}'))['cloudfront_distribution_id'])" 2>/dev/null || echo "")
  CF_OAC_ID=$(python3 -c "import json; print(json.load(open('${OUTPUTS_FILE}'))['cloudfront_oac_id'])" 2>/dev/null || echo "")
else
  # Fallback to known names
  COGNITO_POOL_ID=""
  DYNAMO_TABLE="poster-app"
  S3_BUCKET="poster-app-assets-techveda"
  CF_DIST_ID=""
  CF_OAC_ID=""
fi

echo ""
echo -e "${RED}${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}${BOLD}║       POSTER APP — INFRASTRUCTURE TEARDOWN               ║${NC}"
echo -e "${RED}${BOLD}║       This will DELETE all AWS resources!                 ║${NC}"
echo -e "${RED}${BOLD}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Resources to delete:"
echo -e "  - Cognito User Pool:    ${COGNITO_POOL_ID:-<will discover>}"
echo -e "  - DynamoDB Table:       ${DYNAMO_TABLE}"
echo -e "  - S3 Bucket:            ${S3_BUCKET} (and all objects)"
echo -e "  - CloudFront Dist:      ${CF_DIST_ID:-<will discover>}"
echo -e "  - CloudFront OAC:       ${CF_OAC_ID:-<will discover>}"
echo ""
read -rp "Type 'DELETE' to confirm: " CONFIRM
if [[ "$CONFIRM" != "DELETE" ]]; then
  echo -e "${YELLOW}Aborted.${NC}"
  exit 0
fi
echo ""

# ──────────────────────────────────────────────────────────────
# 1. CloudFront Distribution
# ──────────────────────────────────────────────────────────────
info "Disabling and deleting CloudFront distribution..."

if [[ -z "$CF_DIST_ID" ]]; then
  CF_DIST_ID=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?Comment=='poster-app-distribution'].Id | [0]" \
    --output text 2>/dev/null || echo "None")
fi

if [[ "$CF_DIST_ID" != "None" && -n "$CF_DIST_ID" ]]; then
  # Get current config and ETag
  DIST_INFO=$(aws cloudfront get-distribution-config --id "$CF_DIST_ID" --output json 2>/dev/null || echo "")

  if [[ -n "$DIST_INFO" ]]; then
    ETAG=$(echo "$DIST_INFO" | python3 -c "import sys,json; print(json.load(sys.stdin)['ETag'])")
    IS_ENABLED=$(echo "$DIST_INFO" | python3 -c "import sys,json; print(json.load(sys.stdin)['DistributionConfig']['Enabled'])")

    if [[ "$IS_ENABLED" == "True" ]]; then
      info "Disabling distribution (this may take several minutes)..."
      DISABLED_CONFIG=$(echo "$DIST_INFO" | python3 -c "
import sys, json
data = json.load(sys.stdin)
config = data['DistributionConfig']
config['Enabled'] = False
print(json.dumps(config))
")
      ETAG=$(aws cloudfront update-distribution \
        --id "$CF_DIST_ID" \
        --distribution-config "$DISABLED_CONFIG" \
        --if-match "$ETAG" \
        --query 'ETag' --output text)

      info "Waiting for distribution to be fully disabled (can take 5-15 min)..."
      aws cloudfront wait distribution-deployed --id "$CF_DIST_ID"

      # Re-fetch ETag after deploy
      ETAG=$(aws cloudfront get-distribution-config --id "$CF_DIST_ID" \
        --query 'ETag' --output text)
    fi

    aws cloudfront delete-distribution --id "$CF_DIST_ID" --if-match "$ETAG"
    ok "Deleted CloudFront distribution: ${CF_DIST_ID}"
  fi
else
  warn "No CloudFront distribution found"
fi

# ── OAC ──
if [[ -z "$CF_OAC_ID" ]]; then
  CF_OAC_ID=$(aws cloudfront list-origin-access-controls \
    --query "OriginAccessControlList.Items[?Name=='poster-app-oac'].Id | [0]" \
    --output text 2>/dev/null || echo "None")
fi

if [[ "$CF_OAC_ID" != "None" && -n "$CF_OAC_ID" ]]; then
  OAC_ETAG=$(aws cloudfront get-origin-access-control --id "$CF_OAC_ID" \
    --query 'ETag' --output text 2>/dev/null || echo "")
  if [[ -n "$OAC_ETAG" ]]; then
    aws cloudfront delete-origin-access-control --id "$CF_OAC_ID" --if-match "$OAC_ETAG"
    ok "Deleted OAC: ${CF_OAC_ID}"
  fi
else
  warn "No OAC found"
fi

# ──────────────────────────────────────────────────────────────
# 2. S3 Bucket (must empty first)
# ──────────────────────────────────────────────────────────────
info "Emptying and deleting S3 bucket..."

if aws s3api head-bucket --bucket "$S3_BUCKET" --region "$REGION" 2>/dev/null; then
  info "Removing all objects (including versions)..."
  aws s3api list-object-versions --bucket "$S3_BUCKET" --region "$REGION" \
    --query '{Objects: Versions[].{Key:Key,VersionId:VersionId}}' --output json 2>/dev/null | \
    python3 -c "
import sys, json, subprocess
data = json.load(sys.stdin)
objects = data.get('Objects') or []
if not objects:
    sys.exit(0)
# Batch delete in groups of 1000
for i in range(0, len(objects), 1000):
    batch = objects[i:i+1000]
    delete_payload = json.dumps({'Objects': batch, 'Quiet': True})
    subprocess.run([
        'aws', 's3api', 'delete-objects',
        '--bucket', '${S3_BUCKET}',
        '--region', '${REGION}',
        '--delete', delete_payload
    ], check=True, capture_output=True)
" 2>/dev/null || true

  # Also delete delete markers
  aws s3api list-object-versions --bucket "$S3_BUCKET" --region "$REGION" \
    --query '{Objects: DeleteMarkers[].{Key:Key,VersionId:VersionId}}' --output json 2>/dev/null | \
    python3 -c "
import sys, json, subprocess
data = json.load(sys.stdin)
objects = data.get('Objects') or []
if not objects:
    sys.exit(0)
for i in range(0, len(objects), 1000):
    batch = objects[i:i+1000]
    delete_payload = json.dumps({'Objects': batch, 'Quiet': True})
    subprocess.run([
        'aws', 's3api', 'delete-objects',
        '--bucket', '${S3_BUCKET}',
        '--region', '${REGION}',
        '--delete', delete_payload
    ], check=True, capture_output=True)
" 2>/dev/null || true

  aws s3api delete-bucket --bucket "$S3_BUCKET" --region "$REGION"
  ok "Deleted S3 bucket: ${S3_BUCKET}"
else
  warn "S3 bucket '${S3_BUCKET}' not found"
fi

# ──────────────────────────────────────────────────────────────
# 3. DynamoDB Table
# ──────────────────────────────────────────────────────────────
info "Deleting DynamoDB table..."

if aws dynamodb describe-table --table-name "$DYNAMO_TABLE" --region "$REGION" > /dev/null 2>&1; then
  aws dynamodb delete-table --table-name "$DYNAMO_TABLE" --region "$REGION" > /dev/null
  info "Waiting for table deletion..."
  aws dynamodb wait table-not-exists --table-name "$DYNAMO_TABLE" --region "$REGION"
  ok "Deleted DynamoDB table: ${DYNAMO_TABLE}"
else
  warn "DynamoDB table '${DYNAMO_TABLE}' not found"
fi

# ──────────────────────────────────────────────────────────────
# 4. Cognito User Pool
# ──────────────────────────────────────────────────────────────
info "Deleting Cognito User Pool..."

if [[ -z "$COGNITO_POOL_ID" ]]; then
  COGNITO_POOL_ID=$(aws cognito-idp list-user-pools --max-results 60 --region "$REGION" \
    --query "UserPools[?Name=='poster-app-users'].Id | [0]" --output text 2>/dev/null || echo "None")
fi

if [[ "$COGNITO_POOL_ID" != "None" && -n "$COGNITO_POOL_ID" ]]; then
  # Delete domain if exists (required before pool deletion)
  DOMAIN=$(aws cognito-idp describe-user-pool --user-pool-id "$COGNITO_POOL_ID" --region "$REGION" \
    --query 'UserPool.Domain' --output text 2>/dev/null || echo "None")
  if [[ "$DOMAIN" != "None" && -n "$DOMAIN" ]]; then
    aws cognito-idp delete-user-pool-domain --user-pool-id "$COGNITO_POOL_ID" --domain "$DOMAIN" --region "$REGION" 2>/dev/null || true
  fi

  aws cognito-idp delete-user-pool --user-pool-id "$COGNITO_POOL_ID" --region "$REGION"
  ok "Deleted Cognito User Pool: ${COGNITO_POOL_ID}"
else
  warn "Cognito User Pool not found"
fi

# ──────────────────────────────────────────────────────────────
# Cleanup
# ──────────────────────────────────────────────────────────────
if [[ -f "$OUTPUTS_FILE" ]]; then
  rm "$OUTPUTS_FILE"
  ok "Removed ${OUTPUTS_FILE}"
fi

echo ""
echo -e "${GREEN}${BOLD}All resources deleted successfully.${NC}"
echo ""
