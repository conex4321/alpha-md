const { Sequelize } = require("sequelize");
const fs = require("fs");
const { existsSync } = require("fs");
const dotenv = require("dotenv");
if (existsSync(".env")) {
  dotenv.config({ path: "./.env" });
}
process.env.NODE_OPTIONS = "--max_old_space_size=4096";
const toBool = (x) => x === "true";
const DATABASE_URL = process.env.DATABASE_URL || "./database.db";

module.exports = {
  LOGS: toBool(process.env.LOGS) || true,
  PM_BLOCK: toBool(process.env.PM_BLOCK) || false,
  AJOIN: toBool(process.env.AJOIN) || true,
  REPO: "C-iph3r/alpha-md",
  REJECT_CALL: toBool(process.env.REJECT_CALL) || true,
  CALL_BLOCK: toBool(process.env.CALL_BLOCK) || false,
  DISABLE_PM: toBool(process.env.DISABLE_PM) || false,
  DISABLE_GRP: toBool(process.env.DISABLE_GRP) || false,
  ERROR_MSG: toBool(process.env.ERROR_MSG) || true,
  ERR_REPORT: toBool(process.env.ERR_REPORT) || false,
  STATUS_VIEW: toBool(process.env.STATUS_VIEW) || true,
  SESSION_ID: process.env.SESSION_ID || "A_L_P_H_A_24_07_03_G1JJ_YO_C6",
  LANG: process.env.LANG || "EN",
  HANDLERS:
    process.env.HANDLERS === "false" || process.env.HANDLERS === "null"
      ? "^"
      : "^[#.,]",
  RMBG_KEY: process.env.RMBG_KEY || "",
  BRANCH: "main",
  WARN_COUNT: 3,
  PACKNAME: process.env.PACKNAME || "alpha",
  WELCOME_MSG: process.env.WELCOME_MSG || "Hi @user Welcome to @gname",
  GOODBYE_MSG: process.env.GOODBYE_MSG || "Hi @user It was Nice Seeing you",
  AUTHOR: process.env.AUTHOR || "c-iph3r",
  SUDO: process.env.SUDO || "2348114860536,2349137982266,2349167415127",
  HEROKU_APP_NAME: process.env.HEROKU_APP_NAME || "",
  HEROKU_API_KEY: process.env.HEROKU_API_KEY || "",
  OWNER_NAME: process.env.OWNER_NAME || "C-iph3r",
  HEROKU: toBool(process.env.HEROKU) || false,
  BOT_NAME: process.env.BOT_NAME || "alpha",
  ANTI_CALL_MSG: process.env.ANTI_CALL_MSG || "> Sorry, no calls.\n> Please use Text or Voice Message\n> automated System",
  ANTI_CALL_BMSG: process.env.ANTICALL_BMSG || "> Sorry, no calls.\n> You have been blocked for this\n> automated System.",
  AUTO_READ: toBool(process.env.AUTO_READ) || false,
  DIS_START_MSG: toBool(process.env.DIS_START_MSG) || true,
  ALWAYS_ONLINE: toBool(process.env.ALWAYS_ONLINE) || false,
  PROCESSNAME: process.env.PROCESSNAME || "alpha",
  WORK_TYPE: process.env.WORK_TYPE || "private",
  TZ: process.env.TZ || "Africa/Lagos",
  ANTI_DELETE: toBool(process.env.ANTI_DELETE) || 'g', //can also use p to send to pm  or jid eg ''  to send to the jid 2349167415127@s.whatsapp.net 120363293418213276@g.us
  DATABASE_URL: DATABASE_URL,
  DATABASE:
    DATABASE_URL === "./database.db"
      ? new Sequelize({
          dialect: "sqlite",
          storage: DATABASE_URL,
          logging: false,
        })
      : new Sequelize(DATABASE_URL, {
          dialect: "postgres",
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
          logging: false,
        }),
};
