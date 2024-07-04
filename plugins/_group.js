const { alpha, isPrivate, errorHandler, PREFIX } = require("../lib");
const { isAdmin, parsedJid, serialize } = require("../lib");
const { groupDB } = require("../lib/database/group");
const { common } = require("../lib/common");
const { loadMessage } = require("../lib/database/Store");
const actions = ["kick", "warn", "null"];

alpha({
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

alpha({
  pattern: "kick",
  fromMe: true,
  desc: "kicks a person or everyone from group",
  type: "group",
},
async (message, match) => {
  try {
    if (!message.isGroup)
      return await message.reply("_This command is for groups_");
    const isadmin = await isAdmin(message.jid, message.user, message.client);
    if (!isadmin) return await message.reply("_I'm not admin_");
    if (match === "all") {
      let { participants } = await message.client.groupMetadata(message.jid);
      for (let key of participants) {
        let jid = parsedJid(key.id);
        if (!(parsedJid(message.client.user.id)[0] in jid)) {
          await message.client.groupParticipantsUpdate(message.jid, jid, "remove");
          await message.reply(`@${jid[0].split("@")[0]} kicked`, {
            mentions: jid,
          });
        }
      }
    } else {
      match = match || message.reply_message.jid;
      if (!match) return await message.reply("_Mention user to kick_");
      const jid = parsedJid(match);
      await message.client.groupParticipantsUpdate(message.jid, jid, "remove");
      return await message.reply(`_@${jid[0].split("@")[0]} kicked_`, {
        mentions: [jid],
      });
    }
  } catch (error) {
    errorHandler(message, error);
  }
});


alpha({
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

alpha({
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

alpha({
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

alpha({
    pattern: 'common',
    fromMe: true,
    desc: "Perform actions on common participants across multiple groups",
    type: "group",
  },
  async (message, match, m, client) => {
    try {
      if (!match) {
        return await message.reply(`Use ${PREFIX}common help for more info`);
      }
      if (match === 'help') {
        return await message.reply(helpr);
      }else 
        {
      const parts = match.split(';');
      if (parts.length !== 2) {
        return await message.reply(`Invalid command format. Use ${PREFIX}help for more info`);
      }
      const [jidsPart, action] = parts;
      const jids = jidsPart.split(',').map(jid => jid.trim());
      if (jids.length < 2) {
        return await message.reply(`Please provide at least two group JIDs. Use ${PREFIX}help for more info`);
      }
      for (let jid of jids) {
        if (!(await isAdmin(jid, message.user, message.client))) {
          return await message.reply(`I'm not admin in ${jid}`);
        }
      }
      return await common(message, jids, action.trim());
    }
    } catch (error) {
      errorHandler(message, error);
    }
  }
);
const helpr = `To find common participants in multiple groups and perform actions, use the format: ${PREFIX}common <group1_jid>, <group2_jid>, ... ;<action>. Replace JIDs with groups to compare, separated by commas, then add a semicolon followed by the action. Actions include listing common participants (list/listall) or kicking them (kick/kickall). Example: ${PREFIX}common 120363266704865818@g.us, 120363303061636757@g.us;list.`;


alpha({
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

alpha({
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

/*alpha({
    pattern: "tag",
    fromMe: true,
    desc: "mention all users in group",
    type: "group",
  },
  async (message, match) => {
    try {
      const msggg = message.reply_message.audio || message.reply_message.sticker || message.reply_message.video || message.reply_message.image
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
      } else if (match || message.reply_message.text) {
        match = match || message.reply_message.text
        if (!match) return message.reply("_Enter or reply to a text to tag_");
        message.sendMessage(message.jid, match, {
          mentions: participants.map((a) => a.id),
        });
      } else if(msggg) {
        let key = msggg.key;
        let msg = await loadMessage(key.id);
        msg = await serialize(JSON.parse(JSON.stringify(msg.message)),message.client);
        return await message.forward(message.jid, msg, {contextInfo: {mentionedJid: participants.map(a => a.id)}});
      }
    } catch (error) {
      errorHandler(message, error);
    }
  },
);*/

alpha({
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
      const { pdm } = await groupDB(["pdm"],{ jid: message.jid, content: {} }, "get",);
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

alpha({
    pattern: "antifake",
    fromMe: true,
    desc: "remove fake numbers",
    type: "group",
  },
  async (message, match) => {
    try {
      if (!message.isGroup) return;
      if (!match)
        return await message.reply("_*antifake* 234,94,92_\n_*antifake* on/off_\n_*antifake* get_");
      const { antifake } = await groupDB(["antifake"],{ jid: message.jid, content: {} },"get",);
      if (match.toLowerCase() == "get") {
        if (!antifake || antifake.status == "false" || !antifake.data)
          return await message.reply("_Not Found_");
        return await message.reply(`_*activated restricted numbers*: ${antifake.data}_`);
      } else if (match.toLowerCase() == "on") {
        const data = antifake && antifake.data ? antifake.data : "";
        await groupDB(["antifake"],{ jid: message.jid, content: { status: "true", data } },"set",);
        return await message.reply(`_Antifake Activated_`);
      } else if (match.toLowerCase() == "off") {
        const data = antifake && antifake.data ? antifake.data : "";
        await groupDB(["antifake"],{ jid: message.jid, content: { status: "false", data } },"set",);
        return await message.reply(`_Antifake Deactivated_`);
      }
      match = match.replace(/[^0-9,!]/g, "");
      if (!match) return await message.reply("value must be number");
      const status = antifake && antifake.status ? antifake.status : "false";
      await groupDB(["antifake"],{ jid: message.jid, content: { status, data: match } },"set",);
      return await message.reply(`_Antifake Updated_`);
    } catch (error) {
      errorHandler(message, error);
    }
  },
);

alpha({
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

alpha({
    pattern: "antivv",
    fromMe: true,
    desc: "auto-resends viewonce msgs in chat",
    type: "group",
  },
  async (message, match) => {
    try {
      if (!message.isGroup) return;
      if (!match) return message.reply("antivv on/off");
      if (match != "on" && match != "off") return message.reply("antivv on");
      const { antiviewonce } = await groupDB(["antiviewonce"],{ jid: message.jid, content: {} }, "get",);
      if (match == "on") {
        if (antiviewonce == "true") return message.reply("_Already activated_");
        await groupDB(["antiviewonce"], { jid: message.jid, content: "true" }, "set");
        return await message.reply("_activated_");
      } else if (match == "off") {
        if (antiviewonce == "false") return message.reply("_Already Deactivated_");
        await groupDB(["antiviewonce"], { jid: message.jid, content: "false" }, "set");
        return await message.reply("_deactivated_");
      }
    } catch (error) {
      errorHandler(message, error);
    }
  },
);

alpha(
  {
    pattern: "antilink",
    fromMe: true,
    desc: "remove users who send links",
    type: "group",
  },
  async (message, match) => {
    try {
      if (!message.isGroup) return;
      if (!match)
        return await message.reply("_*antilink* on/off_\n_*antilink* action warn/kick/null_",);
      const { antilink } = await groupDB(["antilink"],{ jid: message.jid, content: {} },"get",);
      if (match.toLowerCase() == "on") {
        const action = antilink && antilink.action ? antilink.action : "null";
        await groupDB(["antilink"],{ jid: message.jid, content: { status: "true", action } },"set",);
        return await message.reply(`_antilink Activated with action null_\n_*antilink action* warn/kick/null for chaning actions_`,);
      } else if (match.toLowerCase() == "off") {
        const action = antilink && antilink.action ? antilink.action : "null";
        await groupDB(["antilink"],{ jid: message.jid, content: { status: "false", action } },"set",);
        return await message.reply(`_antilink deactivated_`);
      } else if (match.toLowerCase().match("action")) {
        const status = antilink && antilink.status ? antilink.status : "false";
        match = match.replace(/action/gi, "").trim();
        if (!actions.includes(match))
          return await message.reply("_action must be warn,kick or null_");
        await groupDB(["antilink"],{ jid: message.jid, content: { status, action: match } },"set",);
        return await message.reply(`_AntiLink Action Updated_`);
      }
    } catch (error) {
      errorHandler(message, error);
    }
  },
);

alpha(
  {
    pattern: "antiword",
    fromMe: true,
    desc: "remove users who use restricted words",
    type: "group",
  },
  async (message, match) => {
    try {
      if (!message.isGroup) return;
      if (!match)
        return await message.reply( "_*antiword* on/off_\n_*antiword* action warn/kick/null_");
      const { antiword } = await groupDB(["antiword"],{ jid: message.jid, content: {} },"get",);
      if (match.toLowerCase() == "get") {
        const status = antiword && antiword.status == "true" ? true : false;
        if (!status || !antiword.word) return await message.reply("_Not Found_");
        return await message.reply(`_*activated antiwords*: ${antiword.word}_`);
      } else if (match.toLowerCase() == "on") {
        const action = antiword && antiword.action ? antiword.action : "null";
        const word = antiword && antiword.word ? antiword.word : undefined;
        await groupDB(["antiword"],{ jid: message.jid, content: { status: "true", action, word } },"set",);
        return await message.reply(`_antiword Activated with action null_\n_*antiword action* warn/kick/null for chaning actions_`,);
      } else if (match.toLowerCase() == "off") {
        const action = antiword && antiword.action ? antiword.action : "null";
        const word = antiword && antiword.word ? antiword.word : undefined;
        await groupDB(["antiword"],{ jid: message.jid, content: { status: "false", action, word } },"set", );
        return await message.reply(`_antiword deactivated_`);
      } else if (match.toLowerCase().match("action")) {
        const status = antiword && antiword.status ? antiword.status : "false";
        match = match.replace(/action/gi, "").trim();
        if (!actions.includes(match))
          return await message.reply("_action must be warn,kick or null_");
        await groupDB(["antiword"],{ jid: message.jid, content: { status, action: match } },"set",);
        return await message.reply(`_antiword Action Updated_`);
      } else {
        if (!match)
          return await message.reply("_*Example:* antiword 🏳️‍🌈, gay, nigga_");
        const status = antiword && antiword.status ? antiword.status : "false";
        const action = antiword && antiword.action ? antiword.action : "null";
        await groupDB(["antiword"],{ jid: message.jid, content: { status, action, word: match } },"set",);
        return await message.reply(`_Antiwords Updated_`);
      }
    } catch (error) {
      errorHandler(message, error);
    }
  },
);

alpha(
  {
    pattern: "antibot",
    fromMe: true,
    desc: "remove users who use bot",
    type: "group",
  },
  async (message, match) => {
    try {
      if (!message.isGroup) return;
      if (!match)
        return await message.reply("_*antibot* on/off_\n_*antibot* action warn/kick/null_",);
      const { antibot } = await groupDB(["antibot"],{ jid: message.jid, content: {} },"get",);
      if (match.toLowerCase() == "on") {
        const action = antibot && antibot.action ? antibot.action : "null";
        await groupDB(["antibot"],{ jid: message.jid, content: { status: "true", action } }, "set",);
        return await message.reply(`_antibot Activated with action null_\n_*antibot action* warn/kick/null for chaning actions_`,);
      } else if (match.toLowerCase() == "off") {
        const action = antibot && antibot.action ? antibot.action : "null";
        await groupDB(["antibot"],{ jid: message.jid, content: { status: "false", action } },"set",);
        return await message.reply(`_antibot deactivated_`);
      } else if (match.toLowerCase().match("action")) {
        const status = antibot && antibot.status ? antibot.status : "false";
        match = match.replace(/action/gi, "").trim();
        if (!actions.includes(match))
          return await message.reply("_action must be warn,kick or null_");
        await groupDB(["antibot"],{ jid: message.jid, content: { status, action: match } },"set",);
        return await message.reply(`_AntiBot Action Updated_`);
      }
    } catch (error) {
      errorHandler(message, error);
    }
  },
);

alpha(
  {
    pattern: "antistk",
    fromMe: true,
    desc: "remove users who use forbidden stickers",
    type: "group",
  },
  async (message, match) => {
    try {
      if (!message.isGroup) return;
      if (!match)
        return await message.reply( "_*antistk* on/off_\n_*antistk* action warn/kick/null_");
      const { antisticker } = await groupDB(["antisticker"],{ jid: message.jid, content: {} },"get",);
      if (match.toLowerCase() == "on") {
        const action = antisticker && antisticker.action ? antisticker.action : "null";
        await groupDB(["antisticker"],{ jid: message.jid, content: { status: "true", action } },"set",);
        return await message.reply(`_antisticker Activated with action null_\n_*antistk action* warn/kick/null for chaning actions_`);
      } else if (match.toLowerCase() == "off") {
        const action = antisticker && antisticker.action ? antisticker.action : "null";
        await groupDB(["antisticker"],{ jid: message.jid, content: { status: "false", action } },"set",);
        return await message.reply(`_antisticker deactivated_`);
      } else if (match.toLowerCase().match("action")) {
        const status = antisticker && antisticker.status ? antisticker.status : "false";
        match = match.replace(/action/gi, "").trim();
     //   console.log('yglyfgileeeeeeeeeeee', match)
        if (!actions.includes(match))
          return await message.reply("_action must be warn,kick or null_");
        await groupDB(["antisticker"], { jid: message.jid, content: { status, action: match } }, "set",);
        return await message.reply(`_antisticker Action Updated_`);
      }
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
