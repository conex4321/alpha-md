const { alpha, isPrivate, errorHandler } = require("../lib");
const { isAdmin, parsedJid } = require("../lib");
const { groupDB } = require("../lib/database/group");

alpha(
  {
    pattern: "add",
    fromMe: true,
    desc: "add a person to group",
    type: "group",
  },
  async (message, match) => {
    try {
      if (!message.isGroup)
        return await message.reply("_This command is only for groups_");
      match = match || message.reply_message.jid;
      if (!match) return await message.reply("_Mention user to add");
      const isadmin = await isAdmin(message.jid, message.user, message.client);
      if (!isadmin) return await message.reply("_I'm not admin_");
      const jid = parsedJid(match);
      await message.client.groupParticipantsUpdate(message.jid, jid, "add");
      return await message.reply(`_@${jid[0].split("@")[0]} added_`, {
        mentions: [jid],
      });
    } catch (error) {
      errorHandler(message, error);
    }
  },
);

alpha(
  {
    pattern: "kick",
    fromMe: true,
    desc: "kicks a person from group",
    type: "group",
  },
  async (message, match) => {
    try {
      if (!message.isGroup)
        return await message.reply("_This command is for groups_");
      match = match || message.reply_message.jid;
      if (!match) return await message.reply("_Mention user to kick_");
      const isadmin = await isAdmin(message.jid, message.user, message.client);
      if (!isadmin) return await message.reply("_I'm not admin_");
      const jid = parsedJid(match);
      await message.client.groupParticipantsUpdate(message.jid, jid, "remove");
      return await message.reply(`_@${jid[0].split("@")[0]} kicked_`, {
        mentions: [jid],
      });
    } catch (error) {
      errorHandler(message, error);
    }
  },
);

alpha(
  {
    pattern: "promote",
    fromMe: true,
    desc: "promote to admin",
    type: "group",
  },
  async (message, match) => {
    try {
      if (!message.isGroup)
        return await message.reply("_This command is for groups_");
      match = match || message.reply_message.jid;
      if (!match) return await message.reply("_Mention user to promote_");
      const isadmin = await isAdmin(message.jid, message.user, message.client);
      if (!isadmin) return await message.reply("_I'm not admin_");
      const jid = parsedJid(match);
      await message.client.groupParticipantsUpdate(message.jid, jid, "promote");
      return await message.reply(
        `_@${jid[0].split("@")[0]} promoted as admin_`,
        {
          mentions: [jid],
        },
      );
    } catch (error) {
      errorHandler(message, error);
    }
  },
);

alpha(
  {
    pattern: "demote",
    fromMe: true,
    desc: "demote from admin",
    type: "group",
  },
  async (message, match) => {
    try {
      if (!message.isGroup)
        return await message.reply("_This command is for groups_");
      match = match || message.reply_message.jid;
      if (!match) return await message.reply("_Mention user to demote_");
      const isadmin = await isAdmin(message.jid, message.user, message.client);
      if (!isadmin) return await message.reply("_I'm not admin_");
      const jid = parsedJid(match);
      await message.client.groupParticipantsUpdate(message.jid, jid, "demote");
      return await message.reply(
        `_@${jid[0].split("@")[0]} demoted from admin_`,
        {
          mentions: [jid],
        },
      );
    } catch (error) {
      errorHandler(message, error);
    }
  },
);

alpha(
  {
    pattern: "mute",
    fromMe: true,
    desc: "mute group",
    type: "group",
  },
  async (message, match, m, client) => {
    try {
      if (!message.isGroup)
        return await message.reply("_This command is for groups_");
      if (!(await isAdmin(message.jid, message.user, message.client)))
        return await message.reply("_I'm not admin_");
      await message.reply("_Muting_");
      return await client.groupSettingUpdate(message.jid, "announcement");
    } catch (error) {
      errorHandler(message, error);
    }
  },
);

alpha(
  {
    pattern: "unmute",
    fromMe: true,
    desc: "unmute group",
    type: "group",
  },
  async (message, match, m, client) => {
    try {
      if (!message.isGroup)
        return await message.reply("_This command is for groups_");
      if (!(await isAdmin(message.jid, message.user, message.client)))
        return await message.reply("_I'm not admin_");
      await message.reply("_Unmuting_");
      return await client.groupSettingUpdate(message.jid, "not_announcement");
    } catch (error) {
      errorHandler(message, error);
    }
  },
);

alpha(
  {
    pattern: "gjid",
    fromMe: true,
    desc: "gets jid of all group members",
    type: "group",
  },
  async (message, match, m, client) => {
    try {
      if (!message.isGroup)
        return await message.reply("_This command is for groups_");
      let { participants } = await client.groupMetadata(message.jid);
      let participant = participants.map((u) => u.id);
      let str = "╭──〔 *Group Jids* 〕\n";
      participant.forEach((result) => {
        str += `├ *${result}*\n`;
      });
      str += `╰──────────────`;
      message.reply(str);
    } catch (error) {
      errorHandler(message, error);
    }
  },
);

