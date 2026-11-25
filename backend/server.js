require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { requireEnv } = require("./utils/env");
const { errorHandler, notFound } = require("./middleware/errorHandler");

requireEnv(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);

const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map(v => v.trim())
    : false,
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false
}));

app.get("/api/health", (_req, res) => {
  res.json({ success: true, service: "TOPZY API", status: "running" });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/wallet", require("./routes/wallet"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/suppliers", require("./routes/suppliers"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/admin", require("./routes/admin"));

app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT) || 5000;
app.listen(port, () => console.log(`TOPZY API listening on port ${port}`));
