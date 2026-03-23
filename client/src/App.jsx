import { useState, useEffect } from "react";
import "./App.css";

const API_URL = "http://localhost:3002/api";

const COLORS = {
  red: "#e74c3c",
  green: "#27ae60",
  blue: "#3498db",
  yellow: "#f1c40f",
  pink: "#e91e90",
  purple: "#9b59b6",
  orange: "#e67e22",
};

function App() {
  const [menu, setMenu] = useState([]);
  const [order, setOrder] = useState({});
  const [memberCard, setMemberCard] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/menu`)
      .then((res) => res.json())
      .then((data) => {
        setMenu(data);
        const initial = {};
        data.forEach((item) => (initial[item.id] = 0));
        setOrder(initial);
      })
      .catch(() => setError("Cannot connect to API server. Run: cd server && npm start"));
  }, []);

  const updateQuantity = (itemId, delta) => {
    setOrder((prev) => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + delta),
    }));
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const items = Object.entries(order)
      .filter(([, qty]) => qty > 0)
      .map(([itemId, quantity]) => ({ itemId, quantity }));

    if (items.length === 0) {
      setError("Please select at least one item");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          memberCard: memberCard.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch {
      setError("Failed to calculate. Is the API server running?");
    }
    setLoading(false);
  };

  const handleReset = () => {
    const reset = {};
    menu.forEach((item) => (reset[item.id] = 0));
    setOrder(reset);
    setMemberCard("");
    setResult(null);
    setError(null);
  };

  const totalItems = Object.values(order).reduce((a, b) => a + b, 0);

  return (
    <div className="app">
      <header className="header">
        <h1>Restaurant Calculator</h1>
        <p className="subtitle">Select your items and calculate the total</p>
      </header>

      <div className="content">
        <div className="menu-section">
          <h2>Menu</h2>
          <div className="menu-grid">
            {menu.map((item) => (
              <div
                key={item.id}
                className={`menu-card ${!item.available ? "unavailable" : ""}`}
                style={{ borderLeftColor: COLORS[item.id] }}
              >
                <div className="menu-info">
                  <span
                    className="color-dot"
                    style={{ backgroundColor: COLORS[item.id] }}
                  />
                  <div>
                    <div className="menu-name">{item.name}</div>
                    <div className="menu-price">{item.price} THB</div>
                    {!item.available && (
                      <div className="unavailable-text">
                        Unavailable (1 per hour limit)
                      </div>
                    )}
                  </div>
                </div>
                <div className="quantity-control">
                  <button
                    className="qty-btn minus"
                    onClick={() => updateQuantity(item.id, -1)}
                    disabled={!order[item.id]}
                  >
                    -
                  </button>
                  <span className="qty-value">{order[item.id] || 0}</span>
                  <button
                    className="qty-btn plus"
                    onClick={() => updateQuantity(item.id, 1)}
                    disabled={!item.available}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="order-section">
          <h2>Order Summary</h2>

          <div className="member-input">
            <label htmlFor="memberCard">Member Card Number</label>
            <input
              id="memberCard"
              type="text"
              placeholder="Enter member card (optional, for 10% discount)"
              value={memberCard}
              onChange={(e) => setMemberCard(e.target.value)}
            />
          </div>

          <div className="actions">
            <button
              className="calc-btn"
              onClick={handleCalculate}
              disabled={loading || totalItems === 0}
            >
              {loading ? "Calculating..." : `Calculate (${totalItems} items)`}
            </button>
            <button className="reset-btn" onClick={handleReset}>
              Reset
            </button>
          </div>

          {error && <div className="error-msg">{error}</div>}

          {result && (
            <div className="result-card">
              <div className="result-row">
                <span>Subtotal (before discount)</span>
                <span className="amount">{result.subtotal.toFixed(2)} THB</span>
              </div>

              {result.discountDetails.length > 0 && (
                <div className="discount-section">
                  <div className="result-label">Pair Discounts (5%):</div>
                  {result.discountDetails.map((d, i) => (
                    <div key={i} className="discount-item">
                      <span>{d.description}</span>
                    </div>
                  ))}
                  <div className="result-row discount">
                    <span>Total pair discount</span>
                    <span className="amount">
                      -{result.pairDiscountTotal.toFixed(2)} THB
                    </span>
                  </div>
                </div>
              )}

              {result.memberDiscount > 0 && (
                <div className="result-row discount">
                  <span>Member discount (10%)</span>
                  <span className="amount">
                    -{result.memberDiscount.toFixed(2)} THB
                  </span>
                </div>
              )}

              <div className="result-row grand-total">
                <span>Grand Total</span>
                <span className="amount">
                  {result.grandTotal.toFixed(2)} THB
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
