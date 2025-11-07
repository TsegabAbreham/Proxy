// server.js
import express from "express";
import fetch from "node-fetch";

const app = express();

app.get("/proxy", async (req, res) => {
  const target = req.query.url;
  if (!target) return res.status(400).send("Missing ?url=");

  try {
    // Forward headers like Range for video seeking
    const headers = {};
    if (req.headers.range) headers["Range"] = req.headers.range;

    const response = await fetch(target, { headers });

    // Set same headers so browser can stream video
    res.status(response.status);
    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value);
    }

    // Stream the body directly
    response.body.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send("Proxy error: " + err.message);
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Proxy running on port " + PORT));
