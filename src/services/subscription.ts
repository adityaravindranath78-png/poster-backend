import api from './api';
import {ApiResponse} from '../types/api';

interface SubscriptionStatus {
  status: 'free' | 'premium' | 'business';
  expiry: number | null;
}

export async function getSubscriptionStatus(): Promise<
  ApiResponse<SubscriptionStatus>
> {
  const {data} = await api.get('/subscription/status');
  return data;
}

// Razorpay integration — day 2
export async function initiatePayment(
  _planId: string,
): Promise<{orderId: string; amount: number; currency: string}> {
  throw new Error('Payments not yet integrated');
}

export async function verifyPayment(
  _orderId: string,
  _paymentId: string,
  _signature: string,
): Promise<ApiResponse<SubscriptionStatus>> {
  throw new Error('Payments not yet integrated');
}
