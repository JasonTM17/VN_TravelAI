/**
 * Structural checks for mobile/admin/gallery acceptance (source + public assets).
 * Exit 0 only when required files and promo slides exist.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [];

function ok(name, pass, detail = "") {
  checks.push({ name, pass, detail });
  console.log(`${pass ? "OK" : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
}

const files = [
  "web/src/components/image-gallery.tsx",
  "web/src/components/promo-carousel.tsx",
  "web/src/components/admin-console.tsx",
  "web/src/app/[locale]/admin/page.tsx",
  "web/src/lib/gallery-slides.ts",
  "web/src/lib/jwt-role.ts",
];
for (const f of files) {
  ok(`exists ${f}`, fs.existsSync(path.join(root, f)));
}

const gallerySrc = fs.readFileSync(path.join(root, "web/src/components/image-gallery.tsx"), "utf8");
ok("gallery multi-slide controls", /gallery-prev/.test(gallerySrc) && /gallery-next/.test(gallerySrc));

const hotelDetail = fs.readFileSync(
  path.join(root, "web/src/app/[locale]/hotels/[slug]/page.tsx"),
  "utf8",
);
ok("hotel detail uses ImageGallery", /ImageGallery/.test(hotelDetail));
ok("hotel detail not only images\\[0\\] hero", !/images\?\.\[0\].*Image/.test(hotelDetail.replace(/\s/g, "")));

const tourDetail = fs.readFileSync(path.join(root, "web/src/app/[locale]/tours/[slug]/page.tsx"), "utf8");
ok("tour detail uses ImageGallery", /ImageGallery/.test(tourDetail));

const home = fs.readFileSync(path.join(root, "web/src/app/[locale]/page.tsx"), "utf8");
ok("home uses PromoCarousel", /PromoCarousel/.test(home) && /buildHomePromoSlides/.test(home));

const navbar = fs.readFileSync(path.join(root, "web/src/components/navbar.tsx"), "utf8");
ok("navbar mobile menu + min touch", /md:hidden/.test(navbar) && /min-h-11/.test(navbar));
ok("navbar admin link", /admin/.test(navbar));

const promoDir = path.join(root, "web/public/images/promo");
const promos = fs.readdirSync(promoDir).filter((f) => /\.jpe?g$/i.test(f));
ok("promo slides ≥3 files", promos.length >= 3, `count=${promos.length}`);
for (const name of ["01-ha-long.jpg", "02-hoi-an.jpg", "03-da-nang.jpg"]) {
  ok(`promo file ${name}`, fs.existsSync(path.join(promoDir, name)));
}

const apiMain = fs.readFileSync(path.join(root, "api/src/main.ts"), "utf8");
ok("api admin reindex route", /\/v1\/admin\/reindex/.test(apiMain));
ok("api admin audit route", /\/v1\/admin\/audit/.test(apiMain));

const failed = checks.some((c) => !c.pass);
if (failed) {
  console.error("STRUCTURAL CHECK FAILED");
  process.exit(1);
}
console.log("STRUCTURAL CHECK PASSED");
process.exit(0);
