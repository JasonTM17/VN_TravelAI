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
    slug: "phuket",
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
  // --- Expanded catalog (reuses existing public images by region family) ---
  { slug: "mui-ne", nameVi: "Mũi Né", nameEn: "Mui Ne", countryCode: "VN", region: "South Central", descriptionVi: "Đồi cát bay, resort biển Phan Thiết.", descriptionEn: "Sand dunes and beach resorts near Phan Thiet.", heroImageUrl: "/images/destinations/nha-trang.jpg", latitude: 10.933, longitude: 108.283 },
  { slug: "con-dao", nameVi: "Côn Đảo", nameEn: "Con Dao", countryCode: "VN", region: "Southwest", descriptionVi: "Đảo lịch sử, biển xanh và rùa biển.", descriptionEn: "Historic island with pristine waters.", heroImageUrl: "/images/destinations/phu-quoc.jpg", latitude: 8.693, longitude: 106.61 },
  { slug: "ha-giang", nameVi: "Hà Giang", nameEn: "Ha Giang", countryCode: "VN", region: "Northeast", descriptionVi: "Cao nguyên đá, đèo Mã Pí Lèng.", descriptionEn: "Rocky plateau and epic mountain passes.", heroImageUrl: "/images/destinations/sapa.jpg", latitude: 22.823, longitude: 104.984 },
  { slug: "mai-chau", nameVi: "Mai Châu", nameEn: "Mai Chau", countryCode: "VN", region: "Northwest", descriptionVi: "Thung lũng xanh, homestay dân tộc Thái.", descriptionEn: "Green valley and Thai ethnic homestays.", heroImageUrl: "/images/destinations/ninh-binh.jpg", latitude: 20.66, longitude: 105.09 },
  { slug: "quy-nhon", nameVi: "Quy Nhơn", nameEn: "Quy Nhon", countryCode: "VN", region: "South Central", descriptionVi: "Biển êm, Eo Gió và ẩm thực Bình Định.", descriptionEn: "Quiet beaches and Binh Dinh cuisine.", heroImageUrl: "/images/destinations/da-nang.jpg", latitude: 13.783, longitude: 109.219 },
  { slug: "vung-tau", nameVi: "Vũng Tàu", nameEn: "Vung Tau", countryCode: "VN", region: "Southeast", descriptionVi: "Biển gần Sài Gòn, hải đăng và hải sản.", descriptionEn: "Closest beach escape from Saigon.", heroImageUrl: "/images/destinations/tp-hcm.jpg", latitude: 10.346, longitude: 107.084 },
  { slug: "phan-thiet", nameVi: "Phan Thiết", nameEn: "Phan Thiet", countryCode: "VN", region: "South Central", descriptionVi: "Nước mắm, biển và resort cao cấp.", descriptionEn: "Coastal town of fish sauce and resorts.", heroImageUrl: "/images/destinations/nha-trang.jpg", latitude: 10.928, longitude: 108.102 },
  { slug: "cat-ba", nameVi: "Cát Bà", nameEn: "Cat Ba", countryCode: "VN", region: "Northeast", descriptionVi: "Cổng vào Lan Hạ, leo núi và kayak.", descriptionEn: "Gateway to Lan Ha Bay.", heroImageUrl: "/images/destinations/ha-long.jpg", latitude: 20.728, longitude: 107.048 },
  { slug: "tam-dao", nameVi: "Tam Đảo", nameEn: "Tam Dao", countryCode: "VN", region: "North", descriptionVi: "Thị trấn trên mây gần Hà Nội.", descriptionEn: "Cloud-town getaway near Hanoi.", heroImageUrl: "/images/destinations/ha-noi.jpg", latitude: 21.456, longitude: 105.643 },
  { slug: "chau-doc", nameVi: "Châu Đốc", nameEn: "Chau Doc", countryCode: "VN", region: "Mekong Delta", descriptionVi: "Miếu Bà, biên giới và ẩm thực An Giang.", descriptionEn: "Mekong border town of temples and markets.", heroImageUrl: "/images/destinations/can-tho.jpg", latitude: 10.701, longitude: 105.117 },
  { slug: "osaka", nameVi: "Osaka", nameEn: "Osaka", countryCode: "JP", region: "Kansai", descriptionVi: "Thủ phủ ẩm thực Nhật, lâu đài Osaka.", descriptionEn: "Japan's kitchen and castle city.", heroImageUrl: "/images/destinations/tokyo.jpg", latitude: 34.694, longitude: 135.502 },
  { slug: "busan", nameVi: "Busan", nameEn: "Busan", countryCode: "KR", region: "Southeast", descriptionVi: "Thành phố biển Hàn — Haeundae, chợ Jagalchi.", descriptionEn: "Korea's beach metropolis.", heroImageUrl: "/images/destinations/seoul.jpg", latitude: 35.18, longitude: 129.075 },
  { slug: "chiang-mai", nameVi: "Chiang Mai", nameEn: "Chiang Mai", countryCode: "TH", region: "North", descriptionVi: "Đền cổ, chợ đêm và đồi phía Bắc Thái.", descriptionEn: "Northern Thai temples and night markets.", heroImageUrl: "/images/destinations/bangkok.jpg", latitude: 18.788, longitude: 98.985 },
  { slug: "krabi", nameVi: "Krabi", nameEn: "Krabi", countryCode: "TH", region: "Andaman", descriptionVi: "Vách đá vôi, Railay và đảo ngoài khơi.", descriptionEn: "Limestone cliffs and Andaman islands.", heroImageUrl: "/images/destinations/phuket.jpg", latitude: 8.086, longitude: 98.906 },
  { slug: "jakarta", nameVi: "Jakarta", nameEn: "Jakarta", countryCode: "ID", region: "Java", descriptionVi: "Thủ đô Indonesia sôi động.", descriptionEn: "Indonesia's bustling capital.", heroImageUrl: "/images/destinations/bali.jpg", latitude: -6.208, longitude: 106.846 },
  { slug: "kuala-lumpur", nameVi: "Kuala Lumpur", nameEn: "Kuala Lumpur", countryCode: "MY", region: "Federal", descriptionVi: "Tháp đôi Petronas và street food.", descriptionEn: "Petronas Towers and street food capital.", heroImageUrl: "/images/destinations/singapore.jpg", latitude: 3.139, longitude: 101.687 },
  { slug: "hong-kong", nameVi: "Hồng Kông", nameEn: "Hong Kong", countryCode: "HK", region: "Pearl River", descriptionVi: "Skyline cảng Victoria, dim sum.", descriptionEn: "Victoria Harbour skyline and dim sum.", heroImageUrl: "/images/destinations/tokyo.jpg", latitude: 22.319, longitude: 114.169 },
  { slug: "taipei", nameVi: "Đài Bắc", nameEn: "Taipei", countryCode: "TW", region: "North Taiwan", descriptionVi: "Night market, Tamsui và văn hóa Đài.", descriptionEn: "Night markets and modern Taiwanese culture.", heroImageUrl: "/images/destinations/seoul.jpg", latitude: 25.033, longitude: 121.565 },
  { slug: "sydney", nameVi: "Sydney", nameEn: "Sydney", countryCode: "AU", region: "NSW", descriptionVi: "Opera House, bãi biển Bondi.", descriptionEn: "Opera House and Bondi Beach.", heroImageUrl: "/images/destinations/paris.jpg", latitude: -33.869, longitude: 151.209 },
  { slug: "dubai", nameVi: "Dubai", nameEn: "Dubai", countryCode: "AE", region: "UAE", descriptionVi: "Siêu đô thị sa mạc, Burj Khalifa.", descriptionEn: "Desert metropolis and Burj Khalifa.", heroImageUrl: "/images/destinations/singapore.jpg", latitude: 25.205, longitude: 55.271 },
  { slug: "london", nameVi: "London", nameEn: "London", countryCode: "GB", region: "England", descriptionVi: "Thủ đô Anh — bảo tàng, Big Ben, West End.", descriptionEn: "Museums, Big Ben, and West End.", heroImageUrl: "/images/destinations/paris.jpg", latitude: 51.507, longitude: -0.128 },
  { slug: "rome", nameVi: "Rome", nameEn: "Rome", countryCode: "IT", region: "Lazio", descriptionVi: "Colosseum, Vatican và pasta.", descriptionEn: "Eternal city of ruins and pasta.", heroImageUrl: "/images/destinations/paris.jpg", latitude: 41.903, longitude: 12.496 },
];

