import Razorpay from "razorpay";
import { env } from "./env.js";

export const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

export const PLANS: Record<
  string,
  { name: string; amount: number; currency: string; period: string; interval: number; tier: string }
> = {
  premium_monthly: {
    name: "Premium Monthly",
    amount: 9900, // ₹99 in paise
    currency: "INR",
    period: "monthly",
    interval: 1,
    tier: "premium",
  },
  premium_yearly: {
    name: "Premium Yearly",
    amount: 59900, // ₹599 in paise
    currency: "INR",
    period: "yearly",
    interval: 1,
    tier: "premium",
  },
  business_yearly: {
    name: "Business Yearly",
    amount: 199900, // ₹1999 in paise
    currency: "INR",
    period: "yearly",
    interval: 1,
    tier: "business",
  },
};
