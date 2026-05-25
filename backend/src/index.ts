import express from "express";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    message: "Smart Farm backend (TypeScript) is running",
  });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${PORT}`);
});
