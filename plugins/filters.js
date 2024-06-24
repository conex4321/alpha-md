const { alpha, isPrivate, errorHandler } = require("../lib");
const {
  getFilters,
  setFilter,
  deleteFilter,
} = require("../lib/database/filters");

alpha(
    {
      pattern: "pfilter",
      fromMe: true,
      desc: "Adds a personal filter. When triggered, sends the corresponding response globally.",
      usage: ".pfilter keyword:message",
      type: "autoreply",
    },
    async (message, match) => {
      try {
        let [text, msg] = match.split(":");
        if (!text || !msg) {
          return await message.reply(
            "```use: .pfilter keyword:message\nto set a personal filter```"
          );
        }
        text = text.toLowerCase();
        await setFilter("pm", null, text, msg, true);
        return await message.reply(`_Successfully set personal filter for ${text}_`);
      } catch (error) {
        errorHandler(message, error);
      }
    }
  );
  
  alpha(
    {
      pattern: "pstop",
      fromMe: true,
      desc: "Stops a previously added personal filter.",
      usage: '.pstop "hello"',
      type: "autoreply",
    },
    async (message, match) => {
      try {
        if (!match) return await message.reply("\n*Example:* ```.pstop hello```");
        match = match.trim().toLowerCase();
        const del = await deleteFilter("pm", null, match);
        if (del) {
          await message.reply(`_Personal filter ${match} deleted_`);
        } else {
          await message.reply("No existing personal filter matches the provided input.");
        }
      } catch (error) {
        errorHandler(message, error);
      }
    }
  );
  

  alpha(
    {
      pattern: "filter",
      fromMe: true,
      desc: "Adds a group filter. When triggered, sends the corresponding response.",
      usage: ".filter keyword:message",
      type: "autoreply",
    },
    async (message, match) => {
      try {
        if (!message.isGroup) return;
        let [text, msg] = match.split(":");
        text = text.toLowerCase();
        if (!text || !msg) {
          const filters = await getFilters("group", message.jid);
          if (filters === false) {
            await message.reply("No filters are currently set in this chat.");
          } else {
            let mesaj = "Your active filters for this chat:" + "\n\n";
            filters.forEach((filter) => {
              mesaj += `✒ ${filter.dataValues.pattern}\n`;
            });
            mesaj += "use : .filter keyword:message\nto set a filter";
            await message.reply(mesaj);
          }
        } else {
          await setFilter("group", message.jid, text, msg, true);
          return await message.reply(`_Successfully set filter for ${text}_`);
        }
      } catch (error) {
        errorHandler(message, error);
      }
    }
  );
  
  alpha(
    {
      pattern: "stop",
      fromMe: true,
      desc: "Stops a previously added group filter.",
      usage: '.stop "hello"',
      type: "autoreply",
    },
    async (message, match) => {
      try {
        if (!message.isGroup) return;
        if (!match) return await message.reply("\n*Example:* ```.stop hello```");
        match = match.trim().toLowerCase();
        const del = await deleteFilter("group", message.jid, match);
        if (del) {
          await message.reply(`_Filter ${match} deleted_`);
        } else {
          await message.reply("No existing filter matches the provided input.");
        }
      } catch (error) {
        errorHandler(message, error);
      }
    }
  );
  

  alpha(
    { on: "text", fromMe: false, dontAddCommandList: true },
    async (message, match) => {
        if (message.participant && message.client.user.id && message.participant.split('@')[0] === message.client.user.id.split(':')[0]) return;
      try {
        if (!message.isGroup) {
          const pmFilters = await getFilters("pm");
          if (pmFilters) {
            const txxt = match.toLowerCase();
            pmFilters.forEach(async (filter) => {
              const pattern = new RegExp(
                filter.dataValues.regex
                  ? filter.dataValues.pattern.toLowerCase()
                  : "\\b(" + filter.dataValues.pattern.toLowerCase() + ")\\b",
                "gm",
              );
              if (pattern.test(txxt)) {
                return await message.reply(filter.dataValues.text);
              }
            });
          }
        } else {
          const groupFilters = await getFilters("group", message.jid);
          if (groupFilters) {
            const txxt = match.toLowerCase();
            groupFilters.forEach(async (filter) => {
              const pattern = new RegExp(
                filter.dataValues.regex
                  ? filter.dataValues.pattern.toLowerCase()
                  : "\\b(" + filter.dataValues.pattern.toLowerCase() + ")\\b",
                "gm",
              );
              if (pattern.test(txxt)) {
                return await message.reply(filter.dataValues.text);
              }
            });
          }
        }
      } catch (error) {
        errorHandler(message, error);
      }
    }
  );
  