const plugins = require("../lib/plugins");
const { alpha, isPrivate, errorHandler, secondsToDHMS } = require("../lib");
const { OWNER_NAME, BOT_NAME, TZ } = require("../config");
const os = require("os");
const packageJson = require("../package.json");
const { listall } = require("../lib/fancy");
function styleText(text) {
  return listall(text)[0];
}

alpha(
  {
    pattern: "menu",
    fromMe: isPrivate,
    desc: "Show All Commands",
    type: "info",
  },
  async (message, match) => {
    try {
      if (match) {
        for (let i of plugins.commands) {
          if (
            i.pattern instanceof RegExp &&
            i.pattern.test(message.prefix + match)
          ) {
            const cmdName = i.pattern.toString().split(/\W+/)[1];
            await message.reply(`\`\`\`Command: ${message.prefix}${cmdName.trim()}
Description: ${i.desc}\`\`\``);
            return;
          }
        }
      } else {
        let { prefix } = message;
        let [date, time] = new Date()
          .toLocaleString("en-IN", { timeZone: TZ })
          .split(",");
        let menu = `╭━〔 *${styleText(BOT_NAME, 1)}* 〕━◉
┃╭━━━━━━━━━━━━━━◉
┃┃ *Plugins :-* ${plugins.commands.length.toString()}
┃┃ *User :-* ${message.pushName}
┃┃ *Version:-* ${packageJson.version} 
┃┃ *Prefix:-* ${prefix}
┃┃ *Mode :-* ${isPrivate ? "private" : "public"}
┃┃ *Date :-* ${date.trim()}
┃┃ *Time :-* ${time.trim()}
┃┃ *Uptime :-* ${secondsToDHMS(process.uptime())}
┃┃ *Ram :-* ${Math.round((os.totalmem() - os.freemem()) / 1024 / 1024)}MB
┃╰━━━━━━━━━━━━━◉`;

        let cmnd = [];
        let cmd;
        let category = [];
        plugins.commands.forEach((command) => {
          if (command.pattern instanceof RegExp) {
            cmd = command.pattern.toString().split(/\W+/)[1];
          }

          if (!command.dontAddCommandList && cmd !== undefined) {
            let type = command.type ? command.type.toLowerCase() : "misc";
            cmnd.push({ cmd, type });
            if (!category.includes(type)) category.push(type);
          }
        });

        category.sort().forEach((cmmd) => {
          menu += `
┠┌─⭓『 *${styleText(cmmd.toLowerCase(), 1)}* 』`;
          let comad = cmnd.filter(({ type }) => type == cmmd);
          comad.forEach(({ cmd }) => {
            menu += `\n┃│◦ _${styleText(cmd.trim(), 1)}_`;
          });
          menu += `\n┃└──────────⭓`;
        });

        menu += `
╰━━━━━━━━━━━━━◉`;

        await message.reply(menu);
      }
    } catch (error) {
      errorHandler(message, error);
    }
  }
);

alpha(
  {
    pattern: "list",
    fromMe: isPrivate,
    desc: "Show All Commands",
    type: "info",
  },
  async (message, match) => {
    try {
      let menu = "\t\t```Command List```\n";

      let cmnd = [];
      let cmd, desc;
      plugins.commands.forEach((command) => {
        if (command.pattern) {
          cmd = command.pattern.toString().split(/\W+/)[1];
        }
        desc = command.desc || false;

        if (!command.dontAddCommandList && cmd !== undefined) {
          cmnd.push({ cmd, desc });
        }
      });
      cmnd.sort();
      cmnd.forEach(({ cmd, desc }, num) => {
        menu += `\`\`\`${num + 1} ${cmd.trim()}\`\`\`\n`;
        if (desc) menu += `Use: \`\`\`${desc}\`\`\`\n\n`;
      });
      await message.reply(menu);
    } catch (error) {
      errorHandler(message, error);
    }
  }
);

alpha(
  {
    pattern: "ping",
    fromMe: isPrivate,
    desc: "To check ping",
    type: "info",
  },
  async (message, match) => {
    try {
      const start = Date.now();
      const msg = await message.sendMessage(message.jid, "*Pong!*");
      const end = Date.now();
      const latency = end - start;
      await message.client.sendMessage(message.jid, {
        text: "```" + latency + "``` *ms*",
        edit: msg.key
      });
    } catch (error) {
      errorHandler(message, error);
    }
  }
);

alpha(
  {
    pattern: "uptime",
    fromMe: true,
    desc: "Check uptime of bot",
    type: "user",
  },
  async (message) => {
    try {
      message.reply(`*Uptime:* ${secondsToDHMS(process.uptime())}`);
    } catch (error) {
      errorHandler(message, error);
    }
  },
);