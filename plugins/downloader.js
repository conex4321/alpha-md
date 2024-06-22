const { alpha, getUrl, igdl, isIgUrl, isPrivate, tiktokdl, twitter, fbdown, errorHandler } = require("../lib");

alpha(
  {
    pattern: "igdl",
    fromMe: isPrivate,
    desc: "To download Instagram media",
    type: "downloader",
  },
  async (message, match) => {
    try {
      match = match || message.reply_message.text;
      if (!match) return await message.reply("Give me a link");
      const url = getUrl(match.trim())[0];
      if (!url) return await message.reply("Invalid link");
      if (!isIgUrl(url))
        return await message.reply("Invalid Instagram link");
      const data = await igdl(url);
      if (!data.status) return await message.reply('*Not Found*');
      return await message.sendFile(data.data);
    } catch (e) {
      errorHandler(message, e);
    }
  }
);

alpha(
  {
    pattern: "ttv",
    fromMe: isPrivate,
    desc: "To download TikTok media",
    type: "downloader",
  },
  async (message, match) => {
    try {
      match = match || message.reply_message.text;
      if (!match) return await message.reply("Give me a link");
      const url = getUrl(match.trim())[0];
      if (!url) return await message.reply("Invalid link");
      const { status, video } = await tiktokdl(url);
      if (!status) return await message.reply('*Not Found*');
      return await message.sendFile(video);
    } catch (e) {
      errorHandler(message, e);
    }
  }
);

alpha(
  {
    pattern: "twv",
    fromMe: isPrivate,
    desc: "To download Twitter media",
    type: "downloader",
  },
  async (message, match) => {
    try {
      match = match || message.reply_message.text;
      if (!match) return await message.reply("Give me a link");
      const url = getUrl(match.trim())[0];
      if (!url) return await message.reply("Invalid link");
      const { status, video } = await twitter(url);
      if (!status) return await message.reply('*Not Found*');
      return await message.sendFile(video);
    } catch (e) {
      errorHandler(message, e);
    }
  }
);

alpha(
  {
    pattern: "fb",
    fromMe: isPrivate,
    desc: "To download Facebook media",
    type: "downloader",
  },
  async (message, match) => {
    try {
      match = match || message.reply_message.text;
      if (!match) return await message.reply("Give me a link");
      const url = getUrl(match.trim())[0];
      if (!url) return await message.reply("Invalid link");
      const { status, HD } = await fbdown(url);
      if (!status) return await message.reply('*Not Found*');
      return await message.sendFile(HD);
    } catch (e) {
      errorHandler(message, e);
    }
  }
);
