import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const destinations = [
  {
    slug: "ha-long",
    nameVi: "Vịnh Hạ Long",
    nameEn: "Ha Long Bay",
    countryCode: "VN",
    region: "Northeast",
    descriptionVi:
      "Di sản thiên nhiên thế giới với hàng nghìn đảo đá vôi và làn nước xanh ngọc.",
    descriptionEn: "UNESCO bay of limestone karsts and emerald water.",
    heroImageUrl: "/images/destinations/ha-long.jpg",
    latitude: 20.9101,
    longitude: 107.1839,
  },
  {
    slug: "hoi-an",
    nameVi: "Hội An",
    nameEn: "Hoi An",
    countryCode: "VN",
    region: "Central",
    descriptionVi: "Phố cổ lung linh đèn lồng, ẩm thực miền Trung và bãi biển An Bàng.",
    descriptionEn: "Lantern-lit ancient town, central cuisine, nearby beaches.",
    heroImageUrl: "/images/destinations/hoi-an.jpg",
    latitude: 15.8801,
    longitude: 108.338,
  },
  {
    slug: "da-nang",
    nameVi: "Đà Nẵng",
    nameEn: "Da Nang",
    countryCode: "VN",
    region: "Central",
    descriptionVi: "Thành phố biển hiện đại, cầu Rồng, Sơn Trà và Bà Nà Hills.",
    descriptionEn: "Modern coastal city with Dragon Bridge and Son Tra peninsula.",
    heroImageUrl: "/images/destinations/da-nang.jpg",
    latitude: 16.0544,
    longitude: 108.2022,
  },
  {
    slug: "hue",
    nameVi: "Huế",
    nameEn: "Hue",
    countryCode: "VN",
    region: "Central",
    descriptionVi: "Cố đô với Đại Nội, lăng tẩm Nguyễn và ẩm thực cung đình.",
    descriptionEn: "Former imperial capital with citadel and royal tombs.",
    heroImageUrl: "/images/destinations/hue.jpg",
    latitude: 16.4637,
    longitude: 107.5909,
  },
  {
    slug: "sapa",
    nameVi: "Sa Pa",
    nameEn: "Sapa",
    countryCode: "VN",
    region: "Northwest",
    descriptionVi: "Ruộng bậc thang, Fansipan và văn hóa các dân tộc vùng cao.",
    descriptionEn: "Terraced rice fields and highland cultures near Fansipan.",
    heroImageUrl: "/images/destinations/sapa.jpg",
    latitude: 22.3364,
    longitude: 103.8438,
  },
  {
    slug: "da-lat",
    nameVi: "Đà Lạt",
    nameEn: "Da Lat",
    countryCode: "VN",
    region: "Central Highlands",
    descriptionVi: "Thành phố ngàn hoa, khí hậu mát mẻ quanh năm.",
    descriptionEn: "City of eternal spring and pine-covered hills.",
    heroImageUrl: "/images/destinations/da-lat.jpg",
    latitude: 11.9404,
    longitude: 108.4583,
  },
  {
    slug: "nha-trang",
    nameVi: "Nha Trang",
    nameEn: "Nha Trang",
    countryCode: "VN",
    region: "South Central",
    descriptionVi: "Bãi biển dài, lặn biển và đảo Hòn Mun.",
    descriptionEn: "Long beaches, diving, and island hopping.",
    heroImageUrl: "/images/destinations/nha-trang.jpg",
    latitude: 12.2388,
    longitude: 109.1967,
  },
  {
    slug: "phu-quoc",
    nameVi: "Phú Quốc",
    nameEn: "Phu Quoc",
    countryCode: "VN",
    region: "Southwest",
    descriptionVi: "Đảo ngọc với cát trắng, hoàng hôn Sao Biển và rừng nguyên sinh.",
    descriptionEn: "Pearl island with white sand and sunset beaches.",
    heroImageUrl: "/images/destinations/phu-quoc.jpg",
    latitude: 10.227,
    longitude: 103.967,
  },
  {
    slug: "ha-noi",
    nameVi: "Hà Nội",
    nameEn: "Hanoi",
    countryCode: "VN",
    region: "North",
    descriptionVi: "Thủ đô nghìn năm văn hiến, phố cổ và ẩm thực đường phố.",
    descriptionEn: "Capital of culture, Old Quarter, and street food.",
    heroImageUrl: "/images/destinations/ha-noi.jpg",
    latitude: 21.0278,
    longitude: 105.8342,
  },
  {
    slug: "tp-hcm",
    nameVi: "TP. Hồ Chí Minh",
    nameEn: "Ho Chi Minh City",
    countryCode: "VN",
    region: "South",
    descriptionVi: "Đô thị sôi động, lịch sử và nhịp sống 24/7.",
    descriptionEn: "Vibrant metropolis of history and nightlife.",
    heroImageUrl: "/images/destinations/tp-hcm.jpg",
    latitude: 10.8231,
    longitude: 106.6297,
  },
  {
    slug: "can-tho",
    nameVi: "Cần Thơ",
    nameEn: "Can Tho",
    countryCode: "VN",
    region: "Mekong Delta",
    descriptionVi: "Thủ phủ miền Tây với chợ nổi Cái Răng.",
    descriptionEn: "Mekong delta hub famous for floating markets.",
    heroImageUrl: "/images/destinations/can-tho.jpg",
    latitude: 10.0452,
    longitude: 105.7469,
  },
  {
    slug: "ninh-binh",
    nameVi: "Ninh Bình",
    nameEn: "Ninh Binh",
    countryCode: "VN",
    region: "North",
    descriptionVi: "Tràng An, Tam Cốc — vịnh Hạ Long trên cạn.",
    descriptionEn: "Trang An karsts, Tam Coc river landscapes.",
    heroImageUrl: "/images/destinations/ninh-binh.jpg",
    latitude: 20.2506,
    longitude: 105.9745,
  },
  {
    slug: "tokyo",
    nameVi: "Tokyo",
    nameEn: "Tokyo",
    countryCode: "JP",
    region: "Kanto",
    descriptionVi: "Siêu đô thị Nhật Bản — truyền thống và tương lai.",
    descriptionEn: "Japan's megacity of tradition and neon.",
    heroImageUrl: "/images/destinations/tokyo.jpg",
    latitude: 35.6762,
    longitude: 139.6503,
  },
  {
    slug: "seoul",
    nameVi: "Seoul",
    nameEn: "Seoul",
    countryCode: "KR",
    region: "Capital",
    descriptionVi: "Thủ đô Hàn Quốc sôi động với cung điện và K-culture.",
    descriptionEn: "Korean capital of palaces and K-culture.",
    heroImageUrl: "/images/destinations/seoul.jpg",
    latitude: 37.5665,
    longitude: 126.978,
  },
  {
    slug: "bangkok",
    nameVi: "Bangkok",
    nameEn: "Bangkok",
    countryCode: "TH",
    region: "Central",
    descriptionVi: "Thủ đô Thái — chùa vàng, chợ nổi và street food.",
    descriptionEn: "Thai capital of temples and street food.",
    heroImageUrl: "/images/destinations/bangkok.jpg",
    latitude: 13.7563,
    longitude: 100.5018,
  },
  {
    slug: "bali",
    nameVi: "Bali",
    nameEn: "Bali",
    countryCode: "ID",
    region: "Lesser Sunda",
    descriptionVi: "Đảo thần linh với đền, ruộng lúa và bãi biển.",
    descriptionEn: "Island of temples, rice terraces, and surf.",
    heroImageUrl: "/images/destinations/bali.jpg",
    latitude: -8.3405,
    longitude: 115.092,
  },
  {
    slug: "paris",
    nameVi: "Paris",
    nameEn: "Paris",
    countryCode: "FR",
    region: "Île-de-France",
    descriptionVi: "Kinh đô ánh sáng — bảo tàng, cà phê và tháp Eiffel.",
    descriptionEn: "City of light, museums, and cafés.",
    heroImageUrl: "/images/destinations/paris.jpg",
    latitude: 48.8566,
    longitude: 2.3522,
  },
  {
    slug: "singapore",
    nameVi: "Singapore",
    nameEn: "Singapore",
    countryCode: "SG",
    region: "City-state",
    descriptionVi: "Thành phố vườn hiện đại, đa văn hóa.",
    descriptionEn: "Modern garden city-state of Asia.",
    heroImageUrl: "/images/destinations/singapore.jpg",
    latitude: 1.3521,
    longitude: 103.8198,
  },
  {
    slug: "bangkok-islands",
    nameVi: "Phuket",
    nameEn: "Phuket",
    countryCode: "TH",
    region: "Andaman",
    descriptionVi: "Đảo lớn Thái Lan với biển trong và nightlife.",
    descriptionEn: "Thailand's largest island getaway.",
    heroImageUrl: "/images/destinations/phuket.jpg",
    latitude: 7.8804,
    longitude: 98.3923,
  },
  {
    slug: "kyoto",
    nameVi: "Kyoto",
    nameEn: "Kyoto",
    countryCode: "JP",
    region: "Kansai",
    descriptionVi: "Cố đô Nhật với đền chùa và geisha.",
    descriptionEn: "Japan's cultural heart of temples and gardens.",
    heroImageUrl: "/images/destinations/kyoto.jpg",
    latitude: 35.0116,
    longitude: 135.7681,
  },
];

