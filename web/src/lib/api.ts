import { resolveServiceBaseUrl } from "./service-url";

// Browser: NEXT_PUBLIC_* host ports (e.g. localhost:53001).
// Server/SSR in Docker: API_INTERNAL_URL=http://api:3001 (compose network).
const API_URL = resolveServiceBaseUrl({
  internal: process.env.API_INTERNAL_URL,
  publicUrl: process.env.NEXT_PUBLIC_API_URL,
  fallback: "http://127.0.0.1:53001",
});
const IDENTITY_URL = resolveServiceBaseUrl({
  internal: process.env.IDENTITY_INTERNAL_URL,
  publicUrl: process.env.NEXT_PUBLIC_IDENTITY_URL,
  fallback: "http://127.0.0.1:53002",
});
const AI_URL = resolveServiceBaseUrl({
  internal: process.env.AI_INTERNAL_URL,
  publicUrl: process.env.NEXT_PUBLIC_AI_URL,
  fallback: "http://127.0.0.1:53003",
});

export type ApiEnvelope<T> = { success: boolean; data: T; meta?: { page: number; limit: number; total: number } };

async function request<T>(base: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  listDestinations: (q?: string) =>
    request<ApiEnvelope<Destination[]>>(API_URL, `/v1/destinations${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  getDestination: (slug: string) =>
    request<ApiEnvelope<Destination>>(API_URL, `/v1/destinations/${slug}`),
  listHotels: (params: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    });
    return request<ApiEnvelope<Hotel[]>>(API_URL, `/v1/hotels?${qs}`);
  },
  getHotel: (slug: string) => request<ApiEnvelope<Hotel>>(API_URL, `/v1/hotels/${slug}`),
  listTours: (params: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    });
    return request<ApiEnvelope<Tour[]>>(API_URL, `/v1/tours?${qs}`);
  },
  getTour: (slug: string) => request<ApiEnvelope<Tour>>(API_URL, `/v1/tours/${slug}`),
  searchFlights: (from: string, to: string, date: string) =>
    request<ApiEnvelope<Flight[]>>(
      API_URL,
      `/v1/flights/search?from=${from}&to=${to}&date=${date}`,
    ),
  listTransports: (params: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    });
    return request<ApiEnvelope<Transport[]>>(API_URL, `/v1/transports?${qs}`);
  },
  search: (q: string) => request<ApiEnvelope<SearchResult>>(API_URL, `/v1/search?q=${encodeURIComponent(q)}`),
  login: (email: string, password: string) =>
    request<ApiEnvelope<AuthData>>(IDENTITY_URL, "/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string, fullName: string) =>
    request<ApiEnvelope<AuthData>>(IDENTITY_URL, "/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, fullName }),
    }),
  me: (token: string) =>
    request<ApiEnvelope<User>>(IDENTITY_URL, "/v1/auth/me", {
      headers: { authorization: `Bearer ${token}` },
    }),
  listBookings: (token: string) =>
    request<ApiEnvelope<Booking[]>>(API_URL, "/v1/bookings", {
      headers: { authorization: `Bearer ${token}` },
    }),
  createBooking: (token: string, body: CreateBookingBody, idempotencyKey: string) =>
    request<ApiEnvelope<Booking>>(API_URL, "/v1/bookings", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "idempotency-key": idempotencyKey,
      },
      body: JSON.stringify(body),
    }),
  payBooking: (token: string, id: string, outcome: "success" | "fail" = "success") =>
    request<ApiEnvelope<Booking>>(API_URL, `/v1/bookings/${id}/pay`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ outcome }),
    }),
  chat: (token: string, message: string, conversationId?: string) =>
    request<ApiEnvelope<{ reply: string; conversationId: string; degraded?: boolean }>>(
      AI_URL,
      "/v1/chat",
      {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
        body: JSON.stringify({ message, conversationId }),
      },
    ),
  createItinerary: (
    token: string,
    body: {
      destination: string;
      days: number;
      budgetVnd: number;
      travelers?: number;
      style?: string;
      notes?: string;
    },
  ) =>
    request<ApiEnvelope<Itinerary>>(AI_URL, "/v1/itineraries", {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }),
  listWishlist: (token: string) =>
    request<ApiEnvelope<WishlistItem[]>>(API_URL, "/v1/wishlists", {
      headers: { authorization: `Bearer ${token}` },
    }),
  addWishlist: (
    token: string,
    body: { itemType: "hotel" | "tour" | "destination"; itemId: string },
  ) =>
    request<ApiEnvelope<WishlistItem>>(API_URL, "/v1/wishlists", {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }),
  removeWishlist: (token: string, id: string) =>
    request<void>(API_URL, `/v1/wishlists/${id}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${token}` },
    }),
  adminReindex: (token: string, adminToken?: string) =>
    request<ApiEnvelope<{ reindexed: boolean; by: string; role: string; counts: unknown }>>(
      API_URL,
      "/v1/admin/reindex",
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          ...(adminToken ? { "x-admin-token": adminToken } : {}),
        },
        body: JSON.stringify({}),
      },
    ),
  adminAudit: (token: string, limit = 20) =>
    request<ApiEnvelope<AdminAuditRow[]>>(API_URL, `/v1/admin/audit?limit=${limit}`, {
      headers: { authorization: `Bearer ${token}` },
    }),
};

export type AdminAuditRow = {
  id: string;
  userId: string;
  action: string;
  detail?: string | null;
  ip?: string | null;
  createdAt: string;
};

export type Destination = {
  id: string;
  slug: string;
  nameVi: string;
  nameEn: string;
  countryCode: string;
  region?: string | null;
  descriptionVi: string;
  descriptionEn: string;
  heroImageUrl: string;
};

export type Hotel = {
  id: string;
  slug: string;
  name: string;
  stars: number;
  priceFromVnd: number;
  destinationSlug?: string;
  images?: string[];
  amenities?: string[];
  rating?: number;
  descriptionVi?: string;
  descriptionEn?: string;
  reviews?: Array<{ author: string; rating: number; body: string }>;
};

export type Tour = {
  id: string;
  slug: string;
  titleVi: string;
  titleEn: string;
  durationDays: number;
  priceFromVnd: number;
  destinationSlug?: string;
  images?: string[];
  descriptionVi?: string;
  descriptionEn?: string;
};

export type Flight = {
  id: string;
  airline: string;
  flightNumber: string;
  from: string;
  to: string;
  departAt: string;
  arriveAt: string;
  priceVnd: number;
  cabin: string;
};

export type Transport = {
  id: string;
  slug: string;
  operator: string;
  mode: "bus" | "train";
  from: string;
  to: string;
  fromCity: string;
  toCity: string;
  departAt: string;
  arriveAt: string;
  priceVnd: number;
  durationMin: number;
  seatsLeft: number;
};

export type User = { id: string; email: string; fullName: string };
export type AuthData = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
};

export type Booking = {
  id: string;
  status: string;
  itemType: string;
  itemId: string;
  totalVnd: number;
  guests: number;
  startDate: string;
  endDate?: string | null;
  itemSnapshot?: Record<string, unknown>;
};

export type CreateBookingBody = {
  itemType: "hotel" | "tour" | "flight";
  itemId: string;
  guests: number;
  startDate: string;
  endDate?: string;
  contactName?: string;
  contactEmail?: string;
};

export type SearchResult = {
  destinations: Destination[];
  hotels: Hotel[];
  tours: Tour[];
};

export type Itinerary = {
  id: string;
  destination: string;
  days: Array<{
    day: number;
    title: string;
    activities: Array<{ time: string; title: string; description: string; place?: string }>;
  }>;
  estimatedBudgetVnd: number;
  hotelSuggestions?: Array<{ slug: string; name: string }>;
  degraded?: boolean;
};

export type WishlistItem = {
  id: string;
  itemType: "hotel" | "tour" | "destination";
  itemId: string;
  title?: string;
  slug?: string | null;
  priceFromVnd?: number | null;
  hrefKind?: "hotel" | "tour" | "destination";
  createdAt?: string;
};
