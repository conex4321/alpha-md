const { alpha, isPrivate, photoleap, errorHandler } = require("../lib/");
const { removeBg } = require("../lib/functions");
const config = require("../config");

alpha(
  {
    pattern: "dalle",
    fromMe: isPrivate,
    desc: "Generate image from text",
    type: "ai",
  },
  async (message, match) => {
    try {
      match = match || message.reply_message.text;
      if (!match) {
        await message.sendMessage(message.jid, "Provide a text");
        return;
      }
      let buff = `https://api.gurusensei.workers.dev/dream?prompt=${encodeURIComponent(match)}`;
      let response = await fetch(buff);
      if (!response.ok) {
        throw new Error(`Image generation failed with status: ${response.status}`);
      }

      let imageBuffer = await response.arrayBuffer();
      await message.sendMessage(
        message.jid,
        { image: Buffer.from(imageBuffer), caption: "```Alpha Dall-E Interface```" },
        {
          mimetype: "image/jpeg",
          caption: "```Alpha Dall-E Interface```",
        },
        "image"
      );
    } catch (error) {
      console.error("Image generation error:", error);
      await message.sendMessage(message.jid, "An error occurred while generating the image. Please try again later.");
    }
  }
);

alpha(
  {
    pattern: "pleap",
    fromMe: isPrivate,
    desc: "Generate image from text",
    type: "ai",
  },
  async (message, match) => {
    try {
      match = match || message.reply_message.text;
      if (!match) return await message.sendMessage(message.jid, "Provide a text");
      const res = await photoleap(match);
      if (res.status === true) {
        await message.sendMessage(
          message.jid,
          res.url,
          {
            mimetype: "image/jpeg",
            caption: "```Alpha Photoleap Interface```",
          },
          "image",
        );
      } else {
        await message.reply("```An error occurred```");
      }
    } catch (error) {
      errorHandler(message, error);
    }
  }
);

alpha(
  {
    pattern: "rmbg",
    fromMe: isPrivate,
    desc: "Remove background of an image",
    type: "ai",
  },
  async (message, match, m) => {
    try {
      if (!config.RMBG_KEY)
        return await message.reply("Set RemoveBg API Key in config.js \n Get it from https://www.remove.bg/api");
      if (!message.reply_message || !message.reply_message.image)
        return await message.reply("Reply to an image");
      let buff = await m.quoted.download();
      let buffer = await removeBg(buff);
      if (!buffer) return await message.reply("An error occurred");
      await message.sendMessage(
        message.jid,
        buffer,
        {
          quoted: message.reply_message.key,
          mimetype: "image/png",
          fileName: "removebg.png",
        },
        "document",
      );
    } catch (error) {
      errorHandler(message, error);
    }
  }
);
