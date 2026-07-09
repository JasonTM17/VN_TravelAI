#!/usr/bin/env node
/**
 * Minimal Stitch MCP HTTP client using X-Goog-Api-Key.
 * Usage:
 *   node stitch-mcp-client.mjs list
 *   node stitch-mcp-client.mjs generate --project <id> --device DESKTOP --out <dir> --prompt "..."
 *   node stitch-mcp-client.mjs generate --project <id> --prompt-file prompt.txt
 *   node stitch-mcp-client.mjs screens --project <id>
 *   node stitch-mcp-client.mjs get --project <id> --screen <id>
 */
import fs from "node:fs";
import path from "node:path";

const API = "https://stitch.googleapis.com/mcp";
const key = process.env.STITCH_API_KEY || process.env.GOOGLE_API_KEY;
if (!key) {
  console.error("[X] Set STITCH_API_KEY or GOOGLE_API_KEY");
  process.exit(1);
}

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  return process.argv[i + 1];
}

async function mcp(method, params = {}, id = 1) {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "X-Goog-Api-Key": key,
    },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response ${res.status}: ${text.slice(0, 400)}`);
  }
  if (json.error) {
    throw new Error(JSON.stringify(json.error));
  }
  return json.result;
}

async function callTool(name, args) {
  console.error(`[i] tools/call ${name}`);
  return mcp("tools/call", { name, arguments: args });
}

function extractTextPayload(result) {
  // MCP tool results usually { content: [{ type:'text', text:'...' }] }
  if (!result) return result;
  if (typeof result === "string") return result;
  if (Array.isArray(result.content)) {
    return result.content
      .map((c) => (c.type === "text" ? c.text : JSON.stringify(c)))
      .join("\n");
  }
  return result;
}

async function main() {
  const cmd = process.argv[2] || "list";
  const outDir = arg("out", path.resolve(".stitch/designs"));
  fs.mkdirSync(outDir, { recursive: true });

  if (cmd === "list") {
    const tools = await mcp("tools/list", {});
    console.log(JSON.stringify(tools, null, 2));
    return;
  }

  if (cmd === "projects") {
    const r = await callTool("list_projects", {});
    const text = extractTextPayload(r);
    fs.writeFileSync(path.join(outDir, "projects.json"), typeof text === "string" ? text : JSON.stringify(text, null, 2));
    console.log(typeof text === "string" ? text : JSON.stringify(text, null, 2));
    return;
  }

  if (cmd === "create-project") {
    const title = arg("title", "VN_TravelAI");
    const r = await callTool("create_project", { title });
    const text = extractTextPayload(r);
    fs.writeFileSync(path.join(outDir, "create_project.json"), typeof text === "string" ? text : JSON.stringify(text, null, 2));
    console.log(typeof text === "string" ? text : JSON.stringify(text, null, 2));
    return;
  }

  if (cmd === "screens") {
    const projectId = arg("project");
    if (!projectId) throw new Error("--project required");
    const r = await callTool("list_screens", { projectId });
    const text = extractTextPayload(r);
    fs.writeFileSync(path.join(outDir, "screens.json"), typeof text === "string" ? text : JSON.stringify(text, null, 2));
    console.log(typeof text === "string" ? text : JSON.stringify(text, null, 2));
    return;
  }

  if (cmd === "get") {
    const projectId = arg("project");
    const screenId = arg("screen");
    if (!projectId || !screenId) throw new Error("--project and --screen required");
    const r = await callTool("get_screen", {
      projectId,
      screenId,
      name: `projects/${projectId}/screens/${screenId}`,
    });
    const text = extractTextPayload(r);
    const raw = typeof text === "string" ? text : JSON.stringify(text, null, 2);
    fs.writeFileSync(path.join(outDir, `screen-${screenId}.json`), raw);
    // try download image/html urls if present
    try {
      const parsed = typeof text === "string" ? JSON.parse(text) : text;
      const htmlUrl = parsed?.htmlCode?.downloadUrl || parsed?.htmlUrl || parsed?.html;
      const imgUrl = parsed?.screenshot?.downloadUrl || parsed?.imageUrl || parsed?.screenshotUrl;
      if (htmlUrl && typeof htmlUrl === "string" && htmlUrl.startsWith("http")) {
        const html = await (await fetch(htmlUrl)).text();
        fs.writeFileSync(path.join(outDir, `screen-${screenId}.html`), html);
        console.error("[OK] wrote html");
      }
      if (imgUrl && typeof imgUrl === "string" && imgUrl.startsWith("http")) {
        const buf = Buffer.from(await (await fetch(imgUrl)).arrayBuffer());
        fs.writeFileSync(path.join(outDir, `screen-${screenId}.png`), buf);
        console.error("[OK] wrote png");
      }
    } catch {
      /* ignore download parse issues */
    }
    console.log(raw.slice(0, 3000));
    return;
  }

  if (cmd === "generate") {
    const projectId = arg("project");
    if (!projectId) throw new Error("--project required");
    const deviceType = (arg("device", "DESKTOP") || "DESKTOP").toUpperCase();
    let prompt = arg("prompt");
    const promptFile = arg("prompt-file");
    if (promptFile) prompt = fs.readFileSync(promptFile, "utf8");
    if (!prompt) throw new Error("--prompt or --prompt-file required");

    const r = await callTool("generate_screen_from_text", {
      projectId,
      prompt,
      deviceType,
    });
    const text = extractTextPayload(r);
    const raw = typeof text === "string" ? text : JSON.stringify(text, null, 2);
    fs.writeFileSync(path.join(outDir, "generate_result.json"), raw);
    console.log(raw.slice(0, 5000));
    return;
  }

  throw new Error(`Unknown command: ${cmd}`);
}

main().catch((e) => {
  console.error("[X]", e.message || e);
  process.exit(1);
});
