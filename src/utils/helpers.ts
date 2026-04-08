import {Platform} from 'react-native';

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

export function formatPrice(amount: number, currency = 'INR'): string {
  if (currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  return `$${amount}`;
}

export function getCloudFrontUrl(path: string, domain: string): string {
  if (path.startsWith('http')) {
    return path;
  }
  return `https://${domain}/${path}`;
}

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function isIOS(): boolean {
  return Platform.OS === 'ios';
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return `${str.slice(0, maxLength - 3)}...`;
}
