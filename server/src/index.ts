import "dotenv/config";
import express from "express";
import cors from "cors";
import { fetchAllRecords, SOURCES } from "./jotform.js";

const PORT = Number(process.env.PORT ?? 3001);

// Challenge keys are already public in CLAUDE.md, so we ship them as defaults
// to keep setup friction-free. Override via server/.env if you have your own.
const DEFAULT_KEYS = [
  "ad39735f1449a6dc28d60e0921352665",
  "54a934fa20b1ccc3a5bd1d2076f90556",
  "5593acd695caab1a3805c3af8532df09",
].join(",");
const API_KEY = process.env.JOTFORM_API_KEY || DEFAULT_KEYS;

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
