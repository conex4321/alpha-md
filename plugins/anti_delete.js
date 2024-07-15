const { ANTI_DELETE } = require("../config");
const { alpha, serialize } = require("../lib");
const { loadMessage, getName } = require("../lib/database/Store");

alpha(
  {
    on: "delete",
    fromMe: false,
    desc: "Logs the recently deleted message",
  },
  async (message, match) => {
    let DELETED_LOG_CHAT;
    if (ANTI_DELETE === "g") {
      DELETED_LOG_CHAT = message.jid;
    } else if (ANTI_DELETE === "p") {
      DELETED_LOG_CHAT = message.user;
    } else if (
      ANTI_DELETE.endsWith("@g.us") ||
      ANTI_DELETE.endsWith("@s.whatsapp.net")
    ) {
      DELETED_LOG_CHAT = "antidelete";
    } else {
      return;
    }
    if (!DELETED_LOG_CHAT) return;
    let msg = await loadMessage(message.messageId);
    if (!msg) return;
    msg = await serialize(
      JSON.parse(JSON.stringify(msg.message)),
      message.client
    );
    if (!msg) return;
    // console.log(msg)
    const key = msg.key;
    if (msg.from === "status@broadcast") {
      return await message.forward(message.user, msg.message, {
        linkPreview: {
          title: "deleted status message",
        },
        quoted: {
          key,
        },
      });
    } else {
      return await message.forward(DELETED_LOG_CHAT, msg.message, {
        linkPreview: {
          title: "deleted message",
        },
        quoted: {
          key,
        },
      });
    }
  }
);
