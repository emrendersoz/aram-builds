const express = require("express");
const cron = require("node-cron");
const path = require("path");
const cors = require("cors");
const fs = require("fs"); // YENİ: fs modülünü import et
const { runAllScrapers } = require("./scrape-all");

const app = express();
const PORT = 3001;

// Frontend'in (farklı portta çalışacak) istek atabilmesi için CORS'u etkinleştiriyoruz.
app.use(cors());

// Statik JSON dosyamızı sunacak olan API endpoint'ini oluşturuyoruz.
const buildsPath = path.join(__dirname, "data", "builds.json");

// '/api/builds' yoluna bir GET isteği geldiğinde, builds.json dosyasını gönder.
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

// DÜZELTİLDİ: Stats API endpoint'i
app.get("/api/stats", (req, res) => {
  const filePath = path.join(__dirname, "data", "stats.json");

  // Dosyanın var olup olmadığını kontrol et
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      message:
        "Stats dosyası henüz oluşturulmadı. Lütfen ilk scrape işleminin tamamlanmasını bekleyin.",
    });
  }

  // Dosyayı oku ve JSON olarak gönder
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

// Sunucu ilk defa başlatıldığında, hemen bir scrape işlemi yap.
console.log(
  "Sunucu başlangıcında ilk scrape işlemi çalıştırılıyor...(çalıştırılmıyor çünkü yorum satırına alındı)"
);
// runAllScrapers();

// Her 4 saatte bir scrape işlemini tekrarla.
cron.schedule("0 */4 * * *", () => {
  console.log("-------------------------------------");
  console.log("Zamanlanmış 4 saatlik scrape işlemi başlatılıyor...");
  runAllScrapers();
});

// Sunucuyu belirtilen portta dinlemeye başla.
app.listen(PORT, () => {
  console.log(`Backend sunucusu http://localhost:${PORT} adresinde çalışıyor.`);
  console.log(
    `Build verilerine http://localhost:${PORT}/api/builds adresinden ulaşılabilir.`
  );
  console.log(
    `Stats verilerine http://localhost:${PORT}/api/stats adresinden ulaşılabilir.`
  );
});
