// scrapers/metasrc.js
const puppeteer = require("puppeteer");

async function scrapeMetasrc(championName) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  const formattedName = championName.toLowerCase().replace(/[^a-z]/g, "");
  const url = `https://www.metasrc.com/lol/aram/build/${formattedName}`;
  console.log(`Scraping için sayfaya gidiliyor: ${url}`);

  try {
    await page.goto(url, { waitUntil: "networkidle2" });
    await page.waitForSelector("p._bmor60", { timeout: 15000 });

    const buildData = await page.evaluate(() => {
      const summaryElement = document.querySelector("p._bmor60");
      if (!summaryElement) return null;

      const site = "MetaSRC";

      // --- DEĞİŞİKLİK 1: Rün veri yapısı güncellendi ---
      // Düz bir array yerine, ugg.js ile aynı formatta bir obje oluşturuluyor.
      const runes = {
        primary: [],
        secondary: [],
        keystone: [],
      };
      // --- BİTİŞ ---

      const spells = [];
      const startingItems = [];
      const coreItems = [];

      // Metin bazlı arama için tüm metni ve HTML'i alalım
      const fullText = summaryElement.innerText;
      const fullHTML = summaryElement.innerHTML;

      // Item'ları ayırmak için eski mantığımız devam ediyor
      const parts = fullText.split("Starting items should include");
      const coreItemsText = parts[0];
      const startingItemsText = parts.length > 1 ? parts[1] : "";

      // --- DEĞİŞİKLİK 2: Rünleri doğru kategoriye ekleme ---
      const runeSpans = Array.from(
        summaryElement.querySelectorAll('span[data-tooltip^="perk-"]')
      );

      // 1. Ana Yolu (Primary Path) bul ve doğru yere ekle
      const primaryPathSpan = runeSpans.find(
        (span) =>
          span.nextSibling && span.nextSibling.textContent.includes("(Primary)")
      );
      if (primaryPathSpan) {
        const primaryId = primaryPathSpan
          .getAttribute("data-tooltip")
          .split("-")[1];
        runes.primary.push(primaryId);
      }

      // 2. Anahtar Taşı'nı (Keystone) bul ve doğru yere ekle
      const keystoneSpan = runeSpans.find(
        (span) =>
          span.nextSibling &&
          span.nextSibling.textContent.includes("(Keystone)")
      );
      if (keystoneSpan) {
        const keystoneId = keystoneSpan
          .getAttribute("data-tooltip")
          .split("-")[1];
        runes.keystone.push(keystoneId);
      }

      // 3. İkincil Yolu (Secondary Path) bul ve doğru yere ekle
      const secondaryPathSpan = runeSpans.find(
        (span) =>
          span.nextSibling &&
          span.nextSibling.textContent.includes("(Secondary)")
      );
      if (secondaryPathSpan) {
        const secondaryId = secondaryPathSpan
          .getAttribute("data-tooltip")
          .split("-")[1];
        runes.secondary.push(secondaryId);
      }
      // --- BİTİŞ ---

      // Item ve Büyüleri ID'lerine göre bulmaya devam et (bu kısım aynı kalıyor)
      const elementsWithTooltip =
        summaryElement.querySelectorAll("span[data-tooltip]");
      elementsWithTooltip.forEach((span) => {
        const tooltip = span.getAttribute("data-tooltip");
        const tooltipParts = tooltip.split("-");
        if (tooltipParts[0] === "x" && tooltipParts[1] === "item") {
          const itemId = tooltipParts[2];
          // Item'ın hangi bölümde geçtiğini kontrol ederek ayırıyoruz
          if (startingItemsText.includes(span.innerText))
            startingItems.push(itemId);
          else if (coreItemsText.includes(span.innerText))
            coreItems.push(itemId);
        } else if (tooltipParts[0] === "spell") {
          // MetaSRC bazen aynı spell'i birden fazla kez listeyebiliyor,
          // bu yüzden eklemeden önce kontrol edelim.
          const spellId = tooltipParts[1];
          if (!spells.includes(spellId)) {
            spells.push(spellId);
          }
        }
      });

      // item4, item5, item6 olmadığı için boş dizilerle doldur
      const item4Options = [];
      const item5Options = [];
      const item6Options = [];

      return {
        site,
        runes,
        spells,
        startingItems,
        coreItems,
        item4Options,
        item5Options,
        item6Options,
      };
    });

    await browser.close();

    if (buildData) {
      console.log(`${championName} için MetaSRC verileri başarıyla çekildi.`);
    }

    return buildData;
  } catch (error) {
    console.error(
      `${championName} için MetaSRC'den veri çekilirken hata:`,
      error.message
    );
    await browser.close();
    // Hata durumunda da tutarlı bir yapı döndürmek için boş alanlar ekleyelim
    return {
      site: "MetaSRC",
      error: `Veri çekilemedi: ${error.message}`,
      runes: { primary: [], secondary: [], keystone: [] },
      spells: [],
      startingItems: [],
      coreItems: [],
      item4Options: [],
      item5Options: [],
      item6Options: [],
    };
  }
}

module.exports = { scrapeMetasrc };
