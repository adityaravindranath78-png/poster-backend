export interface UserProfile {
  userId: string;
  name: string;
  phone?: string;
  photoUrl?: string;
  businessName?: string;
  logoUrl?: string;
  language: string;
  subscriptionStatus: "free" | "premium" | "business";
  subscriptionExpiry?: number;
}

export interface TemplateMeta {
  id: string;
  category: string;
  subcategory: string;
  language: string;
  premium: boolean;
  tags: string[];
  schema_url: string;
  thumbnail_url: string;
  created_at: number;
  scheduled_date?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  nextKey?: string;
  total?: number;
}
