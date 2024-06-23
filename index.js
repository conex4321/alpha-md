const fs = require("fs").promises;
const path = require("path");
const config = require("./config");
const bot = require("./lib/bot");
const { reqextplugins } = require("./lib/database/plugins");
const fetchSession = require("./lib/session");

global.__basedir = __dirname;

const reqplugins = async (directory) => {
  try {
    const files = await fs.readdir(directory);
    return Promise.all(
      files
        .filter((file) => path.extname(file).toLowerCase() === ".js")
        .map((file) => require(path.join(directory, file)))
    );
  } catch (error) {
    console.error("Error reading and requiring files:", error);
    throw error;
  }
};

async function startBot() {
  console.log("🤖 Initializing..");
  try {
    await reqplugins(path.join(__dirname, "lib", "database"));
    console.log("Syncing Database 💾");
    await config.DATABASE.sync();
    console.log("⬇️ Installing Plugins...");
    await reqplugins(path.join(__dirname, "plugins"));
    await reqextplugins();
    console.log("✅ Plugins Installed!");
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