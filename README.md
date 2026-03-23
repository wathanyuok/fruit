# Restaurant Calculator

A full-stack restaurant calculator application with discount logic.

## Tech Stack

- **Backend:** Node.js + Express
- **Frontend:** React + Vite
- **Tests:** Jest

## Setup & Run

### Prerequisites

- Node.js >= 18

### 1. Start the API Server

```bash
cd server
npm install
npm start
```

Server runs at `http://localhost:3002`

### 2. Start the Frontend

```bash
cd client
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

### 3. Run Tests

```bash
cd server
npm test
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menu` | Get all menu items with availability |
| POST | `/api/calculate` | Calculate order total with discounts |

### POST /api/calculate

**Request body:**
```json
{
  "items": [
    { "itemId": "orange", "quantity": 2 },
    { "itemId": "blue", "quantity": 1 }
  ],
  "memberCard": "12345"
}
```

**Response:**
```json
{
  "subtotal": 270,
  "discountDetails": [...],
  "pairDiscountTotal": 12,
  "memberCard": "12345",
  "memberDiscount": 25.8,
  "grandTotal": 232.2
}
```

## Business Rules

1. **Menu:** 7 items (Red 50, Green 40, Blue 30, Yellow 50, Pink 80, Purple 90, Orange 120 THB)
2. **Pair Discount:** Orange, Pink, Green sets get 5% off per pair
3. **Member Discount:** 10% off total when valid member card is provided (card number: `12345`)
4. **Red Set Limit:** Only 1 customer can order Red set per hour
