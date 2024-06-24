const { alpha, isPrivate, serialize, errorHandler } = require("../lib/");
const { loadMessage } = require("../lib/database/Store");

alpha(
  {
    pattern: "quoted",
    fromMe: isPrivate,
    desc: "quoted message",
  },
  async (message, match) => {
    try {
      if (!message.reply_message)
        return await message.reply("*Reply to a message*");

      let key = message.reply_message.key;
      let msg = await loadMessage(key.id);
      
      if (!msg)
        return await message.reply("_Message not found_");

      let serializedMessage = await serialize(
        JSON.parse(JSON.stringify(msg.message)),
        message.client,
      );

      if (!serializedMessage.quoted)
        return await message.reply("No quoted message found");

      await message.forward(message.jid, serializedMessage.quoted.message);
    } catch (error) {
      errorHandler(message, error);
    }
  },
);
