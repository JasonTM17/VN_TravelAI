export function degradedChatReply(message: string) {
  return {
    reply:
      "TravelAI Concierge đang ở chế độ dự phòng (n8n không khả dụng). " +
      "Gợi ý nhanh: ưu tiên điểm đến Việt Nam theo mùa — biển miền Trung (3–8), " +
      "Tây Bắc (9–11), Nam đảo (11–4). Bạn có thể thử lại sau hoặc duyệt khách sạn/tour trên TravelAI. " +
      `Yêu cầu của bạn: “${message.slice(0, 200)}”.`,
    degraded: true,
  };
}

export function degradedItinerary(input: {
  destination: string;
  days: number;
  budgetVnd: number;
  style?: string;
}) {
  const days = Array.from({ length: input.days }, (_, i) => {
    const day = i + 1;
    return {
      day,
      title: `Ngày ${day} · ${input.destination}`,
      activities: [
        {
          time: "08:30",
          title: "Ăn sáng địa phương",
          description: "Thưởng thức món đặc sản vùng miền, hỏi host về điểm nên tránh đông.",
          place: input.destination,
        },
        {
          time: "10:00",
          title: day === 1 ? "Định hướng & điểm biểu tượng" : "Khám phá điểm nổi bật",
          description:
            "Lịch trình an toàn, đi bộ/xe công cộng khi có thể. Giữ ngân sách linh hoạt 15%.",
          place: input.destination,
        },
        {
          time: "15:00",
          title: "Trải nghiệm văn hóa / thiên nhiên",
          description: `Phong cách ${input.style ?? "couple"} — ưu tiên trải nghiệm xác thực, tránh tour ép mua sắm.`,
          place: input.destination,
        },
        {
          time: "19:00",
          title: "Ẩm thực & nghỉ ngơi",
          description: "Chọn quán rating cao, đặt bàn nếu cuối tuần.",
          place: input.destination,
        },
      ],
    };
  });

  const perDay = Math.floor(input.budgetVnd / Math.max(input.days, 1));
  return {
    destination: input.destination,
    days,
    estimatedBudgetVnd: input.budgetVnd,
    hotelSuggestions: [
      {
        slug: `${slugify(input.destination)}-hotel-1`,
        name: `Gợi ý lưu trú gần trung tâm ${input.destination}`,
      },
    ],
    transportTips: [
      "Di chuyển nội địa: ưu tiên bay thẳng nếu > 8 giờ tàu xe.",
      "Giữ bản offline map; mua SIM eSIM trước khi đến.",
    ],
    foodTips: ["Thử món đặc sản buổi sáng", "Uống nước đóng chai khi di chuyển dài"],
    degraded: true,
    notes: `Ngân sách gợi ý ~${perDay.toLocaleString("vi-VN")} VND/ngày (chế độ offline).`,
  };
}

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
