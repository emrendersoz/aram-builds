const fs = require("fs");
const path = require("path");

function convertJsonToJs() {
  console.log("JSON dosyaları JS dosyalarına dönüştürülüyor...");

  const files = ["builds.json", "skills.json", "stats.json"];

  files.forEach((file) => {
    const jsonPath = path.join(__dirname, "../data", file);

    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
      const jsContent = `const data = ${JSON.stringify(
        data,
        null,
        2
      )};\nexport default data;`;
      const jsPath = path.join(
        __dirname,
        "../data",
        file.replace(".json", ".js")
      );

      fs.writeFileSync(jsPath, jsContent);
      console.log(`✓ ${file} -> ${file.replace(".json", ".js")} dönüştürüldü`);
    } else {
      console.warn(`⚠ ${file} dosyası bulunamadı`);
    }
  });

  console.log("Dönüştürme tamamlandı!");
}

convertJsonToJs();
