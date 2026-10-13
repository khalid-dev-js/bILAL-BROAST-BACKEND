# Bilal Broast API Reference

Base URL:

```text
http://localhost:4000/api
```

## Postman setup

1. Start the backend with `npm run dev`.
2. Use `Content-Type: application/json` for JSON requests.
3. Login first. The server sets an HTTP-only `token` cookie. Keep Postman's cookie jar enabled so protected requests reuse it.
4. Admin endpoints require logging in with the admin account from `.env`.

All protected requests use the HTTP-only `token` cookie. Never send or store the JWT in localStorage.

## Health

### GET `/health`

Public health check. No body.

## Public products

### GET `/products`

Optional query parameters:

```text
page=1
limit=12
category=broast
search=chicken
minPrice=200
maxPrice=1500
sort=price_asc
isDeal=true
isFeatured=true
isAvailable=true
```

`sort` values: `price_asc`, `price_desc`, `popularity`. Products can also be filtered with `isDeal`, `isFeatured`, and `isAvailable`.

### GET `/products/:slug`

Example:

```text
GET /api/products/chicken-broast
```

## Public categories

### GET `/categories`

Returns active categories sorted by `sortOrder` and name. No body.

### GET `/categories/:slug`

Example:

```text
GET /api/categories/broast
```

## Authentication

### POST `/auth/register`

Required JSON:

```json
{
  "name": "Bilal",
  "email": "bilal@example.com",
  "password": "secret123"
}
```

Optional field: `phone`.

### POST `/auth/login`

```json
{
  "email": "bilal@example.com",
  "password": "secret123"
}
```

The same login endpoint is used for customers and admins. Inspect `data.role` in the response:

- `customer` -> customer UI
- `admin` -> dashboard UI

### POST `/auth/admin-login`

Admin-only login endpoint. Same body as `/auth/login`; only an active user with `role: admin` is accepted.

### Admin web-push subscriptions

The authenticated admin web dashboard registers its browser subscription with:

```text
POST /api/admin/push-subscriptions
DELETE /api/admin/push-subscriptions
```

Both endpoints require the admin login cookie. Send the `PushSubscription.toJSON()` object when registering and `{ "endpoint": "..." }` when unregistering. Browser push credentials are stored per admin and device; VAPID private keys must only be configured in the backend environment.

### GET `/auth/me`

Requires login cookie. No body.

### POST `/auth/logout`

No body.

### PATCH `/auth/profile`

```json
{
  "name": "Bilal Ahmed",
  "phone": "03001234567"
}
```

### PATCH `/auth/change-password`

```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password-123"
}
```

## Customer cart

All cart endpoints require login cookie.

### GET `/cart`

No body.

### POST `/cart/items`

`productId` accepts a product MongoDB `_id` or product `slug`.

```json
{
  "productId": "chicken-broast",
  "quantity": 2
}
```

### PATCH `/cart/items/:productId`

```json
{
  "quantity": 3
}
```

### DELETE `/cart/items/:productId`

No body.

### DELETE `/cart`

Clears the cart. No body.

### POST `/cart/sync`

```json
{
  "items": [
    { "productId": "chicken-broast", "quantity": 2 },
    { "productId": "zinger-burger", "quantity": 1 }
  ]
}
```

## POS customers

These endpoints are used by the POS and do not require login.

### POST `/customers`

Adds a customer. All three fields are required:

```json
{
  "name": "Bilal Ahmed",
  "mobileNumber": "03001234567",
  "address": "House 10, Main Road"
}
```

### GET `/customers`

Returns all customers with their `name`, `mobileNumber`, and `address`, newest first.

## Customer orders

Placing an order does not require login. Order history and management endpoints require a login cookie.

### POST `/orders`

```json
{
  "items": [
    { "productId": "chicken-broast", "quantity": 2 }
  ],
  "deliveryAddress": {
    "fullName": "Bilal Ahmed",
    "phone": "03001234567",
    "address": "House 10, Main Road",
    "city": "Lahore",
    "area": "DHA",
    "notes": "Call before delivery"
  },
  "paymentMethod": "cod"
}
```

`deliveryAddress.fullName`, `deliveryAddress.phone`, and `deliveryAddress.address` are required. `paymentMethod` is required and must be `cod` or `online`. `email` is optional. Product prices and totals are calculated by the server.

For logged-in customers, the server associates the order with their account and clears their backend cart after successful order creation. Guest orders are saved with the submitted contact details and are visible to admins, but do not appear in a personal order history.

### GET `/orders/my`

Requires login. Returns the logged-in customer's orders. No body.

### GET `/orders/:id`

Returns one customer's order. No body.

### PATCH `/orders/:id/cancel`

Cancels an order only while its status is `pending` or `confirmed`. No body.

### POST `/orders/:id/reorder`

Creates a new order from an old order. No body.

## Admin products

All admin endpoints require admin login cookie.

### POST `/admin/products`

Required minimum JSON:

```json
{
  "name": "Chicken Broast",
  "slug": "chicken-broast",
  "price": 650
}
```

Optional product fields:

