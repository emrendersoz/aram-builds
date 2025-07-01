const express = require("express");
const cron = require("node-cron");
const path = require("path");
const cors = require("cors");
const { runAllScrapers } = require("./scrape-all");

const app = express();
const PORT = 3001;

// Frontend'in (farklı portta çalışacak) istek atabilmesi için CORS'u etkinleştiriyoruz.
// Bu olmazsa tarayıcı güvenlik nedeniyle isteği engeller.
app.use(cors());

// Statik JSON dosyamızı sunacak olan API endpoint'ini oluşturuyoruz.
// Frontend bu adrese istek atarak build verilerine ulaşacak.
const buildsPath = path.join(__dirname, "data", "builds.json");

// '/api/builds' yoluna bir GET isteği geldiğinde, builds.json dosyasını gönder.
app.get("/api/builds", (req, res) => {
  // Dosyanın var olup olmadığını kontrol edelim.
  if (require("fs").existsSync(buildsPath)) {
    res.sendFile(buildsPath);
  } else {
    // Eğer scrape henüz yapılmadıysa ve dosya yoksa, boş bir obje döndürelim.
    res.status(404).json({
      message:
        "Builds dosyası henüz oluşturulmadı. Lütfen ilk scrape işleminin tamamlanmasını bekleyin.",
    });
  }
});

// Sunucu ilk defa başlatıldığında, hemen bir scrape işlemi yap.
// Bu, sunucu yeniden başlasa bile verilerin güncel olmasını sağlar.
console.log(
  "Sunucu başlangıcında ilk scrape işlemi çalıştırılıyor...(çalıştırılmıyor çünkü yorum satırına alındı)"
);
// runAllScrapers();

// Her 4 saatte bir scrape işlemini tekrarla.
// Cron formatı: 'dakika saat gün ay hafta_günü'
// '0 */4 * * *' -> "Her 4 saatin 0. dakikasında" demektir.
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
});
