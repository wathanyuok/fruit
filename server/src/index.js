const express = require("express");
const cors = require("cors");
const menu = require("./menu");
const { calculateOrder, canOrderRedSet } = require("./calculator");

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors({
  origin: true,
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true,
}));
app.use(express.json());

// GET /api/menu - Return all menu items
app.get("/api/menu", (req, res) => {
  const menuWithAvailability = menu.map((item) => ({
    ...item,
    available: item.id === "red" ? canOrderRedSet() : true,
  }));
  res.json(menuWithAvailability);
});

// POST /api/calculate - Calculate order total
// Body: { items: [{ itemId, quantity }], memberCard: string|null }
app.post("/api/calculate", (req, res) => {
  const { items, memberCard } = req.body;

  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: "Items array is required" });
  }

  const result = calculateOrder(items, memberCard);

  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  res.json(result);
});

app.listen(PORT, () => {
  console.log(`Restaurant Calculator API running on http://localhost:${PORT}`);
});

module.exports = app;
