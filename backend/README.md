# Bilal Broast — Backend (initial scaffold)

This is the initial Express + Mongoose scaffold for the Bilal Broast project. It contains a minimal API and product model to match the existing frontend.

Run locally:

```bash
cd backend
pnpm install # or npm install
cp .env.example .env && edit .env
pnpm run dev
```

Customer endpoints:

- `POST /api/customers` — create a customer with `name`, `mobileNumber`, and `address`.
- `GET /api/customers` — list customers; each item includes its MongoDB `_id`.
- `DELETE /api/customers/:id` — permanently delete a customer using its MongoDB `_id` (from the list response). Does not require login. Returns `400` for an invalid ID and `404` if no customer exists.