```json
{
  "description": "Crispy chicken broast",
  "category": "broast",
  "originalPrice": 750,
  "image": "https://example.com/image.jpg",
  "images": [],
  "ingredients": ["Chicken", "Spices"],
  "isPopular": true,
  "isDeal": false,
  "isFeatured": true,
  "isAvailable": true,
  "stockStatus": "in_stock",
  "preparationTime": 20
}
```

### GET `/admin/products`

Optional query parameters:

```text
page=1
limit=20
search=chicken
```

Admin product list currently supports `page`, `limit`, and `search`. Product creation/update accepts the product fields shown below.

### GET `/admin/products/:id`

### PATCH `/admin/products/:id`

Send any fields to update, for example:

```json
{
  "price": 700,
  "isAvailable": true
}
```

### DELETE `/admin/products/:id`

### PATCH `/admin/products/:id/availability`

```json
{
  "available": false
}
```

### PATCH `/admin/products/:id/featured`

```json
{
  "featured": true
}
```

## Admin categories

### POST `/admin/categories`

```json
{
  "name": "Broast",
  "slug": "broast",
  "description": "Broast items",
  "image": "https://example.com/category.jpg",
  "isActive": true,
  "sortOrder": 1
}
```

Only `name` is required. `slug` is generated when omitted.

### GET `/admin/categories`

### GET `/admin/categories/:id`

### PATCH `/admin/categories/:id`

Send fields to update, for example:

```json
{
  "name": "Chicken Broast",
  "isActive": true
}
```

### DELETE `/admin/categories/:id`

A category containing products cannot be deleted.

## Admin orders

### GET `/admin/orders`

Optional query parameters:

```text
page=1
limit=20
status=pending
orderStatus=pending
paymentStatus=paid
search=BB-123456
dateFrom=2026-09-01
dateTo=2026-09-14
sort=newest
isCallOrder=true
```

`search` matches order number, customer name, email, or phone. `sort` values are `newest`, `oldest`, `total_high`, and `total_low`. Optional `isCallOrder=true|false` filters orders by call-order status.

### POST `/admin/orders/local`

Creates a completed local/POS order. No login is required. `productId` accepts a product MongoDB `_id` or slug. Product prices and the total are calculated by the server; local orders have no delivery fee and are marked paid.

```json
{
  "items": [
    { "productId": "chicken-broast", "quantity": 2 },
    { "productId": "zinger-burger", "quantity": 1 }
  ],
  "paymentMethod": "cash",
  "customerName": "Bilal Ahmed",
  "isCallOrder": true
}
```

`paymentMethod` is required and must be `cash` or `online`. The response includes `createdAt` as an ISO 8601 UTC timestamp, plus item snapshots, quantities, payment method, and `grandTotal`.
`customerName` is optional. `isCallOrder` is optional and defaults to `false`.

### GET `/admin/orders/local`

Returns all local orders, newest first. Optional date/time filters:

```text
dateFrom=2026-10-06
dateTo=2026-10-06
isCallOrder=true
```

No login is required. Use `isCallOrder=true` or `isCallOrder=false` to filter local orders by call-order status. Date-only values include the full UTC day. Exact timestamp boundaries can also be supplied as ISO 8601 values, for example `dateFrom=2026-10-06T10:00:00.000Z&dateTo=2026-10-06T18:00:00.000Z`. Both filters are inclusive.

Order status values:

```text
pending
confirmed
preparing
ready
out_for_delivery
delivered
cancelled
```

### GET `/admin/orders/:id`

### PATCH `/admin/orders/:id/status`

```json
{
  "orderStatus": "preparing"
}
```

### PATCH `/admin/orders/:id/payment`

```json
{
  "paymentStatus": "paid"
}
```

Payment status values: `pending`, `paid`, `failed`, `refunded`.

## Admin dashboard

All require admin login cookie and have no body:

```text
GET /admin/dashboard/stats
GET /admin/dashboard/recent-orders
GET /admin/dashboard/top-products
GET /admin/dashboard/revenue?period=today
GET /admin/dashboard/revenue?period=week
GET /admin/dashboard/revenue?period=month
GET /admin/dashboard/revenue?period=year
GET /admin/dashboard/order-breakdown
GET /admin/dashboard/live-orders
```

`/stats` returns `todayOrders`, `todayRevenue`, `pendingOrders`, `totalCustomers`, `totalProducts`, and `averageOrderValue`.

`/order-breakdown` returns counts for `pending`, `confirmed`, `preparing`, `ready`, `out_for_delivery`, `delivered`, and `cancelled`.

## Cloudinary uploads

### POST `/admin/uploads/image`

Use `multipart/form-data`:

| Key | Type | Required |
|---|---|---|
| `file` | File | Yes |
| `folder` | Text | No |

### DELETE `/admin/uploads/image`

```json
{
  "publicId": "bilal-broast/products/image_name"
}
```

Upload constraints: `file` is required, accepted MIME types are JPEG, PNG, and WebP, maximum size is 5 MB, and the default folder is `bilal-broast/products`.

## Socket.IO events

```text
admin:join
customer:join
order:new
order:cancelled
order:status-updated
order:payment-updated
```

Socket server URL:

```text
http://localhost:4000
```

Frontend Socket.IO clients should use `withCredentials: true`, reconnect automatically, and emit `admin:join` after the `connect` event. On reconnect, refetch `/admin/orders?page=1&limit=100&sort=newest` as a fallback.
