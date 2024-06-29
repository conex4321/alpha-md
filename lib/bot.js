const pino = require("pino");
const { groupDB } = require("./database/group");
const { PluginDB } = require("./database/plugins");
const { Boom } = require("@hapi/boom");
const { sleep } = require("./index");
const axios = require("axios");
const fs = require("fs/promises");
const path = require("path");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  jidNormalizedUser,
  Browsers,
  proto,
  delay,
  makeCacheableSignalKeyStore,
  DisconnectReason,
} = require("baileys");
const { PausedChats } = require("./database");
const config = require("../config");
const plugins = require("./plugins");
const { serialize, Greetings } = require("./index");
const { Image, Message, Sticker, Video, AllMessage } = require("./Messages");
const { loadMessage, saveMessage, saveChat, getName, } = require("./database/Store");
const { extractUrlsFromString } = require("./index");
const logger = pino({ level: "silent" });

const bot = async () => {
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

  function insertSudo() {
    if (config.SUDO == "null" || config.SUDO == "false" || !config.SUDO)
      return [];
    config.SUDO = config.SUDO.replaceAll(" ", "");
    return config.SUDO.split(/[;,|]/) || [config.SUDO];
  }
  
  const Alpha = async () => {
    try {
      const { state, saveCreds } = await useMultiFileAuthState(
        path.join(__basedir, "session")
      );
      const { version } = await fetchLatestBaileysVersion();
      const {
        data: { version: lavss },
      } = await axios(
        `https://raw.githubusercontent.com/${config.REPO}/main/package.json`
      );
      let conn = makeWASocket({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        printQRInTerminal: true,
        logger: logger,
        browser: ["Chrome", "Ubuntu", "3.0"],
        downloadHistory: false,
        syncFullHistory: false,
        markOnlineOnConnect: false,
        emitOwnEvents: true,
        version,
        getMessage: async (key) => {
          return (loadMessage(key.id) || {}).message || { conversation: null };
        },
      });

      conn.ev.on("connection.update", async (s) => {
        const { connection, lastDisconnect } = s;
        if (connection === "connecting") {
          console.log("ℹ Connecting to WhatsApp... Please Wait.");
        }
        if (connection === "open") {
          console.log("✅ Login Successful!");
           await reqplugins(path.join(global.__basedir, "lib", "database"));
           await reqplugins(path.join(global.__basedir, "plugins"));
          const packageVersion = require("../package.json").version;
          const totalPlugins = plugins.commands.length;
          const workType = config.WORK_TYPE;
          async function reqextplugins() {
           console.log("⬇️ Installing External Plugins...");
            let plugins = await PluginDB.findAll();
            plugins = plugins.map((plugin) => plugin.toJSON());
            let totalcmds = 0;
            for (const plugin of plugins) {
              const pluginPath = path.join(
                __basedir,
                "plugins",
                `${plugin.name}.js`
              );
              try {
                let url = plugin.url.endsWith("/raw")
                  ? plugin.url
                  : `${plugin.url}/raw`;
                const { data } = await axios.get(url);
                await fs.writeFile(pluginPath, data);
                require(pluginPath);
                totalcmds += plugin.commands.length;
              } catch (e) {
                console.log(`Failed to install plugin ${plugin.name}:`, e);
                await PluginDB.destroy({ where: { id: plugin.id } });
                try {
                  await fs.unlink(pluginPath);
                } catch (unlinkError) {
                  console.log(`Failed to delete file for plugin ${plugin.name}:`,unlinkError);
                }
              }
            }
            console.log("✅ External Plugins Installed!");
            return totalcmds;
          }

          async function genstr() {
            const externalCommands = await reqextplugins();
            const str = `\`\`\`connected successfully!\nVersion: ${packageVersion}\nLatestVersion: ${lavss}\nExternal Plugin(s): ${externalCommands}\nTotal Plugin(s): ${totalPlugins + externalCommands}\nWorktype: ${workType}\`\`\``;
            return str;
          }

          if (!config.DIS_START_MSG) {
            genstr()
              .then((message) => {
                conn.sendMessage(conn.user.id, { text: message });
              })
              .catch((error) => {
                console.error("Error generating message:", error);
              });
          }
        }
        if (connection === "close") {
          const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;

          if (statusCode !== DisconnectReason.loggedOut) {
            await delay(300);
            switch (statusCode) {
              case DisconnectReason.badSession:
                console.log("📁 Bad Session File, delete session and rescan.");
                /*  fs.rmSync("./session", {
                  recursive: true,
                });*/
                process.exit(0);
              case DisconnectReason.connectionClosed:
                console.log("🔌 Connection closed, reconnecting...");
                Alpha();
                break;
              case DisconnectReason.connectionLost:
                console.log("🔍 Connection lost from server, reconnecting...");
                Alpha();
                break;
              case DisconnectReason.connectionReplaced:
                console.log(
                  "🔄 Connection replaced, a new session is opened and reconnected..."
                );
                Alpha();
                break;
              case DisconnectReason.restartRequired:
                console.log("🔁 Restart required, restarting...");
                Alpha();
                break;
              case DisconnectReason.timedOut:
                console.log("⏳ Connection timed out, reconnecting...");
                Alpha();
                break;
              case DisconnectReason.multideviceMismatch:
                console.log("📱 Multi device mismatch, rescan.");
                process.exit(1);
              default:
                console.log(`❓ Unknown disconnect reason: ${statusCode}`);
            }
          } else {
            console.log("🔒 Connection closed. Device logged out.");
            fs.rmSync("./session", {
              recursive: true,
            });
            await delay(3000);
            process.exit(0);
          }
        }
      });

      conn.ws.on("CB:call", async (json) => {
        if (json.content[0].tag == "offer") {
          const callfrom = json.content[0].attrs["call-creator"];
          const call_id = json.content[0].attrs["call-id"];
          const blockMessage =
            "> Sorry, no calls.\n> You have been blocked for this\n> automated System.";
          const rejectMessage =
            "> Sorry, no calls.\n> Please use Text or Voice Message\n> automated System";
          if (config.CALL_BLOCK) {
            await conn
              .rejectCall(call_id, callfrom)
              .catch((e) => console.log(e));
            await conn
              .sendMessage(callfrom, { text: blockMessage })
              .catch((e) => console.log(e));
            await conn
              .updateBlockStatus(callfrom, "block")
              .catch((e) => console.log(e));
          } else if (config.REJECT_CALL) {
            await conn
              .rejectCall(call_id, callfrom)
              .catch((e) => console.log(e));
            await conn
              .sendMessage(callfrom, { text: rejectMessage })
              .catch((e) => console.log(e));
          }
        }
      });

      conn.ev.on("creds.update", saveCreds);

      conn.ev.on("group-participants.update", async (data) => {
        Greetings(data, conn);
        const { antifake } = await groupDB(["antifake"],{ jid: data.id },"get");
        if (!antifake || antifake.status == "false" || !antifake.data) return;
        if (
          data.action != "remove" &&
          data.participants[0] != jidNormalizedUser(conn.user.id)
        ) {
          let inv = true;
          const notAllowed = antifake.data.split(",") || [antifake.data];
          notAllowed.map(async (num) => {
            if (
              num.includes("!") &&
              data.participants[0].startsWith(num.replace(/[^0-9]/g, ""))
            ) {
              inv = false;
            } else if (data.participants[0].startsWith(num)) {
              return await conn.groupParticipantsUpdate(
                data.id,
                data.participants,
                "remove"
              );
            }
          });
          await sleep(500);
          if (inv) {
            return await conn.groupParticipantsUpdate(
              data.id,
              data.participants,
              "remove"
            );
          }
        }
      });

      conn.ev.on("chats.update", async (chats) => {
        chats.forEach(async (chat) => {
          await saveChat(chat);
        });
      });

      conn.ev.on("messages.upsert", async (m) => {
        const { pdm, antilink, antiword, antibot, } = await groupDB(["pdm","antilink","antiword","antibot",],{ jid: m.messages[0].key.remoteJid }, "get");
        if (m.messages[0]?.messageStubType) {
          const jid = m.messages[0]?.key.remoteJid;
          const participant = m.messages[0].messageStubParameters[0];
          const actor = m.messages[0]?.participant;
          const botadmins = insertSudo().map((a) => !!a);         
          const botJid = jidNormalizedUser(conn.user.id);
            const groupMetadata = await conn.groupMetadata(jid).catch((e) => {
              participants: [];
            });
            const admins = (jid) =>
              groupMetadata.participants
                .filter((v) => v.admin !== null)
                .map((v) => v.id)
                .includes(jid);
          if (!jid || !participant || !actor) return;
          if (m.messages[0].messageStubType === proto.WebMessageInfo.StubType.GROUP_PARTICIPANT_DEMOTE) {
            if (pdm === "true") {
              await conn.sendMessage(jid, {
                text: `_${actor.split("@")[0]} demoted @${participant.split("@")[0]}_`,
                mentions: [actor, participant],
              });
            }
          } else if ( m.messages[0].messageStubType === proto.WebMessageInfo.StubType.GROUP_PARTICIPANT_PROMOTE ) {
            if (pdm === "true") {
              await conn.sendMessage(jid, {
                text: `_${actor.split("@")[0]} promoted @${participant.split("@")[0]}_`,
                mentions: [actor, participant],
              });
            }
          }
        }
        if (m.type !== "notify") return;
        let msg = await serialize(JSON.parse(JSON.stringify(m.messages[0])), conn);
        await saveMessage(m.messages[0], msg.sender);
        const mek = m.messages[0];
        if (!mek.message) return;
        mek.message =
          Object.keys(mek.message)[0] === "ephemeralMessage"
            ? mek.message.ephemeralMessage.message
            : mek.message;
        if (
          mek.key &&
          mek.key.remoteJid === "status@broadcast" &&
          config.STATUS_VIEW === true
        ) {
          await conn.readMessages([mek.key]);
        }
        if (config.AUTO_READ) {
          await conn.readMessages([mek.key]);
        }
        config.ALWAYS_ONLINE
          ? await conn.sendPresenceUpdate("available", m.jid)
          : await conn.sendPresenceUpdate("unavailable", m.jid);
        let text_msg = msg.body;
        if (!msg) return;
        const regex = new RegExp(`${config.HANDLERS}( ?resume)`, "is");
        isResume = regex.test(text_msg);
        const chatId = msg.from;
        try {
          const pausedChats = await PausedChats.getPausedChats();
          if (
            pausedChats.some(
              (pausedChat) => pausedChat.chatId === chatId && !isResume
            )
          ) {
            return;
          }
        } catch (error) {
          console.error(error);
        }
        if (config.PM_BLOCK) await conn.updateBlockStatus(msg.from, "block");
        if (
          config.AJOIN &&
          (msg.type == "groupInviteMessage" ||
            (typeof msg.body === "string" &&
              msg.body.match(/^https:\/\/chat\.whatsapp\.com\/[a-zA-Z0-9]/)))
        ) {
          if (
            typeof msg.body === "string" &&
            msg.body.match(/^https:\/\/chat\.whatsapp\.com\/[a-zA-Z0-9]/)
          )
            await conn.groupAcceptInvite(
              extractUrlsFromString(msg.body)[0].split("/")[3]
            );
          if (msg.type == "groupInviteMessage")
            await conn.groupAcceptInviteV4(
              m.message[0].key.remoteJid,
              m.message[0].message
            );
        }
        if (config.LOGS) {
          let name = await getName(msg.sender);
          console.log(
            `At : ${
              msg.from.endsWith("@g.us")
                ? (await conn.groupMetadata(msg.from)).subject
                : msg.from
            }\nFrom : ${name}\nMessage:${text_msg ? text_msg : msg.type}`
          );
        }
        plugins.commands.map(async (command) => {
          if (
            (config.DISABLE_PM && !msg.isGroup) ||
            (config.DISABLE_GRP && msg.isGroup)
          )
            return;
          if (command.fromMe && !msg.sudo) return;
          let comman = text_msg;
          msg.prefix = new RegExp(config.HANDLERS).test(text_msg)
            ? text_msg[0].toLowerCase()
            : "!";
          let whats;
          switch (true) {
            case command.pattern && command.pattern.test(comman):
              let match;
              try {
                match = text_msg
                  .replace(new RegExp(command.pattern, "i"), "")
                  .trim();
              } catch {
                match = false;
              }
              whats = new Message(conn, msg);
              command.function(whats, match, msg, conn);
              break;
            case text_msg && command.on === "text":
              whats = new Message(conn, msg);
              command.function(whats, text_msg, msg, conn, m);
              break;
            case command.on === "image" || command.on === "photo":
              if (msg.type === "imageMessage") {
                whats = new Image(conn, msg);
                command.function(whats, text_msg, msg, conn, m);
              }
              break;
            case command.on === "sticker":
              if (msg.type === "stickerMessage") {
                whats = new Sticker(conn, msg);
                command.function(whats, msg, conn, m);
              }
              break;
            case command.on === "video":
              if (msg.type === "videoMessage") {
                whats = new Video(conn, msg);
                command.function(whats, msg, conn, m);
              }
              break;
            case command.on === "delete":
              if (msg.type === "protocolMessage") {
                whats = new Message(conn, msg);
                whats.messageId = msg.message.protocolMessage.key?.id;
                command.function(whats, msg, conn, m);
              }
              break;
            case command.on === "message":
              whats = new AllMessage(conn, msg);
              command.function(whats, msg, conn, m);
              break;
            default:
              break;
          }
        });
      });
      return conn;
    } catch (error) {
      console.log(error);
    }
    return;
  };

  try {
    await Alpha();
  } catch (error) {
    console.error("Alpha function error:", error);
  }
};

module.exports = bot;

// SIGINT handler
process.on("SIGINT", async () => {
  console.log("Received SIGINT. Exiting...");
  process.exit(0);
});
