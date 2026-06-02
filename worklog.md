---
Task ID: 1
Agent: Main Agent
Task: Fix TikTok Shop OAuth connection - critical bug fix

Work Log:
- Diagnosed the root cause: the `code` parameter from TikTok OAuth was NEVER sent to the token exchange endpoint
- Created shared token storage module (`/lib/tiktok-token.ts`) to replace unreliable external HTTP POST
- Rewrote `/api/tiktok/route.ts` with fixes:
  - Added `code` parameter to token exchange query params (CRITICAL FIX)
  - Changed auth URL from `/oauth/authorize/seller` to `/oauth/authorize/creator`
  - Added better error logging and debug info
  - Added disconnect action
- Rewrote `/api/tiktok/callback/route.ts` with fixes:
  - Added `code` parameter to token exchange (CRITICAL FIX)
  - Direct token storage via shared module (no external HTTP call)
  - Detailed error messages returned to user
- Updated `tienda.tsx` TikTokTienda component:
  - Removed fallback mode (opens TikTok in new tab)
  - Only API commission mode
  - Search disabled when not connected
  - Shows commission amount per product
  - Prominent connect button when not connected
- Pushed to GitHub (Plataformachambatina repo: 731a124)

Stage Summary:
- Critical OAuth bug fixed: code parameter now properly sent to token exchange
- Fallback mode removed per user request
- Deployment to Render should auto-deploy from GitHub push
- User MUST verify: env vars TIKTOK_APP_KEY, TIKTOK_APP_SECRET in Render
- User MUST configure redirect_uri in partner.tiktokshop.com
