const fs = require('fs-extra');
const path = require('path');
const packageJson = require('./package.json');
if (fs.existsSync('.env')) {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
}

global.__basedir = __dirname;
global.owner = process.env.OWNER_NUMBER || ''; // Owner number
global.mongodb = process.env.MONGODB_URL || ''; // MongoDB URL
global.port = process.env.PORT || 5001; // Port
global.sudo = process.env.SUDO || ''; // Sudo number
global.website = ''; // Website URL
global.log0 = process.env.THUMB_IMAGE || 'https://graph.org/file/81fa99ef8cef33df050ab.jpg'; // Bot image

module.exports = {
  SESSION_ID: process.env.SESSION_ID || '', // Paste your session_id here
  TZ: process.env.TZ || 'Africa/Lagos', // Time zone (leave as is if unsure)
  WARN_COUNT: process.env.WARN_COUNT || 3,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || false, // Get one from https://aistudio.google.com/app/apikey
  botname: process.env.BOT_NAME || 'alpha-md',
  ownername: process.env.OWNER_NAME || 'c-iph3r',
  author: process.env.PACK_INFO ? process.env.PACK_INFO.split(';')[0] : 'c-iph3r',
  packname: process.env.PACK_INFO ? process.env.PACK_INFO.split(';')[1] : 'alpha-md',
  HANDLERS: process.env.PREFIX || '[.,]', // Use [] for multi-prefix
  VERSION: packageJson.version || 'v.2.0.0',
};

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(`Updated '${__filename}'`);
  delete require.cache[file];
  require(file);
});
