// scrapers/uggskills.js
const puppeteer = require("puppeteer");

async function scrapeUggSkills(championName) {
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
    console.log(`Skills için sayfa açılıyor: ${url}`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    // Sayfanın tamamen yüklenmesi için bekle
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const skillsData = await page.evaluate((championName) => {
      const results = {
        champion: championName,
        "1stSkill": "",
        "2ndSkill": "",
        "3rdSkill": "",
      };

      try {
        // Skill Priority bölümünü bul
        const skillPrioritySection = document.querySelector(
          ".content-section_content.skill-priority"
        );

        if (!skillPrioritySection) {
          console.log("Skill priority section bulunamadı");
          return results;
        }

        // Skill priority path içindeki skill labelları al
        const skillLabels = skillPrioritySection.querySelectorAll(
          ".skill-label.bottom-center"
        );

        if (skillLabels.length >= 3) {
          results["1stSkill"] = skillLabels[0].textContent.trim();
          results["2ndSkill"] = skillLabels[1].textContent.trim();
          results["3rdSkill"] = skillLabels[2].textContent.trim();
        } else {
          console.log(
            `Yeterli skill bulunamadı. Bulunan: ${skillLabels.length}`
          );
        }

        console.log("Skill priority başarıyla alındı:", {
          "1stSkill": results["1stSkill"],
          "2ndSkill": results["2ndSkill"],
          "3rdSkill": results["3rdSkill"],
        });
      } catch (error) {
        console.error("Skills parse error:", error);
      }

      return results;
    }, championName);

    console.log(`${championName} skills başarıyla alındı:`, skillsData);

    return skillsData;
  } catch (err) {
    console.error("Skills scraping hatası:", err.message);
    throw err;
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeUggSkills };
