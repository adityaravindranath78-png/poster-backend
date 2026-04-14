import Razorpay from "razorpay";
import { env } from "./env.js";

let _instance: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new Error(
      "Razorpay not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env"
    );
  }
  if (!_instance) {
    _instance = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }
  return _instance;
}

export const PLANS: Record<
  string,
  { name: string; amount: number; currency: string; period: string; interval: number; tier: string }
> = {
  premium_monthly: {
    name: "Premium Monthly",
    amount: 9900,
    currency: "INR",
    period: "monthly",
    interval: 1,
    tier: "premium",
  },
  premium_yearly: {
    name: "Premium Yearly",
    amount: 59900,
    currency: "INR",
    period: "yearly",
    interval: 1,
    tier: "premium",
  },
  business_yearly: {
    name: "Business Yearly",
    amount: 199900,
    currency: "INR",
    period: "yearly",
    interval: 1,
    tier: "business",
  },
};
