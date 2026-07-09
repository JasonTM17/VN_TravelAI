export type Locale = "vi" | "en";

export const locales: Locale[] = ["vi", "en"];
export const defaultLocale: Locale = "vi";

export const dict = {
  vi: {
    brand: "TravelAI",
    tagline: "Lên kế hoạch chuyến đi thông minh — Việt Nam & Thế giới",
    nav: {
      home: "Trang chủ",
      explore: "Khám phá",
      hotels: "Khách sạn",
      flights: "Vé máy bay",
      tours: "Tour",
      ai: "AI Planner",
      bookings: "Đặt chỗ",
      wishlist: "Yêu thích",
      login: "Đăng nhập",
      register: "Đăng ký",
      logout: "Đăng xuất",
    },
    home: {
      heroTitle: "Du lịch thông minh cùng",
      heroHighlight: "TravelAI",
      heroSub:
        "Khám phá Việt Nam và thế giới — khách sạn, tour, chuyến bay mock — cùng AI lên lịch trình chỉ trong vài phút.",
      searchPlaceholder: "Tìm Đà Nẵng, Hội An, Tokyo...",
      searchCta: "Tìm kiếm",
      featured: "Điểm đến nổi bật",
      categories: "Bạn muốn đặt gì?",
      aiCta: "Lên kế hoạch với AI",
      viewAll: "Xem tất cả",
    },
    empty: {
      title: "Chưa có dữ liệu",
      description: "Hãy thử tìm kiếm khác hoặc khám phá điểm đến phổ biến.",
      cta: "Về trang chủ",
    },
    auth: {
      email: "Email",
      password: "Mật khẩu",
      fullName: "Họ và tên",
      loginTitle: "Chào mừng trở lại",
      registerTitle: "Tạo tài khoản TravelAI",
      submitLogin: "Đăng nhập",
      submitRegister: "Đăng ký",
    },
    ai: {
      title: "TravelAI Concierge",
      subtitle: "Chat + sinh lịch trình nhiều ngày, liên kết khách sạn thật trong catalog.",
      placeholder: "VD: 3 ngày Hội An budget 5 triệu cho couple",
      generate: "Tạo lịch trình",
      chat: "Gửi",
      degraded: "Chế độ dự phòng (n8n offline)",
    },
    booking: {
      title: "Đặt chỗ của bạn",
      checkout: "Thanh toán",
      pay: "Thanh toán mock",
      confirmed: "Đã xác nhận",
      empty: "Bạn chưa có booking nào.",
    },
    common: {
      from: "Từ",
      night: "đêm",
      days: "ngày",
      book: "Đặt ngay",
      loading: "Đang tải...",
      error: "Đã xảy ra lỗi",
      retry: "Thử lại",
    },
  },
  en: {
    brand: "TravelAI",
    tagline: "Plan smarter trips — Vietnam & the world",
    nav: {
      home: "Home",
      explore: "Explore",
      hotels: "Hotels",
      flights: "Flights",
      tours: "Tours",
      ai: "AI Planner",
      bookings: "Bookings",
      wishlist: "Wishlist",
      login: "Log in",
      register: "Sign up",
      logout: "Log out",
    },
    home: {
      heroTitle: "Travel smarter with",
      heroHighlight: "TravelAI",
      heroSub:
        "Explore Vietnam and the world — hotels, tours, mock flights — plus AI itineraries in minutes.",
      searchPlaceholder: "Search Da Nang, Hoi An, Tokyo...",
      searchCta: "Search",
      featured: "Featured destinations",
      categories: "What do you need?",
      aiCta: "Plan with AI",
      viewAll: "View all",
    },
    empty: {
      title: "Nothing here yet",
      description: "Try another search or browse popular destinations.",
      cta: "Back home",
    },
    auth: {
      email: "Email",
      password: "Password",
      fullName: "Full name",
      loginTitle: "Welcome back",
      registerTitle: "Create your TravelAI account",
      submitLogin: "Log in",
      submitRegister: "Sign up",
    },
    ai: {
      title: "TravelAI Concierge",
      subtitle: "Chat and generate multi-day itineraries linked to real catalog hotels.",
      placeholder: "e.g. 3 days Hoi An budget 5M VND for a couple",
      generate: "Generate itinerary",
      chat: "Send",
      degraded: "Degraded mode (n8n offline)",
    },
    booking: {
      title: "Your bookings",
      checkout: "Checkout",
      pay: "Mock pay",
      confirmed: "Confirmed",
      empty: "No bookings yet.",
    },
    common: {
      from: "From",
      night: "night",
      days: "days",
      book: "Book now",
      loading: "Loading...",
      error: "Something went wrong",
      retry: "Retry",
    },
  },
} as const;

export type Dictionary = (typeof dict)["vi"] | (typeof dict)["en"];

export function getDict(locale: string): Dictionary {
  return locale === "en" ? dict.en : dict.vi;
}

export function isLocale(v: string): v is Locale {
  return v === "vi" || v === "en";
}
