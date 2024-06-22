const { alpha, isPrivate, searchYT, PREFIX, errorHandler } = require("../lib");

alpha(
  {
    pattern: "song",
    fromMe: isPrivate,
    desc: "Downloads audio from YouTube.",
    type: "downloader",
  },
  async (message, match) => {
    try {
      match = match || message.reply_message.text;
      if (!match) return await message.reply("Give me a query");

      const results = await searchYT(match);
      let buttons = [];
      let sections = [];
      results.forEach((result) => {
        sections.push({
          title: result.title,
          rows: [
            {
              title: result.title,
              id: `${PREFIX}ytsn ${result.url}`,
            },
          ],
        });
      });
      
      buttons.push({
        type: "list",
        params: {
          title: 'Click to see results',
          sections: sections,
        },
      });

      let data = {
        jid: message.jid,
        button: buttons,
        header: {
          title: "Alpha-md",
          subtitle: "WhatsApp Bot",
          hasMediaAttachment: false,
        },
        footer: {
          text: "Click to get result",
        },
        body: {
          text: `YouTube search results for ${match}`,
        },
      };
      await message.sendMessage(message.jid, data, {}, "interactive");
    } catch (error) {
      errorHandler(message, error);
    }
  }
);

alpha(
  {
    pattern: "video",
    fromMe: isPrivate,
    desc: "Downloads videos from YouTube.",
    type: "downloader",
  },
  async (message, match) => {
    try {
      match = match || message.reply_message.text;
      if (!match) return await message.reply("Give me a query");

      const results = await searchYT(match);
      let buttons = [];
      let sections = [];
      results.forEach((result) => {
        sections.push({
          title: result.title,
          rows: [
            {
              title: result.title,
              id: `${PREFIX}ytvd ${result.url}`,
            },
          ],
        });
      });
      
      buttons.push({
        type: "list",
        params: {
          title: 'Click to see results',
          sections: sections,
        },
      });

      let data = {
        jid: message.jid,
        button: buttons,
        header: {
          title: "Alpha-md",
          subtitle: "WhatsApp Bot",
          hasMediaAttachment: false,
        },
        footer: {
          text: "Click to get result",
        },
        body: {
          text: `YouTube search results for ${match}`,
        },
      };
      await message.sendMessage(message.jid, data, {}, "interactive");
    } catch (error) {
      errorHandler(message, error);
    }
  }
);
