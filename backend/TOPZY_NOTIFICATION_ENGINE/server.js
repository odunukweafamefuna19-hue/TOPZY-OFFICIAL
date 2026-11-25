import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config.js";
import notificationRoutes from "./routes/notificationRoutes.js";

const app = express();
app.use(helmet());
app.use(cors({
  origin: config.frontendOrigin === "*" ? true : config.frontendOrigin.split(",").map(v => v.trim())
}));
app.use(express.json({ limit: "100kb" }));
app.get("/health", (_req, res) => res.json({ ok: true, service: "TOPZY_NOTIFICATION_ENGINE" }));
app.use("/api", notificationRoutes);
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Unexpected server error." });
});
app.listen(config.port, () => console.log(`TOPZY_NOTIFICATION_ENGINE listening on ${config.port}`));