const hotelNames = [
  "Marina Bay Suites",
  "Old Town Heritage",
  "Ocean Breeze Resort",
  "Skyline Boutique",
  "Garden View Hotel",
  "Riverside Inn",
  "Sunset Villa",
  "Central Plaza Stay",
];

const amenitiesPool = [
  "wifi",
  "pool",
  "breakfast",
  "spa",
  "parking",
  "gym",
  "airport_shuttle",
  "beach_access",
];

async function main() {
  console.log("Seeding TravelAI catalog...");

  await prisma.review.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.itinerary.deleteMany();
  await prisma.hotel.deleteMany();
  await prisma.tour.deleteMany();
  await prisma.flight.deleteMany();
  await prisma.destination.deleteMany();

  const destRows = [];
  for (const d of destinations) {
    destRows.push(await prisma.destination.create({ data: d }));
  }

  let hotelCount = 0;
  for (const dest of destRows) {
    const n = dest.countryCode === "VN" ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const stars = 3 + (i % 3);
      const price = 450_000 + i * 350_000 + (dest.countryCode === "VN" ? 0 : 800_000);
      const hotel = await prisma.hotel.create({
        data: {
          slug: `${dest.slug}-hotel-${i + 1}`,
          name: `${hotelNames[i % hotelNames.length]} ${dest.nameEn}`,
          stars,
          priceFromVnd: price,
          destinationId: dest.id,
          descriptionVi: `Khách sạn ${stars}★ tại ${dest.nameVi}, vị trí thuận tiện cho khám phá.`,
          descriptionEn: `${stars}-star stay in ${dest.nameEn}, great for explorers.`,
          images: [
            dest.heroImageUrl,
            "/images/categories/hotels.jpg",
          ],
          amenities: amenitiesPool.slice(0, 4 + (i % 3)),
          rating: 4.2 + (i % 7) * 0.1,
        },
      });
      hotelCount++;
      await prisma.review.create({
        data: {
          author: "Lan Anh",
          rating: 5,
          body: `Rất thích kỳ nghỉ tại ${hotel.name}. Nhân viên thân thiện, view đẹp.`,
          hotelId: hotel.id,
        },
      });
      await prisma.review.create({
        data: {
          author: "Minh Tu",
          rating: 4,
          body: `Good value in ${dest.nameEn}. Would book again.`,
          hotelId: hotel.id,
        },
      });
    }
  }

  let tourCount = 0;
  for (const dest of destRows) {
    const variants = [
      { days: 1, titleVi: `Tour trong ngày ${dest.nameVi}`, titleEn: `${dest.nameEn} day trip` },
      { days: 3, titleVi: `Khám phá ${dest.nameVi} 3 ngày`, titleEn: `3-day ${dest.nameEn} explorer` },
    ];
    for (const [i, v] of variants.entries()) {
      await prisma.tour.create({
        data: {
          slug: `${dest.slug}-tour-${v.days}d`,
          titleVi: v.titleVi,
          titleEn: v.titleEn,
          durationDays: v.days,
          priceFromVnd: 790_000 * v.days + i * 100_000,
          destinationId: dest.id,
          descriptionVi: `Hành trình ${v.days} ngày tại ${dest.nameVi} với hướng dẫn viên địa phương.`,
          descriptionEn: `${v.days}-day guided journey through ${dest.nameEn}.`,
          images: [dest.heroImageUrl, "/images/categories/tours.jpg"],
        },
      });
      tourCount++;
    }
  }

  const routes: Array<[string, string, string]> = [
    ["HAN", "SGN", "Vietnam Airlines"],
    ["SGN", "HAN", "Vietjet Air"],
    ["HAN", "DAD", "Bamboo Airways"],
    ["DAD", "SGN", "Vietnam Airlines"],
    ["SGN", "PQC", "Vietjet Air"],
    ["HAN", "CXR", "Bamboo Airways"],
    ["SGN", "BKK", "Thai Airways"],
    ["HAN", "NRT", "Japan Airlines"],
    ["SGN", "ICN", "Korean Air"],
    ["HAN", "SIN", "Singapore Airlines"],
  ];

  let flightCount = 0;
  const base = new Date();
  base.setUTCHours(0, 0, 0, 0);
  for (let day = 0; day < 14; day++) {
    for (const [from, to, airline] of routes) {
      for (let slot = 0; slot < 2; slot++) {
        const depart = new Date(base);
        depart.setDate(base.getDate() + day);
        depart.setHours(7 + slot * 5, 30, 0, 0);
        const arrive = new Date(depart.getTime() + (2 + slot) * 60 * 60 * 1000);
        await prisma.flight.create({
          data: {
            airline,
            flightNumber: `${airline.slice(0, 2).toUpperCase()}${100 + day + slot}`,
            fromCode: from,
            toCode: to,
            departAt: depart,
            arriveAt: arrive,
            priceVnd: 1_200_000 + day * 15_000 + slot * 200_000,
            cabin: slot === 0 ? "economy" : "premium_economy",
          },
        });
        flightCount++;
      }
    }
  }

  console.log(
    JSON.stringify({
      destinations: destRows.length,
      hotels: hotelCount,
      tours: tourCount,
      flights: flightCount,
    }),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
