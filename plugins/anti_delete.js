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

    if (ANTI_DELETE === 'g') {
      DELETED_LOG_CHAT = message.jid;
    } else if (ANTI_DELETE === 'p') {
      DELETED_LOG_CHAT = message.user;
    } else if (ANTI_DELETE.endsWith('@g.us') || ANTI_DELETE.endsWith('@s.whatsapp.net')) {
      DELETED_LOG_CHAT = 'antidelete';
    } else {
      return;
    }

    if (!DELETED_LOG_CHAT) return;

    let msg = await loadMessage(message.messageId);
    if (!msg) return;

    msg = await serialize(JSON.parse(JSON.stringify(msg.message)), message.client);
    if (!msg) return;
    console.log(msg)
    let deleted;
    const key = msg.key;
    if (msg.from === "status@broadcast") {
      return await message.forward(message.user, msg.message, {
        linkPreview: {
          title: "deleted status message",
        },
        quoted: {
          key
        },
      });
    } else {
      deleted = await message.forward(DELETED_LOG_CHAT, msg.message, {
        linkPreview: {
          title: "deleted message",
        },
        quoted: {
          key
        },
      });
    }    
    let textr;
    let name;
    if (!msg.from.endsWith("@g.us")) {
      let getname = await getName(msg.from);
      name = `_Name: ${getname} 😊_`;
      textr = `\n${name}\n_Sender: @${msg.sender.split("@")[0]} ✉️_`;
    } else {
      let gname = (await message.client.groupMetadata(msg.from)).subject;
      let getname = await getName(msg.sender);
      name = `_Group Name: ${gname} 📛_\n_Name: ${getname} 😊_`;
      textr = `_From: ${msg.from} 📢_\n${name}\n_Sender: @${msg.sender.split("@")[0]} ✉️_`;
    }

    return await message.client.sendMessage(DELETED_LOG_CHAT, {
      text: textr,
      mentions: [msg.sender]
    }, { quoted: deleted });
  }
);
