// Vercel Serverless Function – SSR adapter for TanStack Start
// Bridges the compiled Cloudflare-style fetch handler to the Node.js
// HTTP interface that Vercel's serverless runtime expects.
// No extra dependencies — pure Node.js built-ins only.

// ─── Lazy-load the SSR bundle ────────────────────────────────────────────────
let _handler = null;

async function getHandler() {
  if (_handler) return _handler;

  // The TanStack Start build outputs to dist/server/server.js (relative to project root)
  // In Vercel's runtime __dirname is /var/task (the project root is deployed there)
  const serverPath = new URL("../dist/server/server.js", import.meta.url);
  const serverModule = await import(serverPath.href);
  const serverExport = serverModule.default ?? serverModule;

  // server.js exports { default: { fetch(request, env, ctx): Promise<Response> } }
  if (typeof serverExport?.fetch === "function") {
    _handler = (req) => serverExport.fetch(req, {}, {});
  } else if (typeof serverExport === "function") {
    _handler = serverExport;
  } else {
    throw new Error("SSR bundle does not export a recognisable fetch handler");
  }

  return _handler;
}

// ─── Convert Node IncomingMessage → Web Request ──────────────────────────────
async function toWebRequest(req) {
  const proto = req.headers["x-forwarded-proto"] ?? "https";
  const host =
    req.headers["x-forwarded-host"] ??
    req.headers["host"] ??
    "localhost";
  const url = new URL(req.url, `${proto}://${host}`);

  const headers = new Headers();
  for (const [key, val] of Object.entries(req.headers)) {
    if (val == null) continue;
    const values = Array.isArray(val) ? val : [val];
    values.forEach((v) => headers.append(key, v));
  }

  let body = undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    if (chunks.length) body = Buffer.concat(chunks);
  }

  return new Request(url.toString(), {
    method: req.method,
    headers,
    body,
    ...(body ? { duplex: "half" } : {}),
  });
}

// ─── Pipe Web Response → Node ServerResponse ─────────────────────────────────
async function pipeWebResponse(webRes, res) {
  res.statusCode = webRes.status;
  webRes.headers.forEach((val, key) => res.setHeader(key, val));

  if (!webRes.body) {
    res.end();
    return;
  }

  const reader = webRes.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      await new Promise((resolve, reject) => {
        res.write(value, (err) => (err ? reject(err) : resolve()));
      });
    }
  } finally {
    reader.releaseLock();
  }
  res.end();
}

// ─── Vercel Serverless Entry Point ───────────────────────────────────────────
export default async function handler(req, res) {
  try {
    const fetchHandler = await getHandler();
    const webRequest = await toWebRequest(req);
    const webResponse = await fetchHandler(webRequest);
    await pipeWebResponse(webResponse, res);
  } catch (err) {
    console.error("[vercel-ssr-adapter] Unhandled error:", err);
    res.statusCode = 500;
    res.setHeader("content-type", "text/html; charset=utf-8");
    res.end(`<!doctype html><html><body>
      <h1>Internal Server Error</h1>
      <p>The server encountered an unexpected condition. Please try again.</p>
    </body></html>`);
  }
}
