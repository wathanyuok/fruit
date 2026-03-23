const menu = require("./menu");

// Items eligible for the 5% pair discount
const PAIR_DISCOUNT_ITEMS = ["orange", "pink", "green"];
const PAIR_DISCOUNT_RATE = 0.05;
const MEMBER_DISCOUNT_RATE = 0.1;
const VALID_MEMBER_CARD = "12345";

// Track Red set orders: { timestamp: Date }
const redSetOrders = [];

function getMenuItem(itemId) {
  return menu.find((m) => m.id === itemId);
}

/**
 * Check if Red set can be ordered right now.
 * Only 1 customer can order Red set within 1 hour.
 */
function canOrderRedSet() {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  // Clean up old entries
  while (redSetOrders.length > 0 && redSetOrders[0] < oneHourAgo) {
    redSetOrders.shift();
  }
  return redSetOrders.length === 0;
}

function recordRedSetOrder() {
  redSetOrders.push(Date.now());
}

// Exposed for testing
function clearRedSetOrders() {
  redSetOrders.length = 0;
}

/**
 * Calculate the total price for an order.
 *
 * @param {Array<{itemId: string, quantity: number}>} items - ordered items
 * @param {string|null} memberCard - member card number (null if none)
 * @returns {{ subtotal, discountDetails, pairDiscountTotal, memberDiscount, grandTotal, error? }}
 */
function calculateOrder(items, memberCard = null) {
  // Validate items
  for (const item of items) {
    const menuItem = getMenuItem(item.itemId);
    if (!menuItem) {
      return { error: `Unknown menu item: ${item.itemId}` };
    }
    if (item.quantity < 0 || !Number.isInteger(item.quantity)) {
      return { error: `Invalid quantity for ${item.itemId}` };
    }
  }

  // Check Red set restriction
  const redOrder = items.find((i) => i.itemId === "red" && i.quantity > 0);
  if (redOrder) {
    if (!canOrderRedSet()) {
      return {
        error:
          "Red set is currently unavailable. Only 1 customer can order Red set per hour.",
      };
    }
  }

  let subtotal = 0;
  let pairDiscountTotal = 0;
  const discountDetails = [];

  for (const item of items) {
    const menuItem = getMenuItem(item.itemId);
    if (!menuItem || item.quantity === 0) continue;

    const itemTotal = menuItem.price * item.quantity;

    if (PAIR_DISCOUNT_ITEMS.includes(item.itemId)) {
      const pairs = Math.floor(item.quantity / 2);
      const singles = item.quantity % 2;

      if (pairs > 0) {
        const pairPrice = menuItem.price * 2;
        const pairDiscount = pairPrice * PAIR_DISCOUNT_RATE;
        const totalPairDiscount = pairDiscount * pairs;

        pairDiscountTotal += totalPairDiscount;
        discountDetails.push({
          itemId: item.itemId,
          itemName: menuItem.name,
          pairs,
          singles,
          pairDiscount: totalPairDiscount,
          description: `${menuItem.name} x${item.quantity}: ${pairs} pair(s) get 5% off = -${totalPairDiscount.toFixed(2)} THB`,
        });
      }

      subtotal += itemTotal;
    } else {
      subtotal += itemTotal;
    }
  }

  const afterPairDiscount = subtotal - pairDiscountTotal;

  // Member discount: 10% of total after pair discounts (only for valid member card)
  let memberDiscount = 0;
  let memberValid = false;
  if (memberCard && memberCard.trim() === VALID_MEMBER_CARD) {
    memberDiscount = afterPairDiscount * MEMBER_DISCOUNT_RATE;
    memberValid = true;
  } else if (memberCard && memberCard.trim() !== "") {
    return { error: "Invalid member card number" };
  }

  const grandTotal = afterPairDiscount - memberDiscount;

  // Record Red set order if applicable
  if (redOrder) {
    recordRedSetOrder();
  }

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    discountDetails,
    pairDiscountTotal: parseFloat(pairDiscountTotal.toFixed(2)),
    memberCard: memberCard || null,
    memberDiscount: parseFloat(memberDiscount.toFixed(2)),
    grandTotal: parseFloat(grandTotal.toFixed(2)),
  };
}

module.exports = {
  calculateOrder,
  canOrderRedSet,
  clearRedSetOrders,
  getMenuItem,
};
