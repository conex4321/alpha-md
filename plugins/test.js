const { alpha, isPrivate } = require("../lib");
alpha(
    {
      pattern: "paa",
      fromMe: isPrivate,
      desc: "To check ping",
      type: "info",
    },
    async (message, match) => {
      try {
        const start = Date.now();
        const msg = await message.sendMessage(message.jid, "*Pong!*");
        const end = Date.now();
        const latency = end - start;
        await message.edit(`\`\`\`${latency}\`\`\` *ms*`, msg.key);
  
        // Send a reaction to the message
        await message.sendMessage( { react: {key: msg.key, text: "✅"  } }, {}, "react");

  
        const contactInfo = {
          name: "John Doe",
          org: "Organization",
          whatsapp: "1234567890",
          phone: "+1234567890"
        };
       // await message.sendMessage(message.jid, contactInfo, {}, "contact");
  
        //await message.sendMessage(message.jid, { key: msg.key }, {}, "delete");
      } catch (error) {
        errorHandler(message, error);
      }
    }
  );
  