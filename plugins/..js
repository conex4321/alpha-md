const { alpha, isPrivate, getBuffer, ytsdl, errorHandler } = require("../lib");

alpha(
  {
    pattern: "ytsn",
    fromMe: isPrivate,
    desc: "Download audio from YouTube",
    dontAddCommandList: true,
  },
  async (message, match) => {
    try {
      match = match || message.reply_message.text;
      if (!match) return await message.reply("Give me a query");
      const { dlink, title } = await ytsdl(match);
      let buff = await getBuffer(dlink);
      await message.sendMessage(
        message.jid,
        buff,
        {
          mimetype: "audio/mpeg",
          filename: title + ".mp3",
        },
        "audio"
      );
    } catch (error) {
      errorHandler(message, error);
    }
  }
);

alpha(
  {
    pattern: "ytvd",
    fromMe: isPrivate,
    desc: "Download video from YouTube",
    dontAddCommandList: true,
  },
  async (message, match) => {
    try {
      match = match || message.reply_message.text;
      if (!match) return await message.reply("Give me a query");
      const { dlink, title } = await ytsdl(match, "video");
      await message.sendMessage(
        message.jid,
        dlink,
        {
          mimetype: "video/mp4",
          filename: title + ".mp4",
        },
        "video"
      );
    } catch (error) {
      errorHandler(message, error);
    }
  }
);
