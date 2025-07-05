const express = require("express");
const cron = require("node-cron");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const { runAllScrapers } = require("./scrape-all");

const app = express();
const PORT = 3001;

app.use(cors());

const buildsPath = path.join(__dirname, "data", "builds.json");

app.get("/api/builds", (req, res) => {
  if (require("fs").existsSync(buildsPath)) {
    res.sendFile(buildsPath);
  } else {
    res.status(404).json({
      message:
        "Builds dosyası henüz oluşturulmadı. Lütfen ilk scrape işleminin tamamlanmasını bekleyin.",
    });
  }
});

app.get("/api/skills", (req, res) => {
  const filePath = path.join(__dirname, "data", "skills.json");

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("skills.json dosyası okunurken hata:", err);
      return res.status(500).send("Sunucuda bir hata oluştu.");
    }
    res.json(JSON.parse(data));
  });
});

app.get("/api/stats", (req, res) => {
  const filePath = path.join(__dirname, "data", "stats.json");

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      message:
        "Stats dosyası henüz oluşturulmadı. Lütfen ilk scrape işleminin tamamlanmasını bekleyin.",
    });
  }

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("stats.json dosyası okunurken hata:", err);
      return res.status(500).json({
        message: "Sunucuda bir hata oluştu.",
        error: err.message,
      });
    }

    try {
      const parsedData = JSON.parse(data);
      res.json(parsedData);
    } catch (parseErr) {
      console.error("JSON parse hatası:", parseErr);
      return res.status(500).json({
        message: "Stats verisi parse edilemedi.",
        error: parseErr.message,
      });
    }
  });
});

console.log(
  "Sunucu başlangıcında ilk scrape işlemi çalıştırılıyor...(çalıştırılmıyor çünkü yorum satırına alındı)"
);

cron.schedule("0 */4 * * *", () => {
  console.log("-------------------------------------");
  console.log("Zamanlanmış 4 saatlik scrape işlemi başlatılıyor...");
  runAllScrapers();
});

app.listen(PORT, () => {
  console.log(`Backend sunucusu http://localhost:${PORT} adresinde çalışıyor.`);
  console.log(
    `Build verilerine http://localhost:${PORT}/api/builds adresinden ulaşılabilir.`
  );
  console.log(
    `Stats verilerine http://localhost:${PORT}/api/stats adresinden ulaşılabilir.`
  );
});
