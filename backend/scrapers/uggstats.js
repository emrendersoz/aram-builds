// scrapers/uggstats.js
const puppeteer = require("puppeteer");

async function scrapeUggStats(championName) {
  const url = `https://u.gg/lol/champions/aram/${championName.toLowerCase()}-aram`;

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // User agent ekle (bot detection'ı önlemek için)
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  );

  try {
    console.log(`Stats için sayfa açılıyor: ${url}`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    // Sayfanın tamamen yüklenmesi için bekle
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const statsData = await page.evaluate(() => {
      const results = {};
      try {
        const pageText = document.body.textContent;

        // Tier bilgisi
        const tierMatch = pageText.match(/([SABCD][+\-]?)\s*Tier/);
        if (tierMatch) results.tier = tierMatch[1];

        // Win Rate bilgisi
        const winRateMatch = pageText.match(/(\d+\.\d+%)\s*Win Rate/);
        if (winRateMatch) results.winRate = winRateMatch[1];

        // Rank bilgisi
        const rankMatch = pageText.match(/(\d+\s*\/\s*\d+)\s*Rank/);
        if (rankMatch) results.rank = rankMatch[1].replace(/\s/g, "");

        // Pick Rate bilgisi
        const pickRateMatch = pageText.match(/(\d+\.\d+%)\s*Pick Rate/);
        if (pickRateMatch) results.pickRate = pickRateMatch[1];

        // Ban Rate bilgisi
        const banRateMatch = pageText.match(/(-|\d+\.\d+%)\s*Ban Rate/);
        if (banRateMatch) results.banRate = banRateMatch[1];

        // Matches bilgisi
        const matchesMatch = pageText.match(/([\d,]+)\s*Matches/);
        if (matchesMatch) results.matches = matchesMatch[1];
      } catch (error) {
        console.error("Stats parse error:", error);
      }
      return results;
    });

    console.log(`${championName} stats başarıyla alındı:`, statsData);

    return {
      site: "U.GG",
      champion: championName,
      ...statsData,
    };
  } catch (err) {
    console.error("Stats scraping hatası:", err.message);
    throw err;
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeUggStats };
