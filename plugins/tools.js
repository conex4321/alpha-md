const { alpha, qrcode, Bitly, isPrivate, isUrl, readQr, parsedJid, errorHandler } = require("../lib/");
const { downloadMediaMessage } = require("baileys");

alpha(
  {
    pattern: "vv",
    fromMe: isPrivate,
    desc: "Forwards the viewed message",
    type: "tool",
  },
  async (message, m) => {
    try {
      const buffer = await downloadMediaMessage(
        m.quoted,
        "buffer",
        {},
        {
          reuploadRequest: message.client.updateMediaMessage,
        },
      );
      await message.sendFile(buffer);
    } catch (error) {
      errorHandler(message, error);
    }
  },
);

alpha(
  {
    pattern: "qr",
    fromMe: isPrivate,
    desc: "Read/Write Qr.",
    type: "tool",
  },
  async (message, match, m) => {
    try {
      match = match || message.reply_message.text;

      if (match) {
        let buff = await qrcode(match);
        await message.sendMessage(message.jid, buff, {}, "image");
      } else if (message.reply_message.image) {
        const buffer = await m.quoted.download();
        const data = await readQr(buffer);
        await message.sendMessage(message.jid, data);
      } else {
        await message.sendMessage(message.jid,"*Example : qr test*\n*Reply to a qr image.*",
        );
      }
    } catch (error) {
      errorHandler(message, error);
    }
  },
);

alpha(
  {
    pattern: "bitly",
    fromMe: isPrivate,
    desc: "Converts URL to bitly",
    type: "tool",
  },
  async (message, match) => {
    try {
      match = match || message.reply_message.text;
      if (!match) return await message.reply("_Reply to a URL or enter a URL_");
      if (!isUrl(match)) return await message.reply("_Not a valid URL_");
      let short = await Bitly(match);
      await message.reply(short.link);
    } catch (error) {
      errorHandler(message, error);
    }
  },
);


alpha(
  {
    pattern: "fd",
    fromMe: isPrivate,
    desc: "Forwards the replied message",
    type: "tool",
  },
  async (message, match, m) => {
    try {
      if (!m.quoted) return await message.reply("Reply to something");
      let jids = parsedJid(match);
      for (let i of jids) {
        await message.forward(i, message.reply_message.message);
      }
    } catch (error) {
      errorHandler(message, error);
    }
  },
);
