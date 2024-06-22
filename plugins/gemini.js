const fs = require("fs");
const { alpha, errorHandler } = require("../lib");
const gemini = require("../lib/Gemini");


alpha(
  {
    pattern: "ai",
    fromMe: true,
    desc: "Generate text with Gemini",
  },
  async (message, match, m) => {
    try {
      match = match || message.reply_message.text;
      const id = message.participant;
      console.log(id);

      if (!match) return await message.reply("Provide a prompt");

      if (message.reply_message && message.reply_message.video) {
        return await message.reply("I can't generate text from video");
      }

      if (
        message.reply_message &&
        (message.reply_message.image || message.reply_message.sticker)
      ) {
        const image = await m.quoted.download();
        fs.writeFileSync("image.jpg", image);
        const text = await gemini(match, image, { id });
        return await message.reply(text);
      }

      match = message.reply_message
        ? message.reply_message.text + `\n\n${match || ""}`
        : match;
      
      const text = await gemini(match, null, { id });
      return await message.reply(text);
    } catch (error) {
      errorHandler(message, error);
    }
  }
);