alpha(
  {
    pattern: "tag",
    fromMe: true,
    desc: "mention all users in group",
    type: "group",
  },
  async (message, match) => {
    try {
      if (!message.isGroup) return;
      const { participants } = await message.client.groupMetadata(message.jid);
      if (match === "all") {
        let teks = "";
        for (let mem of participants) {
          teks += `@${mem.id.split("@")[0]}\n`;
        }
        message.sendMessage(message.jid, teks.trim(), {
          mentions: participants.map((a) => a.id),
        });
      } else {
        match = match || message.reply_message.text;
        if (!match) return message.reply("_Enter or reply to a text to tag_");
        message.sendMessage(message.jid, match, {
          mentions: participants.map((a) => a.id),
        });
      }
    } catch (error) {
      errorHandler(message, error);
    }
  },
);

alpha(
  {
    pattern: "pdm",
    fromMe: true,
    desc: "promote, demote messages",
    type: "group",
  },
  async (message, match) => {
    try {
      if (!message.isGroup) return;
      if (!match) return message.reply("pdm on/off");
      if (match != "on" && match != "off") return message.reply("pdm on");
      const { pdm } = await groupDB(
        ["pdm"],
        { jid: message.jid, content: {} },
        "get",
      );
      if (match == "on") {
        if (pdm == "true") return message.reply("_Already activated_");
        await groupDB(["pdm"], { jid: message.jid, content: "true" }, "set");
        return await message.reply("_activated_");
      } else if (match == "off") {
        if (pdm == "false") return message.reply("_Already Deactivated_");
        await groupDB(["pdm"], { jid: message.jid, content: "false" }, "set");
        return await message.reply("_deactivated_");
      }
    } catch (error) {
      errorHandler(message, error);
    }
  },
);

alpha(
  {
    pattern: "antifake",
    fromMe: true,
    desc: "remove fake numbers",
    type: "group",
  },
  async (message, match) => {
    try {
      if (!message.isGroup) return;
      if (!match)
        return await message.reply(
          "_*antifake* 94,92_\n_*antifake* on/off_\n_*antifake* get_",
        );
      const { antifake } = await groupDB(
        ["antifake"],
        { jid: message.jid, content: {} },
        "get",
      );
      if (match.toLowerCase() == "get") {
        if (!antifake || antifake.status == "false" || !antifake.data)
          return await message.reply("_Not Found_");
        return await message.reply(
          `_*activated restricted numbers*: ${antifake.data}_`,
        );
      } else if (match.toLowerCase() == "on") {
        const data = antifake && antifake.data ? antifake.data : "";
        await groupDB(
          ["antifake"],
          { jid: message.jid, content: { status: "true", data } },
          "set",
        );
        return await message.reply(`_Antifake Activated_`);
      } else if (match.toLowerCase() == "off") {
        const data = antifake && antifake.data ? antifake.data : "";
        await groupDB(
          ["antifake"],
          { jid: message.jid, content: { status: "false", data } },
          "set",
        );
        return await message.reply(`_Antifake Deactivated_`);
      }
      match = match.replace(/[^0-9,!]/g, "");
      if (!match) return await message.reply("value must be number");
      const status = antifake && antifake.status ? antifake.status : "false";
      await groupDB(
        ["antifake"],
        { jid: message.jid, content: { status, data: match } },
        "set",
      );
      return await message.reply(`_Antifake Updated_`);
    } catch (error) {
      errorHandler(message, error);
    }
  },
);

alpha(
  {
    pattern: "info",
    fromMe: isPrivate,
    desc: "get invite info of group",
    type: "group",
  },
  async (message, match, m, client) => {
    try {
      match = match || message.reply_message.text;
      if (!match)
        return await message.reply("_Tag a group invite link to check info_");
      if (!match.includes("chat.whatsapp.com")) {
        return await message.reply("_Tag a group invite link to check info_");
      }
      let cold = match;
      let hmm = cold.split("/")[3];
      const metadata = await message.client.groupGetInviteInfo(hmm);
      const { id, subject, owner, creation, size, desc, participants } =
        metadata;
      const created = msToDateTime(creation);
      const ownerId = owner ? "@" + owner.split("@")[0] : "Not Found!";
      let adminCount = 0;
      let nonAdminCount = 0;
      participants.forEach((participant) => {
        if (
          participant.admin === "admin" ||
          participant.admin === "superadmin"
        ) {
          adminCount++;
        } else {
          nonAdminCount++;
        }
      });
      const participantList = participants
        .map((participant) => {
          const { id, admin } = participant;
          return `ID: ${id}, Admin: ${admin}`;
        })
        .join("\n");
      const description = desc ? desc : "No Description";
      const creatorAdmin = participants.find(
        (participant) => participant.admin === "superadmin",
      );
      const creatorAdminPhone = creatorAdmin
        ? "@" + creatorAdmin.id.split("@")[0]
        : "Not Found!";
      let msg = `> Group ID:🌟 ${id}\n> Subject: 📚 ${subject}\n> Creator: 👤 ${ownerId}\n> Created on: 🕒 ${created}\n> Super Admin: 🚀 ${creatorAdminPhone}\n> Total Number of members: 👥 ${participants.length}\n> Number of Admins: 🔧 ${adminCount}\n> Number of Members: 👫 ${nonAdminCount}\n> Description: 📝 ${description}`;
      const jid = parsedJid(msg);
      return await message.reply(msg, {
        mentions: [jid],
      });
    } catch (error) {
      errorHandler(message, error);
    }
  },
);

function msToDateTime(ms) {
  const date = new Date(ms * 1000);
  const dateString = date.toDateString();
  const timeString = date.toTimeString().split(" ")[0];
  return dateString + " " + timeString;
}
