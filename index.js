const path = require("path");
const config = require("./config");
const bot = require("./lib/bot");
const fs = require('fs').promises;
const fetchSession = require("./lib/session");

global.__basedir = __dirname;

async function startBot() {
  console.log("🤖 Initializing..");
  try {
    console.log("Syncing Database 💾");
    await config.DATABASE.sync();
    const sessionPath = path.join(__dirname, "session");
    try {
      await fs.rm(sessionPath, { recursive: true, force: true });
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
    await fs.mkdir(sessionPath);
    await fetchSession(config.SESSION_ID);
    return await bot();
  } catch (error) {
    console.error("Initialization error:", error);
    process.exit(1); // Exit with error status
  }
}

startBot();