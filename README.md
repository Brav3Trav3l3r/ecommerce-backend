# Ecommerce Store — Backend

A Node.js + Express + TypeScript REST API for an ecommerce store with cart management, checkout, and a discount/coupon system.

---

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express 5
- **Language:** TypeScript (strict mode)
- **Testing:** Jest + ts-jest
- **Storage:** In-memory (no database required)

---

## Setup

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
npm install
```

### Environment

Create a `.env` file in the project root:

```
PORT=3000
N_TH_ORDER=5
DISCOUNT_PERCENT=10
ADMIN_KEY=admin-secret
```

| Variable           | Description                                              | Default        |
|--------------------|----------------------------------------------------------|----------------|
| `PORT`             | Port the server listens on                               | `3000`         |
| `N_TH_ORDER`       | Every nth order triggers a discount coupon               | `5`            |
| `DISCOUNT_PERCENT` | Percentage discount applied by generated coupons         | `10`           |
| `ADMIN_KEY`        | Secret key required in `X-Admin-Key` header for admin routes | `admin-secret` |

### Run (development)

```bash
npm run dev
```

### Build & Run (production)

```bash
npm run build
npm start
```

---

## Testing

```bash
npm test                # run all tests
npm run test:coverage   # with coverage report
npm run typecheck       # TypeScript type check only
```

All 40 unit tests cover the four service modules: `cartService`, `checkoutService`, `discountService`, and `adminService`.

---

## API Reference

All user-facing routes require the `X-User-Id` header to identify the caller.  
Admin routes require the `X-Admin-Key` header.

### Cart

| Method   | Endpoint                        | Description                        |
|----------|---------------------------------|------------------------------------|
| `GET`    | `/api/cart`                     | Get current cart with subtotal     |
| `POST`   | `/api/cart/items`               | Add item to cart                   |
| `PUT`    | `/api/cart/items/:productId`    | Update item quantity (0 = remove)  |
| `DELETE` | `/api/cart/items/:productId`    | Remove item from cart              |
| `DELETE` | `/api/cart`                     | Clear entire cart                  |

**POST /api/cart/items** body:
```json
{ "productId": "p1", "quantity": 2 }
```

**PUT /api/cart/items/:productId** body:
```json
{ "quantity": 3 }
```

---

### Checkout

| Method | Endpoint        | Description   |
|--------|-----------------|---------------|
| `POST` | `/api/checkout` | Place an order |

**Body:**
```json
{ "discountCode": "DISC-ABCD1234" }
```
`discountCode` is optional. On every nth order, the response includes a `couponGenerated` field with a new discount code for the customer.

**Response (201):**
```json
{
  "data": {
    "id": "ord-<uuid>",
    "userId": "u1",
    "items": [...],
    "subtotal": 59.98,
    "discountCode": "DISC-ABCD1234",
    "discountAmount": 6.00,
    "total": 53.98,
    "placedAt": "2026-06-12T10:00:00.000Z",
    "couponGenerated": { "code": "DISC-XYZ12345", "discountPercent": 10 }
  }
}
```

---

### Discount

| Method | Endpoint                  | Description                  |
|--------|---------------------------|------------------------------|
| `POST` | `/api/discount/validate`  | Check if a code is valid     |

**Body:**
```json
{ "code": "DISC-ABCD1234" }
```

**Response:**
```json
{ "data": { "valid": true, "discountPercent": 10 } }
```
or
```json
{ "data": { "valid": false, "reason": "CODE_ALREADY_USED" } }
```

---

### Admin

All admin routes require `X-Admin-Key: <your-admin-key>` header.

| Method | Endpoint                        | Description                             |
|--------|---------------------------------|-----------------------------------------|
| `POST` | `/api/admin/discount/generate`  | Generate a discount code for a user     |
| `GET`  | `/api/admin/stats`              | Get store-wide statistics               |

**POST /api/admin/discount/generate** body:
```json
{ "userId": "u1" }
```
Returns `409 CONDITION_NOT_MET` if total orders are not a non-zero multiple of `N_TH_ORDER`.

**GET /api/admin/stats** response:
```json
{
  "data": {
    "totalOrders": 10,
    "totalItemsPurchased": 25,
    "totalRevenue": 499.90,
    "totalDiscountGiven": 30.00,
    "discountCodes": {
      "total": 2,
      "used": 1,
      "unused": 1,
      "codes": [...]
    }
  }
}
```

---

## Error Format

All errors follow a consistent shape:

```json
{ "error": { "code": "CART_EMPTY", "message": "Cart is empty" } }
```

| Code                  | Status | Meaning                                      |
|-----------------------|--------|----------------------------------------------|
| `MISSING_USER_ID`     | 400    | `X-User-Id` header missing                   |
| `PRODUCT_NOT_FOUND`   | 404    | Product does not exist                       |
| `ITEM_NOT_FOUND`      | 404    | Product not in cart                          |
| `INVALID_QUANTITY`    | 422    | Quantity is not a valid positive integer     |
| `CART_EMPTY`          | 422    | Checkout attempted with empty cart           |
| `CODE_NOT_FOUND`      | 400    | Discount code does not exist                 |
| `CODE_NOT_YOURS`      | 400    | Discount code belongs to a different user    |
| `CODE_ALREADY_USED`   | 400    | Discount code has already been redeemed      |
| `CONDITION_NOT_MET`   | 409    | nth-order condition not satisfied            |
| `CODE_ALREADY_EXISTS` | 409    | User already holds an unused discount code   |
| `UNAUTHORIZED`        | 401    | Invalid or missing `X-Admin-Key`             |

---

## Project Structure

```
src/
├── __tests__/
│   ├── adminService.test.ts
│   ├── cartService.test.ts
│   ├── checkoutService.test.ts
│   └── discountService.test.ts
├── routes/
│   ├── admin.ts
│   ├── cart.ts
│   ├── checkout.ts
│   └── discount.ts
├── services/
│   ├── adminService.ts
│   ├── cartService.ts
│   ├── checkoutService.ts
│   └── discountService.ts
├── app.ts        — Express app factory
├── errors.ts     — AppError class
├── index.ts      — server entry point
├── seed.ts       — seeds initial products
├── store.ts      — in-memory store singleton + resetStore()
└── types.ts      — shared TypeScript interfaces
```

---

## Seeded Products

The server starts with 5 products available to add to cart:

| ID   | Name      | Price   |
|------|-----------|---------|
| `p1` | T-Shirt   | $29.99  |
| `p2` | Jeans     | $59.99  |
| `p3` | Sneakers  | $89.99  |
| `p4` | Cap       | $19.99  |
| `p5` | Hoodie    | $49.99  |
