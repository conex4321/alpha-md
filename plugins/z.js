const {alpha, fromMe
  } = require("../lib")
  const { isAdmin,  } = require("../lib");
  const { getDevice } = require("baileys");
  
  
  
alpha(
    {
      pattern: "user",
      fromMe: true,
      type: "tools",
    },
  async (message, match) => {
    let me = await fromMe(message.participant)
    if (me) {
        try {
          let bb = await getDevice(message.reply_message.key.id)
          await message.client.sendMessage(message.jid, {text: "```Checking...```",edit: message.key});
            const end = new Date().getTime();
            setTimeout(async () => {
                return await message.client.sendMessage(message.jid, {text: `Device: ${bb === "unknown" ? "Baileys or Other" : bb === "ios" ? "iPhone iOS" : bb === "android" ? "Android Device" : bb === "web" ? "WhatsApp Web Client" : bb}`,edit: message.key});
            }, 1000)
        } catch (error) {
            console.error("[Error]:", error);
        }
    } else if (!me) {
        try {
          let bb = await getDevice(message.reply_message.key.id)
          let {key} = await message.reply("```Checking...```");
            setTimeout(async () => {
                return await message.client.sendMessage(message.jid, {text: `Device: ${bb === "unknown" ? "Baileys or Other" : bb === "ios" ? "iPhone iOS" : bb === "android" ? "Android Device" : bb === "web" ? "WhatsApp Web Client" : bb}`,edit: key});
            }, 1000)
        } catch (error) {
            console.error("[Error]:", error);
        }
    }
    })