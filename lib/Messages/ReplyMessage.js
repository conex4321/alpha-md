const { decodeJid } = require("..");
const config = require("../../config");
const { parsedJid } = require("../functions");
const Base = require("./Base");
const fileType = require("file-type");
const { tmpdir } = require("os");
const fs = require("fs");
const {
  generateWAMessage,
  WA_DEFAULT_EPHEMERAL
} = require("baileys");

class ReplyMessage extends Base {
  constructor(client, data) {
    super(client);
    if (data) this._patch(data);
  }

  _patch(data) {
    this.key = data.key;
    this.id = data.stanzaId;
    this.isBaileys = this.id.startsWith("BAE5") || this.id.length === 16;
    this.jid = data.participant;
    try {
      this.sudo = config.SUDO.split(",").includes(
        this.participant.split("@")[0]
      );
    } catch {
      this.sudo = false;
    }
    this.fromMe = parsedJid(this.client.user.jid)[0] === parsedJid(this.jid)[0];
    const { quotedMessage } = data;
    if (quotedMessage) {
      let type = Object.keys(quotedMessage)[0];
      if (type === "extendedTextMessage") {
        this.text = quotedMessage[type].text;
        this.mimetype = "text/plain";
      } else if (type === "conversation") {
        this.text = quotedMessage[type];
        this.mimetype = "text/plain";
      } else if (type === "stickerMessage") {
        this.mimetype = "image/webp";
        this.sticker = quotedMessage[type];
      } else {
        let mimetype = quotedMessage[type].mimetype
          ? quotedMessage[type].mimetype
          : type;
        if (mimetype.includes("/")) {
          this.mimetype = mimetype;
          let mime = mimetype.split("/")[0];
          this[mime] = quotedMessage[type];
        } else {
          this.mimetype = mimetype;
          this.message = quotedMessage[type];
        }
      }
    }
    return super._patch(data);
  }


  async reply(text, opt = {}) {
    return this.client.sendMessage(
      this.jid,
      { text, ...opt },
      { quoted: this.message, ...opt }
    );
  }

  async edit(msg, key) {
    return await this.client.relayMessage(
      this.jid,
      {
        protocolMessage: {
          key: key,
          type: 14,
          editedMessage: {
            conversation: msg,
          },
        },
      },
      {}
    );
  }

  async react(jid, imog = "", key) {
    return await this.client.sendMessage(jid, {
      react: {
        text: imog,
        key: key,
      },
    });
  }

  async sendMessage(jid, content, opt = { packname: "alpha", author: "c-iph3r" }, type = "text") {
    switch (type.toLowerCase()) {
      case "text":
        return this.client.sendMessage(jid, { text: content, ...opt });
      case "image":
      case "photo":
        if (Buffer.isBuffer(content)) {
          return this.client.sendMessage(jid, { image: content, ...opt });
        } else if (isUrl(content)) {
          return this.client.sendMessage(jid, { image: { url: content }, ...opt });
        }
        break;
      case "video":
        if (Buffer.isBuffer(content)) {
          return this.client.sendMessage(jid, { video: content, ...opt });
        } else if (isUrl(content)) {
          return this.client.sendMessage(jid, { video: { url: content }, ...opt });
        }
        break;
      case "audio":
        if (Buffer.isBuffer(content)) {
          return this.client.sendMessage(jid, { audio: content, ...opt });
        } else if (isUrl(content)) {
          return this.client.sendMessage(jid, { audio: { url: content }, ...opt });
        }
        break;
      case "template":
        const optional = await generateWAMessage(jid, content, opt);
        const message = {
          viewOnceMessage: {
            message: {
              ...optional.message,
            },
          },
        };
        await this.client.relayMessage(jid, message, {
          messageId: optional.key.id,
        });
        break;
      case "interactive":
        const genMessage = createInteractiveMessage(content);
        await this.client.relayMessage(jid, genMessage.message, {
          messageId: genMessage.key.id,
        });
        break;
      case "sticker":
        const { data, mime } = await this.client.getFile(content);
        if (mime == "image/webp") {
          const buff = await writeExifWebp(data, opt);
          await this.client.sendMessage(jid, { sticker: { url: buff }, ...opt }, opt);
        } else {
          const mimePrefix = mime.split("/")[0];
          if (mimePrefix === "video" || mimePrefix === "image") {
            await this.client.sendImageAsSticker(this.jid, content, opt);
          }
        }
        break;
      case "delete":
        return await this.client.sendMessage(this.jid, { delete: content.key });
      case "contact":
        const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${content.name}\nORG:${content.org};\nTEL;type=CELL;type=VOICE;waid=${content.whatsapp}:${content.phone}\nEND:VCARD`;
        return await this.client.sendMessage(
          this.jid,
          {
            contacts: {
              displayName: content.name,
              contacts: [{ vcard, ...opt }],
            },
            ephemeralExpiration: WA_DEFAULT_EPHEMERAL,
          },
          { quoted: opt.quoted }
        );
    }
  }

  async downloadMediaMessage() {
    const buff = await this.m.quoted.download();
    const type = await fileType.fromBuffer(buff);
    await fs.promises.writeFile(`${tmpdir()}/${type.ext}`, buff);
    return `${tmpdir()}/${type.ext}`;
  }
}

module.exports = ReplyMessage;
