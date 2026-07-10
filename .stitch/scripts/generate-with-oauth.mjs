import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const OUT = path.resolve(".stitch/designs");
fs.mkdirSync(OUT, { recursive: true });

function getToken() {
  if (process.env.ADC_TOKEN) return process.env.ADC_TOKEN.trim();
  return execSync("gcloud auth application-default print-access-token", {
    encoding: "utf8",
  }).trim();
}

const token = getToken();
const quotaProject =
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  "gen-lang-client-0100741870";

async function mcp(method, params = {}, id = 1) {
  const res = await fetch("https://stitch.googleapis.com/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      Authorization: `Bearer ${token}`,
      "x-goog-user-project": quotaProject,
    },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON ${res.status}: ${text.slice(0, 400)}`);
  }
  if (json.error) throw new Error(JSON.stringify(json.error));
  return json.result;
}

async function callTool(name, args) {
  console.error(`[i] tools/call ${name}`);
  return mcp("tools/call", { name, arguments: args });
}

function extractText(result) {
  if (!result) return "";
  if (typeof result === "string") return result;
  if (Array.isArray(result.content)) {
    return result.content.map((c) => c.text || JSON.stringify(c)).join("\n");
  }
  return JSON.stringify(result);
}

function findUrls(obj, acc = {}) {
  if (!obj || typeof obj !== "object") return acc;
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string" && v.startsWith("http")) {
      const lk = k.toLowerCase();
      if (lk.includes("html")) acc.html = acc.html || v;
      if (
        lk.includes("screenshot") ||
        lk.includes("image") ||
        v.includes("googleusercontent")
      ) {
        acc.img = acc.img || v;
      }
      if (lk === "downloadurl") {
        if (v.includes("html") || v.includes("text")) acc.html = acc.html || v;
        else acc.img = acc.img || v;
      }
    } else if (v && typeof v === "object") findUrls(v, acc);
  }
  return acc;
}

const projectId = process.argv[2] || "15599239006963878951";
const promptFile =
  process.argv[3] || path.resolve(".stitch/prompts/home-desktop.txt");
const prompt = fs.readFileSync(promptFile, "utf8");

await mcp("initialize", {
  protocolVersion: "2024-11-05",
  capabilities: {},
  clientInfo: { name: "travelai-oauth", version: "1.0.0" },
});

console.error("[i] list_projects smoke...");
const lp = await callTool("list_projects", {});
if (lp.isError) {
  console.error(extractText(lp));
  process.exit(1);
}
console.error("[OK] list_projects");

console.error("[i] generate_screen_from_text...");
const gen = await callTool("generate_screen_from_text", {
  projectId,
  deviceType: "DESKTOP",
  prompt,
});
const raw = extractText(gen);
fs.writeFileSync(path.join(OUT, "generate_home_oauth.json"), raw);
console.error("[i] isError=", gen.isError);
console.log(raw.slice(0, 3000));
if (gen.isError) process.exit(2);

let data;
try {
  data = JSON.parse(raw);
} catch {
  data = gen;
}
const urls = findUrls(data);
console.error("[i] urls", urls);

// Try common nested shapes for screen ids
const str = JSON.stringify(data);
const screenMatch = str.match(/screens\/([a-f0-9]{16,})/i);
if (screenMatch) {
  console.error("[OK] screenId", screenMatch[1]);
  fs.writeFileSync(
    path.join(OUT, "last-screen-id.txt"),
    screenMatch[1],
    "utf8",
  );
}

if (urls.img) {
  const buf = Buffer.from(await (await fetch(urls.img)).arrayBuffer());
  fs.writeFileSync(path.join(OUT, "travelai-home-generated.png"), buf);
  console.error("[OK] wrote travelai-home-generated.png", buf.length);
}
if (urls.html) {
  try {
    const htmlRes = await fetch(urls.html, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const html = await htmlRes.text();
    if (html.includes("<") && htmlRes.ok) {
      fs.writeFileSync(path.join(OUT, "travelai-home-generated.html"), html);
      console.error("[OK] wrote html", html.length);
    } else {
      console.error("[warn] html download status", htmlRes.status);
    }
  } catch (e) {
    console.error("[warn] html", e.message);
  }
}

console.error("[OK] generate complete");
