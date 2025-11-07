import express from "express";
import fetch from "node-fetch";

const app = express();

// Allow CORS so the Worker can call it freely
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Main proxy route
app.get("/proxy", async (req, res) => {
  const target = req.query.url;
  if (!target) return res.status(400).send("Missing ?url parameter");

  try {
    // Pass through range header for partial content requests
    const range = req.headers.range;
    const headers = {};
    if (range) headers["Range"] = range;
    headers["User-Agent"] = req.headers["user-agent"] || "NodeProxy";
    headers["Referer"] = req.headers.referer || "";

    const response = await fetch(target, { headers });

    // Mirror status and headers
    const status = response.status;
    const respHeaders = {};
    for (const [key, value] of response.headers) {
      // Skip hop-by-hop and CSP headers
      if (
        ["content-security-policy", "x-frame-options", "transfer-encoding"].includes(
          key.toLowerCase()
        )
      )
        continue;
      respHeaders[key] = value;
    }

    // Add CORS
    respHeaders["Access-Control-Allow-Origin"] = "*";

    // Stream directly
    res.writeHead(status, respHeaders);
    response.body.pipe(res);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).send("Video proxy error: " + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🎥 Video proxy server running on port " + PORT);
});
