const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const artistRoutes = require("./routes/artistRoutes");
const songRoutes = require("./routes/songRoutes");
const albumRoutes = require("./routes/albumRoutes");
const adminRoutes = require("./routes/adminRoutes");
const playlistRoutes = require("./routes/playlistRoutes");
const historyRoutes = require("./routes/historyRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const artistDashboardRoutes = require("./routes/artistDashboardRoutes");
const commentRoutes = require("./routes/commentRoutes");
const artistSearchRoutes = require("./routes/artistSearchRoutes");
const homeRoutes = require("./routes/homeRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const coffeeRoutes = require("./routes/coffeeRoutes");
const fanClubRoutes = require("./routes/fanClubRoutes");
const premiumRoutes = require("./routes/premiumRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
const uploadTestRoutes = require("./routes/uploadTestRoutes");

const { helmet, limiter } = require("./middleware/securityMiddleware");

const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(limiter);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Tantha Music API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/artists", artistRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/albums", albumRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/artists/dashboard", artistDashboardRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/artists", artistSearchRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/coffee", coffeeRoutes);
app.use("/api/fanclub", fanClubRoutes);
app.use("/api/premium", premiumRoutes);
app.use("/api/admin", adminDashboardRoutes);
app.use("/api/upload-test", uploadTestRoutes);


app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

module.exports = app;