# TOPZY Complete Frontend Source

This bundle contains the complete current frontend source files:
- `index.html`
- `style.css`
- `script.js`

## Screens included
- Responsive marketing homepage and catalogue for all 20 planned games
- Game search and category filter
- Game detail/unavailable state
- Register and login screens
- Customer account shell: overview, order history, wallet, profile and support tickets
- Owner admin dashboard shell
- Responsive mobile navigation and layouts

## Integration status
This is a complete frontend UI/source bundle, but it does not make live payments or deliver top-ups by itself. Account, wallet, order, support and admin data require matching authenticated backend endpoints. Wallet funding and ticket/profile mutations remain disabled until those secure endpoints are implemented and tested. Games default to unavailable; they are enabled only when the API returns `is_active: true`.

Set `window.TOPZY_API_BASE` before `script.js` if the backend is on another domain. The public catalogue expects `GET /api/v1/games`. Auth form expects `POST /api/v1/auth/register` and `POST /api/v1/auth/login`; align these routes with the final backend before launch. Never place service-role or supplier secrets in frontend files.
