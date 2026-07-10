import { clearSession, saveSession } from "./auth-storage";
import { messageFromErrorBody } from "./problem-error";
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

let refreshInFlight: Promise<string | null> | null = null;

/** Refresh via httpOnly cookie on identity origin (credentials: include). */
async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${IDENTITY_URL}/v1/auth/refresh`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) {
        clearSession();
        return null;
      }
      const json = (await res.json()) as ApiEnvelope<AuthData>;
      const data = json.data;
      if (!data?.accessToken) {
        clearSession();
        return null;
      }
      saveSession(data.accessToken);
      return data.accessToken;
    } catch {
      clearSession();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

function authHeaderValue(headers?: HeadersInit): string | null {
  if (!headers) return null;
  if (headers instanceof Headers) return headers.get("authorization");
  if (Array.isArray(headers)) {
    const hit = headers.find(([k]) => k.toLowerCase() === "authorization");
    return hit?.[1] ?? null;
  }
  const rec = headers as Record<string, string>;
  return rec.authorization ?? rec.Authorization ?? null;
}

async function request<T>(base: string, path: string, init?: RequestInit, retried = false): Promise<T> {
  const isIdentity = base === IDENTITY_URL;
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
    // Cookie refresh only works when identity requests include credentials
    credentials: isIdentity ? "include" : (init?.credentials ?? "same-origin"),
  });
  if (
    res.status === 401 &&
    !retried &&
    path !== "/v1/auth/refresh" &&
    path !== "/v1/auth/login" &&
    path !== "/v1/auth/register"
  ) {
    const hadBearer = Boolean(authHeaderValue(init?.headers)?.toLowerCase().startsWith("bearer "));
    // Also try cookie refresh for identity me when access expired
    if (hadBearer || isIdentity) {
      const next = await refreshAccessToken();
      if (next) {
        const headers = {
          ...(init?.headers as Record<string, string> | undefined),
          authorization: `Bearer ${next}`,
        };
        return request<T>(base, path, { ...init, headers }, true);
      }
    }
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(messageFromErrorBody(text, res.status));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  listDestinations: (params: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    });
    const qstr = qs.toString();
    return request<ApiEnvelope<Destination[]>>(API_URL, `/v1/destinations${qstr ? `?${qstr}` : ""}`);
  },
  listPromos: (limit = 12) =>
    request<ApiEnvelope<Promo[]>>(API_URL, `/v1/promos?limit=${limit}`),
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
  changePassword: (token: string, currentPassword: string, newPassword: string) =>
    request<ApiEnvelope<{ changed: boolean; user: User }>>(IDENTITY_URL, "/v1/auth/change-password", {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  /** Cookie-based refresh (body optional). */
  refresh: (refreshToken?: string) =>
    request<ApiEnvelope<AuthData>>(IDENTITY_URL, "/v1/auth/refresh", {
      method: "POST",
      body: JSON.stringify(refreshToken ? { refreshToken } : {}),
    }),
  /** Revokes refresh cookie + optional body token. */
  logout: (refreshToken?: string) =>
    request<void>(IDENTITY_URL, "/v1/auth/logout", {
      method: "POST",
      body: JSON.stringify(refreshToken ? { refreshToken } : {}),
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
  /**
   * SSE stream chat. Calls onToken for each chunk; resolves with full reply.
   */
  chatStream: async (
    token: string,
    message: string,
    conversationId: string | undefined,
    onToken: (text: string) => void,
  ): Promise<{ conversationId: string; reply: string; degraded: boolean }> => {
    const res = await fetch(`${AI_URL}/v1/chat/stream`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message, conversationId }),
      cache: "no-store",
    });
    if (!res.ok || !res.body) {
      const text = await res.text();
      throw new Error(messageFromErrorBody(text, res.status));
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let cid = conversationId ?? "";
    let full = "";
    let degraded = false;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const parts = buf.split("\n");
      buf = parts.pop() ?? "";
      for (const line of parts) {
        const t = line.trim();
        if (!t.startsWith("data:")) continue;
        try {
          const ev = JSON.parse(t.slice(5).trim()) as {
            type?: string;
            text?: string;
            conversationId?: string;
            reply?: string;
            degraded?: boolean;
          };
          if (ev.type === "meta" && ev.conversationId) cid = ev.conversationId;
          if (ev.type === "token" && ev.text) {
            full += ev.text;
            onToken(ev.text);
          }
          if (ev.type === "done") {
            if (ev.reply) full = ev.reply;
            degraded = Boolean(ev.degraded);
          }
        } catch {
          /* ignore */
        }
      }
    }
    return { conversationId: cid, reply: full, degraded };
  },
  listNotifications: (token: string) =>
    request<
      ApiEnvelope<
        Array<{ id: string; title: string; body: string; status: string; type: string; createdAt: string }>
      >
    >(API_URL, "/v1/notifications", {
      headers: { authorization: `Bearer ${token}` },
    }),
  getChatConversation: (token: string, id: string) =>
    request<
      ApiEnvelope<{
        id: string;
        title: string | null;
        messages: { id: string; role: string; content: string; degraded: boolean }[];
      }>
    >(API_URL, `/v1/chat/conversations/${id}`, {
      headers: { authorization: `Bearer ${token}` },
    }),
  persistChatMessages: (
    token: string,
    body: {
      conversationId?: string;
      messages: { role: "user" | "assistant" | "system"; content: string; degraded?: boolean }[];
      title?: string;
    },
  ) =>
    request<ApiEnvelope<{ conversationId: string }>>(API_URL, "/v1/chat/messages", {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }),
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
  createReview: (
    token: string,
    body: { hotelId?: string; tourId?: string; rating: number; body: string },
  ) =>
    request<ApiEnvelope<{ id: string; rating: number; body: string; author: string }>>(
      API_URL,
      "/v1/reviews",
      {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      },
    ),
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

export type Promo = {
  id: string;
  slug: string;
  titleVi: string;
  titleEn: string;
  badgeVi: string;
  badgeEn: string;
  badgeTone: string;
  imageUrl: string;
  hrefPath: string;
  sortOrder: number;
  active: boolean;
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
  roomsLeft?: number;
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
  reviews?: Array<{ author: string; rating: number; body: string }>;
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
  /** Omitted when identity uses cookie-only refresh. */
  refreshToken?: string;
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
  itemType: "hotel" | "tour" | "flight" | "transport";
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
