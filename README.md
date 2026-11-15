# ShopLink: your shop, one link

A full-stack web app that lets a local shop owner build a mobile storefront, share one link, and receive orders on WhatsApp.
Built by Yazhini R (frontend and UI/UX) and Shanton Jeffry Rudolf B (backend, database and AI).

## Run it
Needs Node 20+ and a Supabase project.

    cd server && cp .env.example .env     # set Supabase URL/key and JWT_SECRET, optionally ANTHROPIC_API_KEY
    # Run server/supabase/schema.sql in the Supabase SQL Editor
    npm install && npm run dev            # API on http://localhost:4000
    cd ../client && npm install && npm run dev   # app on http://localhost:5173 (proxies /api to the server)

Server tests: `cd server && npm test`.

## What is inside
| Area | Where |
|---|---|
| Landing, How it works | client/src/pages/Marketing.jsx |
| Sign up, log in (httpOnly cookie JWT, bcrypt) | server/src/auth.js, client/src/pages/AuthPage.jsx |
| Onboarding, products (CRUD, image upload), orders | server/src/owner.js, client/src/pages/Owner.jsx |
| Store builder with live phone preview | Builder in Owner.jsx, client/src/store.jsx |
| Public storefront, cart, WhatsApp checkout | server/src/public.js, client/src/pages/Storefront.jsx |
| Dashboard, insights, recommendations | server/src/insights.js, client/src/pages/Dashboard.jsx |
| AI (describe, translate, price, summary) | server/src/ai.js, server/src/aiService.js |
| Data models | server/src/models.js |

The backend stores application data in Supabase Postgres using the server-only
`SUPABASE_SERVICE_ROLE_KEY`. Never put this key in the client. Existing MongoDB
records are not copied automatically; export/import them separately if needed.

## AI notes
- The AI key lives only on the server. Without `ANTHROPIC_API_KEY`, descriptions and summaries fall back to simple templates and translation shows a clear error.
- Photo-based descriptions need a public HTTPS image URL, so use Cloudinary or S3 in production.
- Prices in orders always come from the database, never from the browser.

## Before you deploy
- Replace local image uploads (server/uploads) with Cloudinary or S3.
- Serve client and API on one domain (or set CLIENT_ORIGIN and cookie settings) and use HTTPS.
- Add per-shop custom domains, email notifications and more tests as the next steps.
