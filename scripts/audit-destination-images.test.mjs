/**
 * Drives the real audit script entrypoint against real public image files.
 * Fails if destination heroes collide or required product images are missing.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(root, "scripts", "audit-destination-images.mjs");

const result = spawnSync(process.execPath, [script], {
  cwd: root,
  encoding: "utf8",
});

const out = `${result.stdout}\n${result.stderr}`;
console.log(out);

if (result.status !== 0) {
  console.error("audit script exited", result.status);
  process.exit(1);
}

if (!out.includes("OK catalog imagery unique + complete")) {
  console.error("audit did not report success");
  process.exit(1);
}

// Structural: sample paths from seed must exist on disk
const samples = [
  "web/public/images/destinations/ha-long.jpg",
  "web/public/images/destinations/bali.jpg",
  "web/public/images/hotels/ha-long.jpg",
  "web/public/images/hotels/bali.jpg",
  "web/public/images/tours/ha-long.jpg",
  "web/public/images/tours/bangkok.jpg",
];
for (const rel of samples) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs) || fs.statSync(abs).size < 1000) {
    console.error("missing or tiny asset", rel);
    process.exit(1);
  }
}

// Dest heroes ha-long vs bali must differ in content
const a = fs.readFileSync(path.join(root, "web/public/images/destinations/ha-long.jpg"));
const b = fs.readFileSync(path.join(root, "web/public/images/destinations/bali.jpg"));
if (Buffer.compare(a, b) === 0) {
  console.error("ha-long and bali destination files are identical");
  process.exit(1);
}

// Hotel primary must differ from destination hero for same slug
const dest = fs.readFileSync(path.join(root, "web/public/images/destinations/ha-long.jpg"));
const hotel = fs.readFileSync(path.join(root, "web/public/images/hotels/ha-long.jpg"));
if (Buffer.compare(dest, hotel) === 0) {
  console.error("hotel image must not be identical binary to destination hero");
  process.exit(1);
}

console.log("TEST OK audit + path integrity");
process.exit(0);