/** Map destination slug → existing on-disk image basename (hotels/tours/destinations). */
function imageBaseFor(dest: { slug: string; heroImageUrl: string }) {
  const m = dest.heroImageUrl.match(/\/destinations\/([^/]+)\.jpe?g$/i);
  if (m?.[1]) return m[1];
  return dest.slug;
}

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
  await prisma.transport.deleteMany();
  await prisma.promo.deleteMany();
  await prisma.destination.deleteMany();

  const destRows = [];
  for (const d of destinations) {
    destRows.push(await prisma.destination.create({ data: d }));
  }

  let hotelCount = 0;
  for (const dest of destRows) {
    // Dense marketplace: ≥3–4 hotels per destination (targets ≥120 total)
    const n = dest.countryCode === "VN" ? 4 : 3;
    const imgBase = imageBaseFor(dest);
    for (let i = 0; i < n; i++) {
      const stars = 3 + (i % 3);
      const slugMix =
        [...dest.slug].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 17;
      const price =
        (dest.countryCode === "VN" ? 480_000 : 1_350_000) +
        i * 520_000 +
        slugMix * 95_000 +
        stars * 110_000 +
        (hotelCount % 9) * 35_000;
      const hotel = await prisma.hotel.create({
        data: {
          slug: `${dest.slug}-hotel-${i + 1}`,
          name: `${hotelNames[(i + dest.slug.charCodeAt(0) + hotelCount) % hotelNames.length]} ${dest.nameEn}`,
          stars,
          priceFromVnd: price,
          destinationId: dest.id,
          descriptionVi: `Khách sạn ${stars}★ tại ${dest.nameVi} — gần trung tâm, phù hợp cặp đôi & gia đình.`,
          descriptionEn: `${stars}-star stay in ${dest.nameEn} — central location for couples & families.`,
          images: [
            i % 2 === 0 ? `/images/hotels/${imgBase}.jpg` : `/images/hotels/${imgBase}-2.jpg`,
            dest.heroImageUrl,
            "/images/categories/hotels.jpg",
          ],
          amenities: amenitiesPool.slice(0, 4 + (i % 3)),
          rating: Math.round((4.1 + (i % 8) * 0.1 + (dest.slug.length % 3) * 0.05) * 10) / 10,
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

  /** Destination-specific tour packs — avoids copy-paste titles/prices on home */
  const tourPacks: Record<
    string,
    Array<{ days: number; titleVi: string; titleEn: string; price: number }>
  > = {
    "da-nang": [
      { days: 1, titleVi: "Tour Bà Nà Hills 1 ngày — Cầu Vàng", titleEn: "Ba Na Hills day tour — Golden Bridge", price: 1_250_000 },
      { days: 3, titleVi: "Đà Nẵng – Hội An – Sơn Trà 3N2Đ", titleEn: "Da Nang – Hoi An – Son Tra 3D2N", price: 3_890_000 },
    ],
    "hoi-an": [
      { days: 1, titleVi: "Phố cổ Hội An & lồng đèn về đêm", titleEn: "Hoi An Old Town & lantern night walk", price: 690_000 },
      { days: 3, titleVi: "Hội An – Mỹ Sơn – biển An Bàng 3 ngày", titleEn: "Hoi An – My Son – An Bang 3 days", price: 3_450_000 },
    ],
    "ha-long": [
      { days: 1, titleVi: "Du thuyền Vịnh Hạ Long 1 ngày", titleEn: "Ha Long Bay day cruise", price: 1_150_000 },
      { days: 2, titleVi: "Du thuyền ngủ đêm 5★ Hạ Long", titleEn: "Overnight 5★ Ha Long cruise", price: 4_990_000 },
    ],
    hue: [
      { days: 1, titleVi: "Đại Nội – lăng tẩm – chùa Thiên Mụ", titleEn: "Citadel – royal tombs – Thien Mu", price: 850_000 },
      { days: 3, titleVi: "Huế cung đình 3 ngày ẩm thực", titleEn: "Imperial Hue 3-day food journey", price: 2_990_000 },
    ],
    sapa: [
      { days: 2, titleVi: "Trekking Sapa – Bản Cát Cát 2N1Đ", titleEn: "Sapa trekking Cat Cat 2D1N", price: 2_150_000 },
      { days: 3, titleVi: "Fansipan & ruộng bậc thang 3 ngày", titleEn: "Fansipan & terraces 3 days", price: 3_750_000 },
    ],
    "phu-quoc": [
      { days: 1, titleVi: "Tour 4 đảo Phú Quốc & cáp treo", titleEn: "Phu Quoc 4 islands & cable car", price: 1_350_000 },
      { days: 3, titleVi: "Phú Quốc nghỉ dưỡng 3N2Đ", titleEn: "Phu Quoc resort escape 3D2N", price: 5_490_000 },
    ],
    "da-lat": [
      { days: 1, titleVi: "Đà Lạt city tour – đồi chè – hồ Tuyền Lâm", titleEn: "Da Lat city – tea hills – Tuyen Lam", price: 790_000 },
      { days: 3, titleVi: "Đà Lạt ngàn hoa 3 ngày", titleEn: "Da Lat flower city 3 days", price: 2_890_000 },
    ],
    "nha-trang": [
      { days: 1, titleVi: "Lặn biển Hòn Mun 1 ngày", titleEn: "Hon Mun snorkeling day trip", price: 980_000 },
      { days: 3, titleVi: "Nha Trang – VinWonders 3 ngày", titleEn: "Nha Trang VinWonders 3 days", price: 4_200_000 },
    ],
    "ninh-binh": [
      { days: 1, titleVi: "Tam Cốc – Bích Động thuyền nan", titleEn: "Tam Coc – Bich Dong boat day", price: 720_000 },
      { days: 2, titleVi: "Tràng An – Hang Múa 2 ngày", titleEn: "Trang An – Hang Mua 2 days", price: 1_890_000 },
    ],
    "can-tho": [
      { days: 1, titleVi: "Chợ nổi Cái Răng – Mỹ Tho", titleEn: "Cai Rang floating market day", price: 690_000 },
      { days: 2, titleVi: "Miền Tây sông nước 2N1Đ", titleEn: "Mekong Delta 2D1N", price: 1_650_000 },
    ],
    "ha-noi": [
      { days: 1, titleVi: "Hà Nội phố cổ & ẩm thực 1 ngày", titleEn: "Hanoi Old Quarter food day", price: 650_000 },
      { days: 3, titleVi: "Hà Nội – Ninh Bình – Hạ Long 3 ngày", titleEn: "Hanoi – Ninh Binh – Ha Long 3D", price: 4_590_000 },
    ],
    "tp-hcm": [
      { days: 1, titleVi: "Sài Gòn city – Củ Chi 1 ngày", titleEn: "Saigon city & Cu Chi day", price: 780_000 },
      { days: 3, titleVi: "Sài Gòn – Mekong 3 ngày", titleEn: "Saigon – Mekong 3 days", price: 3_290_000 },
    ],
    tokyo: [
      { days: 1, titleVi: "Tokyo city hop – Asakusa – Shibuya", titleEn: "Tokyo highlights Asakusa–Shibuya", price: 2_450_000 },
      { days: 3, titleVi: "Tokyo – Mt Fuji 3 ngày", titleEn: "Tokyo – Mt Fuji 3 days", price: 8_900_000 },
    ],
    seoul: [
      { days: 1, titleVi: "Seoul palace & Hongdae 1 ngày", titleEn: "Seoul palace & Hongdae day", price: 1_990_000 },
      { days: 3, titleVi: "Seoul – Nami 3 ngày", titleEn: "Seoul – Nami Island 3 days", price: 7_450_000 },
    ],
    bangkok: [
      { days: 1, titleVi: "Bangkok temples & Chao Phraya", titleEn: "Bangkok temples & river cruise", price: 1_150_000 },
      { days: 3, titleVi: "Bangkok – Ayutthaya 3 ngày", titleEn: "Bangkok – Ayutthaya 3 days", price: 4_200_000 },
    ],
    bali: [
      { days: 1, titleVi: "Bali Ubud rice terraces day", titleEn: "Ubud rice terraces day trip", price: 1_450_000 },
      { days: 3, titleVi: "Bali beach & temple 3 ngày", titleEn: "Bali beach & temple 3 days", price: 6_800_000 },
    ],
    singapore: [
      { days: 1, titleVi: "Marina Bay & Gardens by the Bay", titleEn: "Marina Bay & Gardens day", price: 2_100_000 },
      { days: 3, titleVi: "Singapore city break 3 ngày", titleEn: "Singapore city break 3 days", price: 9_500_000 },
    ],
    paris: [
      { days: 1, titleVi: "Paris classic – Louvre – Seine", titleEn: "Paris classic Louvre & Seine", price: 3_200_000 },
      { days: 3, titleVi: "Paris romance 3 ngày", titleEn: "Paris romance 3 days", price: 12_500_000 },
    ],
    kyoto: [
      { days: 1, titleVi: "Kyoto Fushimi Inari & Gion", titleEn: "Fushimi Inari & Gion day", price: 2_350_000 },
      { days: 3, titleVi: "Kyoto temple trail 3 ngày", titleEn: "Kyoto temple trail 3 days", price: 9_200_000 },
    ],
    phuket: [
      { days: 1, titleVi: "Phuket islands speedboat day", titleEn: "Phuket islands speedboat day", price: 1_680_000 },
      { days: 3, titleVi: "Phuket beach escape 3 ngày", titleEn: "Phuket beach escape 3 days", price: 5_950_000 },
    ],
  };

  let tourCount = 0;
  for (const dest of destRows) {
    const imgBase = imageBaseFor(dest);
    const basePacks =
      tourPacks[dest.slug] ??
      ([
        {
          days: 1,
          titleVi: `Tour khám phá ${dest.nameVi} 1 ngày`,
          titleEn: `${dest.nameEn} discovery day trip`,
          price: dest.countryCode === "VN" ? 750_000 + tourCount * 17_000 : 1_800_000 + tourCount * 40_000,
        },
        {
          days: 3,
          titleVi: `Hành trình ${dest.nameVi} 3 ngày 2 đêm`,
          titleEn: `${dest.nameEn} 3D2N journey`,
          price: dest.countryCode === "VN" ? 2_800_000 + tourCount * 50_000 : 6_500_000 + tourCount * 80_000,
        },
      ] as Array<{ days: number; titleVi: string; titleEn: string; price: number }>);

    // Ensure ≥3 tours per destination for density (targets ≥80 total)
    const packs = [...basePacks];
    if (!packs.some((p) => p.days === 2)) {
      packs.push({
        days: 2,
        titleVi: `Cuối tuần tại ${dest.nameVi} 2N1Đ`,
        titleEn: `${dest.nameEn} weekend 2D1N`,
        price: dest.countryCode === "VN" ? 1_650_000 + tourCount * 21_000 : 4_200_000 + tourCount * 55_000,
      });
    }
    if (packs.length < 3) {
      packs.push({
        days: 4,
        titleVi: `Deep dive ${dest.nameVi} 4 ngày`,
        titleEn: `${dest.nameEn} deep dive 4 days`,
        price: dest.countryCode === "VN" ? 4_200_000 + tourCount * 40_000 : 9_800_000 + tourCount * 70_000,
      });
    }

    for (const v of packs) {
      await prisma.tour.create({
        data: {
          slug: `${dest.slug}-tour-${v.days}d`,
          titleVi: v.titleVi,
          titleEn: v.titleEn,
          durationDays: v.days,
          priceFromVnd: v.price,
          destinationId: dest.id,
          descriptionVi: `${v.titleVi}. Hướng dẫn viên địa phương, đón trả khách sạn khu vực trung tâm ${dest.nameVi}.`,
          descriptionEn: `${v.titleEn}. Local guide, hotel pickup around central ${dest.nameEn}.`,
          images: [
            `/images/tours/${imgBase}.jpg`,
            dest.heroImageUrl,
            "/images/categories/tours.jpg",
          ],
        },
      });
      tourCount++;
    }
  }

  // Data-driven home promos (UI must not hard-code product titles)
  const promoSeeds = [
    {
      slug: "ha-long-cruise",
      titleVi: "Du thuyền Hạ Long đẳng cấp",
      titleEn: "Ha Long premium cruise",
      badgeVi: "Giảm đến 30%",
      badgeEn: "Up to 30% off",
      badgeTone: "error",
      imageUrl: "/images/promo/01-ha-long.jpg",
      hrefPath: "/destinations/ha-long",
      sortOrder: 1,
    },
    {
      slug: "hoi-an-lanterns",
      titleVi: "Hội An — Mùa lồng đèn lung linh",
      titleEn: "Hoi An lantern nights",
      badgeVi: "Combo khách sạn + vé",
      badgeEn: "Hotel + flight combo",
      badgeTone: "cta",
      imageUrl: "/images/promo/02-hoi-an.jpg",
      hrefPath: "/destinations/hoi-an",
      sortOrder: 2,
    },
    {
      slug: "da-nang-beach",
      titleVi: "Đà Nẵng biển Mỹ Khê",
      titleEn: "Da Nang My Khe beach",
      badgeVi: "Deal cuối tuần",
      badgeEn: "Weekend deal",
      badgeTone: "info",
      imageUrl: "/images/promo/03-da-nang.jpg",
      hrefPath: "/destinations/da-nang",
      sortOrder: 3,
    },
    {
      slug: "sapa-clouds",
      titleVi: "Sapa săn mây Tây Bắc",
      titleEn: "Sapa cloud hunting",
      badgeVi: "Tour 2N1Đ",
      badgeEn: "2D1N tour",
      badgeTone: "cta",
      imageUrl: "/images/promo/04-sapa.jpg",
      hrefPath: "/destinations/sapa",
      sortOrder: 4,
    },
    {
      slug: "phu-quoc-island",
      titleVi: "Phú Quốc — Đảo ngọc",
      titleEn: "Phu Quoc pearl island",
      badgeVi: "Resort sale",
      badgeEn: "Resort sale",
      badgeTone: "error",
      imageUrl: "/images/destinations/phu-quoc.jpg",
      hrefPath: "/destinations/phu-quoc",
      sortOrder: 5,
    },
  ];
  for (const p of promoSeeds) {
    await prisma.promo.create({ data: { ...p, active: true } });
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

  const transportRoutes: Array<{
    mode: "bus" | "train";
    operator: string;
    fromCity: string;
    toCity: string;
    fromCode: string;
    toCode: string;
    hours: number;
    price: number;
  }> = [
    { mode: "train", operator: "Đường sắt Việt Nam", fromCity: "Hà Nội", toCity: "Đà Nẵng", fromCode: "HAN", toCode: "DAD", hours: 15, price: 650_000 },
    { mode: "train", operator: "Đường sắt Việt Nam", fromCity: "Hà Nội", toCity: "TP.HCM", fromCode: "HAN", toCode: "SGN", hours: 32, price: 1_100_000 },
    { mode: "train", operator: "Đường sắt Việt Nam", fromCity: "Đà Nẵng", toCity: "TP.HCM", fromCode: "DAD", toCode: "SGN", hours: 16, price: 720_000 },
    { mode: "train", operator: "SE Express", fromCity: "Hà Nội", toCity: "Huế", fromCode: "HAN", toCode: "HUI", hours: 12, price: 580_000 },
    { mode: "bus", operator: "Phương Trang", fromCity: "TP.HCM", toCity: "Đà Lạt", fromCode: "SGN", toCode: "DLI", hours: 7, price: 280_000 },
    { mode: "bus", operator: "Phương Trang", fromCity: "TP.HCM", toCity: "Nha Trang", fromCode: "SGN", toCode: "CXR", hours: 8, price: 320_000 },
    { mode: "bus", operator: "Hoàng Long", fromCity: "Hà Nội", toCity: "Hạ Long", fromCode: "HAN", toCode: "VDO", hours: 3, price: 150_000 },
    { mode: "bus", operator: "Mai Linh", fromCity: "Đà Nẵng", toCity: "Hội An", fromCode: "DAD", toCode: "HOI", hours: 1, price: 80_000 },
    { mode: "bus", operator: "Kumho Samco", fromCity: "TP.HCM", toCity: "Cần Thơ", fromCode: "SGN", toCode: "VCA", hours: 4, price: 180_000 },
    { mode: "bus", operator: "Sapa Express", fromCity: "Hà Nội", toCity: "Sa Pa", fromCode: "HAN", toCode: "SPA", hours: 6, price: 350_000 },
  ];

  let transportCount = 0;
  for (let day = 0; day < 7; day++) {
    for (const [idx, r] of transportRoutes.entries()) {
      const depart = new Date(base);
      depart.setDate(base.getDate() + day);
      depart.setHours(6 + (idx % 4) * 3, 0, 0, 0);
      const arrive = new Date(depart.getTime() + r.hours * 60 * 60 * 1000);
      await prisma.transport.create({
        data: {
          slug: `${r.mode}-${r.fromCode}-${r.toCode}-d${day}-s${idx}`,
          operator: r.operator,
          mode: r.mode,
          fromCity: r.fromCity,
          toCity: r.toCity,
          fromCode: r.fromCode,
          toCode: r.toCode,
          departAt: depart,
          arriveAt: arrive,
          priceVnd: r.price + day * 10_000,
          durationMin: r.hours * 60,
          seatsLeft: 20 + ((day + idx) % 20),
        },
      });
      transportCount++;
    }
  }

  const promoCount = await prisma.promo.count();
  console.log(
    JSON.stringify({
      destinations: destRows.length,
      hotels: hotelCount,
      tours: tourCount,
      flights: flightCount,
      transports: transportCount,
      promos: promoCount,
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
