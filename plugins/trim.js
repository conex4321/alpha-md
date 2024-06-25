const { fromBuffer } = require("file-type");
const { alpha, isPrivate, errorHandler } = require("../lib/");
const { ffmpeg, parseTimeToSeconds } = require("../lib/functions");


alpha(
  {
    pattern: "trim",
    fromMe: isPrivate,
    desc: "Trim the video or audio",
    type: "user",
  },
  async (message, match, m) => {
    try {
      const Regex = /^\d{2}:\d{2}\|\d{2}:\d{2}$/;
      if (!message.reply_message || (!message.reply_message.video && !message.reply_message.audio)) {
        return await message.reply("Reply to a media file");
      }
      if (!Regex.test(match)) {
        return await message.reply("Give the start and end time in this format: mm:ss|mm:ss");
      }
      const [start, end] = match.split("|");
      const buffer = await m.quoted.download();
      const startSeconds = parseTimeToSeconds(start);
      const endSeconds = parseTimeToSeconds(end);
      const duration = endSeconds - startSeconds;
      const ext = (await fromBuffer(buffer)).ext;
      const args = ["-ss", `${startSeconds}`, "-t", `${duration}`, "-c", "copy"];
      const trimmedBuffer = await ffmpeg(buffer, args, ext, ext);
      await message.sendFile(trimmedBuffer);
    } catch (error) {
      errorHandler(message, error);
    }
  },
);
