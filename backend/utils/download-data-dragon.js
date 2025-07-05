const https = require("https");
const fs = require("fs-extra");
const path = require("path");

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          downloadFile(response.headers.location, dest)
            .then(resolve)
            .catch(reject);
          return;
        }
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
          return;
        }
        const file = fs.createWriteStream(dest);
        response.pipe(file);
        file.on("finish", () => file.close(resolve));
      })
      .on("error", (err) => {
        fs.unlink(dest, () => reject(err));
      });
  });
}

async function run() {
  console.log("Fetching latest game version...");
  const versionsResponse = await fetch(
    "https://ddragon.leagueoflegends.com/api/versions.json"
  );
  const versions = await versionsResponse.json();
  const latestVersion = versions[0];
  console.log(`Latest version is: ${latestVersion}`);

  const dataDir = path.join(__dirname, "../data");
  await fs.ensureDir(dataDir);

  const filesToDownload = {
    "champion.json": `/cdn/${latestVersion}/data/en_US/champion.json`,
    "item.json": `/cdn/${latestVersion}/data/en_US/item.json`,
    "runesReforged.json": `/cdn/${latestVersion}/data/en_US/runesReforged.json`,
    "summoner.json": `/cdn/${latestVersion}/data/en_US/summoner.json`,
  };

  for (const [fileName, filePath] of Object.entries(filesToDownload)) {
    const url = `https://ddragon.leagueoflegends.com${filePath}`;
    const dest = path.join(dataDir, fileName);
    console.log(`Downloading ${fileName}...`);
    await downloadFile(url, dest);
  }

  console.log("All static data downloaded successfully!");
}

run().catch(console.error);
