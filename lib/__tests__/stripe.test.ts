import { getStripe } from "../payments/stripe";

jest.mock("stripe", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({ getApiField: () => "2025-07-30.basil" })),
  };
});


describe("Stripe client", () => {
  it("should initialize Stripe client if key is present", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
    const stripe = getStripe();
    expect(stripe).toBeDefined();
  });
});
  it("should return null if no key is present", () => {
    delete process.env.STRIPE_SECRET_KEY;
    const stripe = getStripe();
    expect(stripe).toBeNull();
  });