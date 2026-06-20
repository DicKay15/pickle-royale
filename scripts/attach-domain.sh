#!/bin/bash
# Attach pickleball.dhrumilkherde.com to the pickle-royale Worker.
# One-time setup (persists on the Worker). Uses the wrangler OAuth token.
# We do this via API instead of `routes` in wrangler.jsonc because a
# custom_domain route entry breaks asset serving in local `wrangler dev`.
set -euo pipefail

ACCOUNT_ID="a74fc73b8e2049957ad79d6f94b545a2"
HOSTNAME="pickleball.dhrumilkherde.com"
SERVICE="pickle-royale"

TOKEN=$(grep oauth_token ~/Library/Preferences/.wrangler/config/default.toml | cut -d'"' -f2)

ZONE_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.cloudflare.com/client/v4/zones?name=dhrumilkherde.com" |
  python3 -c "import json,sys; print(json.load(sys.stdin)['result'][0]['id'])")

curl -s -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/domains" \
  -d "{\"zone_id\":\"$ZONE_ID\",\"hostname\":\"$HOSTNAME\",\"service\":\"$SERVICE\",\"environment\":\"production\"}" |
  python3 -m json.tool
