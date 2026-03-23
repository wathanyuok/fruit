const {
  calculateOrder,
  canOrderRedSet,
  clearRedSetOrders,
} = require("../src/calculator");

beforeEach(() => {
  clearRedSetOrders();
});

describe("Basic price calculation", () => {
  test("single item order", () => {
    const result = calculateOrder([{ itemId: "red", quantity: 1 }]);
    expect(result.subtotal).toBe(50);
    expect(result.grandTotal).toBe(50);
  });

  test("multiple different items", () => {
    const result = calculateOrder([
      { itemId: "red", quantity: 1 },
      { itemId: "blue", quantity: 2 },
    ]);
    expect(result.subtotal).toBe(50 + 60); // 50 + 30*2
    expect(result.grandTotal).toBe(110);
  });

  test("zero quantity items are ignored", () => {
    const result = calculateOrder([
      { itemId: "red", quantity: 0 },
      { itemId: "blue", quantity: 1 },
    ]);
    expect(result.subtotal).toBe(30);
    expect(result.grandTotal).toBe(30);
  });

  test("unknown menu item returns error", () => {
    const result = calculateOrder([{ itemId: "unknown", quantity: 1 }]);
    expect(result.error).toBeDefined();
  });

  test("negative quantity returns error", () => {
    const result = calculateOrder([{ itemId: "red", quantity: -1 }]);
    expect(result.error).toBeDefined();
  });
});

describe("5% pair discount for Orange, Pink, Green", () => {
  test("Orange x2 = (120+120) - 5%", () => {
    const result = calculateOrder([{ itemId: "orange", quantity: 2 }]);
    // subtotal = 240, pair discount = 240 * 5% = 12
    expect(result.subtotal).toBe(240);
    expect(result.pairDiscountTotal).toBe(12);
    expect(result.grandTotal).toBe(228);
  });

  test("Pink x4 = two pairs, each pair gets 5% off", () => {
    const result = calculateOrder([{ itemId: "pink", quantity: 4 }]);
    // subtotal = 320, 2 pairs => discount = (160 * 0.05) * 2 = 16
    expect(result.subtotal).toBe(320);
    expect(result.pairDiscountTotal).toBe(16);
    expect(result.grandTotal).toBe(304);
  });

  test("Green x3 = one pair discounted + 1 single", () => {
    const result = calculateOrder([{ itemId: "green", quantity: 3 }]);
    // subtotal = 120, 1 pair => discount = 80 * 0.05 = 4
    expect(result.subtotal).toBe(120);
    expect(result.pairDiscountTotal).toBe(4);
    expect(result.grandTotal).toBe(116);
  });

  test("Green x1 = no pair discount", () => {
    const result = calculateOrder([{ itemId: "green", quantity: 1 }]);
    expect(result.subtotal).toBe(40);
    expect(result.pairDiscountTotal).toBe(0);
    expect(result.grandTotal).toBe(40);
  });

  test("non-discount items (Blue, Yellow, Purple, Red) get no pair discount", () => {
    const result = calculateOrder([
      { itemId: "blue", quantity: 4 },
      { itemId: "yellow", quantity: 2 },
      { itemId: "purple", quantity: 2 },
    ]);
    expect(result.subtotal).toBe(120 + 100 + 180); // 400
    expect(result.pairDiscountTotal).toBe(0);
    expect(result.grandTotal).toBe(400);
  });

  test("mixed discount and non-discount items", () => {
    const result = calculateOrder([
      { itemId: "orange", quantity: 2 },
      { itemId: "blue", quantity: 1 },
    ]);
    // subtotal = 240 + 30 = 270
    // pair discount on orange = 12
    expect(result.subtotal).toBe(270);
    expect(result.pairDiscountTotal).toBe(12);
    expect(result.grandTotal).toBe(258);
  });
});

describe("Member card 10% discount", () => {
  test("member discount applied on total after pair discount", () => {
    const result = calculateOrder(
      [{ itemId: "orange", quantity: 2 }],
      "12345"
    );
    // subtotal = 240, pair discount = 12, after pair = 228
    // member discount = 228 * 10% = 22.8
    expect(result.subtotal).toBe(240);
    expect(result.pairDiscountTotal).toBe(12);
    expect(result.memberDiscount).toBe(22.8);
    expect(result.grandTotal).toBe(205.2);
  });

  test("member discount with no pair discount", () => {
    const result = calculateOrder(
      [{ itemId: "blue", quantity: 2 }],
      "12345"
    );
    // subtotal = 60, no pair discount
    // member = 60 * 10% = 6
    expect(result.subtotal).toBe(60);
    expect(result.memberDiscount).toBe(6);
    expect(result.grandTotal).toBe(54);
  });

  test("empty member card string means no discount", () => {
    const result = calculateOrder([{ itemId: "blue", quantity: 2 }], "");
    expect(result.memberDiscount).toBe(0);
    expect(result.grandTotal).toBe(60);
  });

  test("null member card means no discount", () => {
    const result = calculateOrder([{ itemId: "blue", quantity: 2 }], null);
    expect(result.memberDiscount).toBe(0);
    expect(result.grandTotal).toBe(60);
  });

  test("invalid member card returns error", () => {
    const result = calculateOrder([{ itemId: "blue", quantity: 2 }], "99999");
    expect(result.error).toContain("Invalid member card");
  });
});

describe("Red set special condition (1 per hour)", () => {
  test("first Red set order succeeds", () => {
    const result = calculateOrder([{ itemId: "red", quantity: 1 }]);
    expect(result.error).toBeUndefined();
    expect(result.grandTotal).toBe(50);
  });

  test("second Red set order within 1 hour fails", () => {
    calculateOrder([{ itemId: "red", quantity: 1 }]);
    const result = calculateOrder([{ itemId: "red", quantity: 1 }]);
    expect(result.error).toContain("Red set");
  });

  test("canOrderRedSet returns false after an order", () => {
    calculateOrder([{ itemId: "red", quantity: 1 }]);
    expect(canOrderRedSet()).toBe(false);
  });

  test("canOrderRedSet returns true when cleared", () => {
    calculateOrder([{ itemId: "red", quantity: 1 }]);
    clearRedSetOrders();
    expect(canOrderRedSet()).toBe(true);
  });
});

describe("Complex order scenarios", () => {
  test("all items ordered with member card", () => {
    const result = calculateOrder(
      [
        { itemId: "red", quantity: 1 },
        { itemId: "green", quantity: 2 },
        { itemId: "blue", quantity: 1 },
        { itemId: "yellow", quantity: 1 },
        { itemId: "pink", quantity: 2 },
        { itemId: "purple", quantity: 1 },
        { itemId: "orange", quantity: 2 },
      ],
      "12345"
    );
    // subtotal: 50 + 80 + 30 + 50 + 160 + 90 + 240 = 700
    // green pair discount: 80 * 0.05 = 4
    // pink pair discount: 160 * 0.05 = 8
    // orange pair discount: 240 * 0.05 = 12
    // total pair discount = 24
    // after pair = 676
    // member = 676 * 0.1 = 67.6
    // grand = 608.4
    expect(result.subtotal).toBe(700);
    expect(result.pairDiscountTotal).toBe(24);
    expect(result.memberDiscount).toBe(67.6);
    expect(result.grandTotal).toBe(608.4);
  });
});
