import "dotenv/config";
import express from "express";
import cors from "cors";
import { fetchAllRecords, SOURCES } from "./jotform.js";

const PORT = Number(process.env.PORT ?? 3001);
const API_KEY = process.env.JOTFORM_API_KEY;

if (!API_KEY) {
  console.error("Missing JOTFORM_API_KEY in environment");
  process.exit(1);
}

const app = express();
app.use(cors());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/sources", (_req, res) => {
  res.json(SOURCES.map(({ source, label }) => ({ source, label })));
});

app.get("/api/records", async (req, res) => {
  const force = req.query.refresh === "1";
  try {
    const result = await fetchAllRecords(API_KEY, force);
    if (result.errors.length) console.warn("Partial fetch errors:", result.errors);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error("Failed to fetch records:", message);
    res.status(502).json({ error: "Failed to fetch records from Jotform", detail: message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
