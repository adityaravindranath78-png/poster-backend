#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# Poster App — Seed Templates
# Uploads template JSONs to S3 and inserts metadata into DynamoDB
# ──────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUTS_FILE="${SCRIPT_DIR}/outputs.json"
TEMPLATES_DIR="${SCRIPT_DIR}/../templates"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()   { echo -e "${RED}[ERR]${NC}   $*"; exit 1; }

# ── Validate prerequisites ──
if [[ ! -f "$OUTPUTS_FILE" ]]; then
  err "outputs.json not found. Run setup.sh first."
fi

if [[ ! -d "$TEMPLATES_DIR" ]]; then
  err "Templates directory not found at ${TEMPLATES_DIR}. Create it with seed template JSONs."
fi

# ── Read config from outputs ──
REGION=$(python3 -c "import json; print(json.load(open('${OUTPUTS_FILE}'))['region'])")
S3_BUCKET=$(python3 -c "import json; print(json.load(open('${OUTPUTS_FILE}'))['s3_bucket'])")
DYNAMO_TABLE=$(python3 -c "import json; print(json.load(open('${OUTPUTS_FILE}'))['dynamodb_table'])")
CDN_DOMAIN=$(python3 -c "import json; print(json.load(open('${OUTPUTS_FILE}'))['cloudfront_domain'])")

info "Region:     ${REGION}"
info "S3 Bucket:  ${S3_BUCKET}"
info "DynamoDB:   ${DYNAMO_TABLE}"
info "CDN:        ${CDN_DOMAIN}"
echo ""

# ── Count templates ──
TEMPLATE_FILES=("${TEMPLATES_DIR}"/*.json)
if [[ ! -f "${TEMPLATE_FILES[0]}" ]]; then
  err "No JSON files found in ${TEMPLATES_DIR}"
fi

TOTAL=${#TEMPLATE_FILES[@]}
info "Found ${TOTAL} template file(s) to seed"
echo ""

UPLOADED=0
FAILED=0

for TEMPLATE_FILE in "${TEMPLATE_FILES[@]}"; do
  FILENAME=$(basename "$TEMPLATE_FILE")
  TEMPLATE_ID="${FILENAME%.json}"

  info "Processing: ${FILENAME}"

  # Validate JSON
  if ! python3 -c "import json; json.load(open('${TEMPLATE_FILE}'))" 2>/dev/null; then
    warn "Invalid JSON, skipping: ${FILENAME}"
    FAILED=$((FAILED + 1))
    continue
  fi

  # ── Upload to S3 ──
  S3_KEY="templates/${TEMPLATE_ID}/${FILENAME}"
  aws s3 cp "$TEMPLATE_FILE" "s3://${S3_BUCKET}/${S3_KEY}" \
    --region "$REGION" \
    --content-type "application/json" \
    --quiet

  # ── Upload associated assets (images, etc.) ──
  ASSETS_DIR="${TEMPLATES_DIR}/${TEMPLATE_ID}"
  if [[ -d "$ASSETS_DIR" ]]; then
    ASSET_COUNT=$(find "$ASSETS_DIR" -type f ! -name "*.json" | wc -l | tr -d ' ')
    if [[ "$ASSET_COUNT" -gt 0 ]]; then
      info "  Uploading ${ASSET_COUNT} asset(s) from ${TEMPLATE_ID}/"
      aws s3 sync "$ASSETS_DIR" "s3://${S3_BUCKET}/templates/${TEMPLATE_ID}/assets/" \
        --region "$REGION" \
        --exclude "*.json" \
        --quiet
    fi
  fi

  # ── Extract metadata from template JSON and insert into DynamoDB ──
  DYNAMO_ITEM=$(python3 - "$TEMPLATE_FILE" "$TEMPLATE_ID" "$S3_KEY" "$CDN_DOMAIN" <<'PYEOF'
import json, sys, time

template_file = sys.argv[1]
template_id = sys.argv[2]
s3_key = sys.argv[3]
cdn_domain = sys.argv[4]

with open(template_file) as f:
    tmpl = json.load(f)

now_ms = int(time.time() * 1000)

# Resolve tags — template JSONs use "tags" as a list
tags = tmpl.get("tags", ["general"])
if not tags:
    tags = ["general"]

# Build DynamoDB item
item = {
    "PK": {"S": f"TEMPLATE#{template_id}"},
    "SK": {"S": "META"},
    "template_id": {"S": template_id},
    "name": {"S": tmpl.get("name", template_id)},
    "category": {"S": tmpl.get("category", "general")},
    "subcategory": {"S": tmpl.get("subcategory", tmpl.get("category", "general"))},
    "language": {"S": tmpl.get("language", "en")},
    "tags": {"L": [{"S": t} for t in tags]},
    "tags_str": {"S": ",".join(tags).lower()},
    "template_url": {"S": f"https://{cdn_domain}/{s3_key}"},
    "thumbnail_url": {"S": tmpl.get("thumbnail_url", f"https://{cdn_domain}/templates/{template_id}/thumb.webp")},
    "width": {"N": str(tmpl.get("width", 1080))},
    "height": {"N": str(tmpl.get("height", 1080))},
    "premium": {"BOOL": tmpl.get("premium", tmpl.get("is_premium", False))},
    "is_active": {"BOOL": True},
    "created_at": {"N": str(tmpl.get("created_at", now_ms))},
    "updated_at": {"N": str(now_ms)}
}

# Add scheduled_date if present (for scheduled/event templates)
if "scheduled_date" in tmpl:
    item["scheduled_date"] = {"S": tmpl["scheduled_date"]}

print(json.dumps(item))
PYEOF
)

  aws dynamodb put-item \
    --table-name "$DYNAMO_TABLE" \
    --region "$REGION" \
    --item "$DYNAMO_ITEM" \
    > /dev/null

  UPLOADED=$((UPLOADED + 1))
  ok "  Seeded: ${TEMPLATE_ID}"
done

echo ""
echo -e "${BOLD}━━━ Seed Summary ━━━${NC}"
echo -e "  ${GREEN}Uploaded:${NC} ${UPLOADED}/${TOTAL}"
if [[ "$FAILED" -gt 0 ]]; then
  echo -e "  ${RED}Failed:${NC}   ${FAILED}/${TOTAL}"
fi
echo ""
ok "Template seeding complete"
