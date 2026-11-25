# TOPZY Backend

Node.js + Express API backed by Supabase.

## Setup

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env`.
3. Add your Supabase project URL and service-role key to `.env`.
4. Run `npm install`.
5. Run `npm start`.

Health check: `GET /api/health`

## Authentication

Protected routes expect `Authorization: Bearer <Supabase access token>`.
Users sign in through Supabase Auth from the frontend. This API verifies the token
with Supabase before serving protected data.

## Deployment

Set the environment variables in Render and use:
- Build command: `npm install`
- Start command: `npm start`

## Important integration status

This package provides the API foundation and Supabase-backed routes. It does not
pretend that a payment gateway or supplier has been connected. Payment initialization
returns HTTP 501 until a real gateway adapter and verified webhook are implemented.
Supplier routing is not live until provider credentials, adapters, and order-state
handling are configured.

Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code or commit a real `.env`.
