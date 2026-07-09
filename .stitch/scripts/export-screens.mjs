import fs from "node:fs";
import path from "node:path";

const key = process.env.STITCH_API_KEY;
if (!key) {
  console.error("STITCH_API_KEY required");
  process.exit(1);
}
const out = path.resolve(".stitch/designs");
fs.mkdirSync(out, { recursive: true });

const screens = [
  { p: "17173448084552159799", s: "7d88a83feb824cd2b126cadb4f6dc194", n: "wanderviet-home-traveloka" },
  { p: "17173448084552159799", s: "85bb628145804d0bab5aca67d8a18d85", n: "wanderviet-home-vi" },
  { p: "1439968317747880611", s: "e2920bf1cff2478595c22a2bcdd50d6c", n: "vietwander-home-hub" },
  { p: "1439968317747880611", s: "c94c681512044ff9ae562a682d60671b", n: "vietwander-home-tet-desktop" },
  { p: "1439968317747880611", s: "4b77d50e512149a18fbcf4f6e3c77cea", n: "vietwander-hotel-detail" },
  { p: "1439968317747880611", s: "f44c8c4124a949839b3480030a1e860b", n: "vietwander-booking-platform" },
];

async function call(name, args) {
  const res = await fetch("https://stitch.googleapis.com/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "X-Goog-Api-Key": key,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name, arguments: args },
    }),
  });
  return res.json();
}

function findUrls(obj, acc = {}) {
  if (!obj || typeof obj !== "object") return acc;
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string" && v.startsWith("http")) {
      const lk = k.toLowerCase();
      if (lk.includes("html") || v.includes("text/html")) acc.html = acc.html || v;
      if (
        lk.includes("screenshot") ||
        lk.includes("image") ||
        lk.includes("thumbnail") ||
        v.includes("googleusercontent") ||
        v.includes("lh3.")
      ) {
        acc.img = acc.img || v;
      }
      if (lk === "downloadurl") {
        if (v.includes("html") || lk.includes("code")) acc.html = acc.html || v;
        else acc.img = acc.img || v;
      }
    } else if (v && typeof v === "object") {
      findUrls(v, acc);
    }
  }
  return acc;
}

for (const sc of screens) {
  console.error("[i] get", sc.n);
  const r = await call("get_screen", {
    projectId: sc.p,
    screenId: sc.s,
    name: `projects/${sc.p}/screens/${sc.s}`,
  });
  const text =
    r.result?.content?.map((c) => c.text).join("\n") || JSON.stringify(r, null, 2);
  fs.writeFileSync(path.join(out, `${sc.n}.json`), text);
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = r;
  }
  const urls = findUrls(data);
  console.error(" urls", urls);
  if (urls.html) {
    try {
      const html = await (await fetch(urls.html)).text();
      fs.writeFileSync(path.join(out, `${sc.n}.html`), html);
      console.error(" wrote html", html.length);
    } catch (e) {
      console.error(" html fail", e.message);
    }
  }
  if (urls.img) {
    try {
      const buf = Buffer.from(await (await fetch(urls.img)).arrayBuffer());
      fs.writeFileSync(path.join(out, `${sc.n}.png`), buf);
      console.error(" wrote png", buf.length);
    } catch (e) {
      console.error(" png fail", e.message);
    }
  }
}
console.log("done");
