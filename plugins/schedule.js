const alpha = require("../lib/alpha");
const { isAdmin, errorHandler } = require("../lib");
const scheduleModule = require("../lib/schedule");

alpha(
  {
    pattern: "amute",
    fromMe: true,
    desc: "auto mute group at a specific time",
    type: "group",
  },
  async (message, match, m, client) => {
    try {
      if (!message.isGroup)
        return await message.reply("_This command is for groups_");
      if (!(await isAdmin(message.jid, message.user, message.client)))
        return await message.reply("_I'm not admin_");
      let time = match;
      if (!time)
        return await message.reply("_Please specify a time in HH:MM format_");
      const scheduleId = await scheduleModule.saveSchedule(message.jid, time, "muteGroup");
      await scheduleModule.startSchedule(message, message.jid);
      return await message.reply(`_Scheduled to mute the group at ${time}_`);
    } catch (error) {
      errorHandler(message, error);
    }
  }
);

alpha(
  {
    pattern: "aunmute",
    fromMe: true,
    desc: "auto unmute group at a specific time",
    type: "group",
  },
  async (message, match, m, client) => {
    try {
      if (!message.isGroup)
        return await message.reply("_This command is for groups_");
      if (!(await isAdmin(message.jid, message.user, message.client)))
        return await message.reply("_I'm not admin_");
      let time = match;
      if (!time)
        return await message.reply("_Please specify a time in HH:MM format_");
      const scheduleId = await scheduleModule.saveSchedule(message.jid, time, "unmuteGroup");
      await scheduleModule.startSchedule(message, message.jid);
      return await message.reply(`_Scheduled to unmute the group at ${time}_`);
    } catch (error) {
      errorHandler(message, error);
    }
  }
);
