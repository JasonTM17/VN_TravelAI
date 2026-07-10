/**
 * Uniqueness + path integrity audit for TravelAI public catalog images.
 * Exit 0 only when every file in each audited group has a unique MD5 and
 * required destination heroes exist for all known slugs.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = path.resolve("web/public/images");
const DEST_SLUGS = [
  "ha-long",
  "hoi-an",
  "da-nang",
  "hue",
  "sapa",
  "da-lat",
  "nha-trang",
  "phu-quoc",
  "ha-noi",
  "tp-hcm",
  "can-tho",
  "ninh-binh",
  "tokyo",
  "seoul",
  "bangkok",
  "bali",
  "paris",
  "singapore",
  "phuket",
  "kyoto",
];

function md5(file) {
  return crypto.createHash("md5").update(fs.readFileSync(file)).digest("hex");
}

function auditDir(rel, { required = [] } = {}) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) {
    return { rel, ok: false, error: `missing dir ${dir}`, files: 0, unique: 0, dupes: [] };
  }
  const files = fs.readdirSync(dir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  const byHash = new Map();
  for (const f of files) {
    const h = md5(path.join(dir, f));
    if (!byHash.has(h)) byHash.set(h, []);
    byHash.get(h).push(f);
  }
  const dupes = [...byHash.entries()]
    .filter(([, names]) => names.length > 1)
    .map(([hash, names]) => ({ hash: hash.slice(0, 8), names }));

  const missing = required.filter((name) => !files.includes(name));
  const ok = dupes.length === 0 && missing.length === 0 && files.length > 0;
  return {
    rel,
    ok,
    files: files.length,
    unique: byHash.size,
    dupes,
    missing,
  };
}

const groups = [
  auditDir("destinations", {
    required: DEST_SLUGS.map((s) => `${s}.jpg`),
  }),
  auditDir("hotels", {
    required: [
      ...DEST_SLUGS.map((s) => `${s}.jpg`),
      ...DEST_SLUGS.map((s) => `${s}-2.jpg`),
    ],
  }),
  auditDir("tours", {
    required: DEST_SLUGS.map((s) => `${s}.jpg`),
  }),
  auditDir("categories"),
  auditDir("promo", {
    required: ["01-ha-long.jpg", "02-hoi-an.jpg", "03-da-nang.jpg", "04-sapa.jpg"],
  }),
];

// Cross-group: destination heroes must not share hash with hotel primary of same visual dump
// (optional soft check) — destinations vs hotels may differ intentionally.

let failed = false;
const lines = [];
for (const g of groups) {
  const line = `${g.rel}: files=${g.files} unique=${g.unique} ok=${g.ok}${
    g.missing?.length ? ` missing=${g.missing.join(",")}` : ""
  }${g.dupes?.length ? ` dupes=${JSON.stringify(g.dupes)}` : ""}`;
  lines.push(line);
  console.log(line);
  if (!g.ok) failed = true;
}

// Seed path smoke: every heroImageUrl pattern for destinations must exist
for (const slug of DEST_SLUGS) {
  const p = path.join(root, "destinations", `${slug}.jpg`);
  if (!fs.existsSync(p)) {
    console.error("MISSING dest hero", slug);
    failed = true;
  }
  for (const extra of [
    path.join(root, "hotels", `${slug}.jpg`),
    path.join(root, "hotels", `${slug}-2.jpg`),
    path.join(root, "tours", `${slug}.jpg`),
  ]) {
    if (!fs.existsSync(extra)) {
      console.error("MISSING product image", path.relative(root, extra));
      failed = true;
    }
  }
}

if (failed) {
  console.error("AUDIT FAILED");
  process.exit(2);
}
console.log("OK catalog imagery unique + complete");
process.exit(0);
