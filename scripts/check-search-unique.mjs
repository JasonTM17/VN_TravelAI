/**
 * Drives live GET /v1/search and asserts no duplicate slugs in each hit group.
 * Requires running api with Meili reindexed from current Postgres.
 *
 * Usage: node scripts/check-search-unique.mjs [baseApi] [q]
 */
const base = process.argv[2] || "http://127.0.0.1:53001";
const q = process.argv[3] || "Hoi";

function uniqueSlugs(hits, key = "slug") {
  const slugs = (hits || []).map((h) => h[key]).filter(Boolean);
  const set = new Set(slugs);
  return { total: slugs.length, unique: set.size, dups: slugs.length - set.size };
}

const res = await fetch(`${base}/v1/search?q=${encodeURIComponent(q)}`);
if (!res.ok) {
  console.error("search HTTP", res.status, await res.text());
  process.exit(1);
}
const body = await res.json();
const data = body.data || {};
const dest = uniqueSlugs(data.destinations);
const hotels = uniqueSlugs(data.hotels);
const tours = uniqueSlugs(data.tours);

console.log(JSON.stringify({ q, dest, hotels, tours }, null, 2));

if (dest.dups > 0 || hotels.dups > 0 || tours.dups > 0) {
  console.error("FAIL: Meili search returned duplicate slugs (stale reindex?)");
  process.exit(2);
}
if (dest.total + hotels.total + tours.total === 0) {
  console.error("FAIL: empty search hits");
  process.exit(3);
}
console.log("OK search hits unique by slug");
process.exit(0);
