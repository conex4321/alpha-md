const { alpha, errorHandler, parsedJid, sleep, isAdmin } = require("../lib");
const { groupDB } = require("../lib/database/group");
const config = require("../config");
const { getWarns, saveWarn, resetWarn } = require("../lib/database/warn");
const { WARN_COUNT } = require("../config");

// Anti-sticker function
alpha({
    on: "message",
    fromMe: false,
    dontAddCommandList: true
},
async (message, match) => {
    try {
        if (!message.sticker || !message.isGroup) return;
        const chatId = message.jid;
        const sudoList = config.SUDO.split(',').map(Number);
        const userId = message.key.participant;
        const senderId = message.key.participant.split("@")[0];
        if (sudoList.includes(Number(senderId))) return;
        const isYouAdmin = await isAdmin(chatId, userId, message.client);
        await sleep(1000);
        const isMeAdmin = await isAdmin(chatId, message.user, message.client);
        
        const { antisticker } = await groupDB(["antisticker"], { jid: message.jid, content: {} }, "get");
        if (antisticker && antisticker.status && antisticker.action) {
            const msg = await message.reply("*_Sticker Detected!_*");
            await sleep(1000);
            if (isYouAdmin) {
                await message.edit("_Verified Admin!_", msg.key);
            } else if (!isMeAdmin) {
                return;
            } else {
                if (antisticker.action === "kick") {
                    await sleep(500);
                    await message.client.groupParticipantsUpdate(chatId, message.key.participant, "remove");
                    await sleep(500);
                    await message.client.sendMessage(chatId, { delete: message.key });
                } else if (antisticker.action === "warn") {
                    const reason = "anti sticker";
                    const warnInfo = await getWarns(userId);
                    let userWarnCount = warnInfo ? warnInfo.warnCount : 0;
                    userWarnCount += 1;

                    if (userWarnCount >= WARN_COUNT) {
                        await message.client.sendMessage(chatId, {
                            text: `_Warn limit exceeded. Kicking user @${userId.split("@")[0]}_`,
                            mentions: [userId]
                        });

                        const jid = parsedJid(userId);
                        await sleep(500);
                        await resetWarn(userId);
                        await message.client.groupParticipantsUpdate(chatId, jid, "remove");
                    } else {
                        await saveWarn(userId, reason);
                        await message.client.sendMessage(chatId, {
                            text: `_Warning_\nUser @${userId.split("@")[0]} warned.\nWarn Count: ${userWarnCount}.\nReason: ${reason}`,
                            mentions: [userId]
                        });
                        await sleep(500);
                        await message.client.sendMessage(chatId, { delete: message.key });
                    }
                } else if (antisticker.action === "null") {
                    await sleep(500);
                    await message.client.sendMessage(chatId, { delete: message.key });
                }
            }
        }
    } catch (error) {
        errorHandler(message, error);
    }
});



// Anti-bot function
alpha({
    on: "message",
    fromMe: false,
    dontAddCommandList: true
},
async (message, match) => {
    try {
        if (!message.isBaileys || !message.isGroup) return;
        const chatId = message.jid;
        const sudoList = config.SUDO.split(',').map(Number);
        const userId = message.key.participant;
        const senderId = message.key.participant.split("@")[0];
        if (sudoList.includes(Number(senderId))) return;
        const isYouAdmin = await isAdmin(chatId, userId, message.client);
        await sleep(1000);
        const isMeAdmin = await isAdmin(chatId, message.user, message.client);
        
        const { antibot } = await groupDB(["antibot"], { jid: message.jid, content: {} }, "get");
        if (!antibot || !antibot.status || !antibot.action) return;
        let { key } = await message.reply("*_Bot Detected!_*");
        await sleep(1000);
        if (isYouAdmin) {
            await message.client.sendMessage(chatId, {
                text: "_Verified Admin!_",
                edit: key
            });
        } else if (!isMeAdmin) {
            return;
        } else {
            if (antibot.action === "kick") {
                await sleep(500);
                await message.client.groupParticipantsUpdate(chatId, userId, "remove");
                await sleep(500);
                await message.client.sendMessage(chatId, { delete: message.key });
            } else if (antibot.action === "warn") {
                const reason = "anti bot";
                const warnInfo = await getWarns(userId);
                let userWarnCount = warnInfo ? warnInfo.warnCount : 0;
                userWarnCount += 1;
                if (userWarnCount >= WARN_COUNT) {
                    await message.client.sendMessage(chatId, {
                        text: `_Warn limit exceeded. Kicking user @${userId.split("@")[0]}_`,
                        mentions: [userId]
                    });
                    await sleep(500);
                    await resetWarn(userId);
                    await message.client.groupParticipantsUpdate(chatId, userId, "remove");
                } else {
                    await saveWarn(userId, reason);
                    await message.client.sendMessage(chatId, {
                        text: `_Warning_\nUser @${userId.split("@")[0]} warned.\nWarn Count: ${userWarnCount}.\nReason: ${reason}`,
                        mentions: [userId]
                    });
                    await sleep(500);
                    await message.client.sendMessage(chatId, { delete: message.key });
                }
            } else if (antibot.action === "null") {
                await sleep(500);
                await message.client.sendMessage(chatId, { delete: message.key });
            }
        }
    } catch (error) {
        errorHandler(message, error);
    }
});

alpha({
    on: "text",
    fromMe: false,
    dontAddCommandList: true,
},
async (message, match) => {
    try {
        if (!message.isGroup) return;
        const chatId = message.jid;
        const sudoList = config.SUDO.split(',').map(Number);
        const userId = message.key.participant;
        const senderId = message.key.participant.split("@")[0];
        if (sudoList.includes(Number(senderId))) return;
        const isYouAdmin = await isAdmin(chatId, userId, message.client);
        await sleep(1000);
        const isMeAdmin = await isAdmin(chatId, message.user, message.client);
        
        const { antilink } = await groupDB(["antilink"], { jid: message.jid, content: {} }, "get");
        console.log( antilink, antilink.action, antilink.status)
       return console.log('yayyyyyyyyy')
        if (!antilink || !antilink.status || !antilink.action) return;
        const linkRegex = /(https?:\/\/[^\s]+)/g;
        if (!linkRegex.test(message.text)) return;
        console.log('nayyyyyyyyy')
        let { key } = await message.reply("*_Link Detected!_*");
        await sleep(1000);
        if (isYouAdmin) {
            await message.client.sendMessage(chatId, {
                text: "_Verified Admin!_",
                edit: key
            });
        } else if (!isMeAdmin) {
            return;
        } else {
            if (antilink.action === "kick") {
                await sleep(500);
                await message.client.groupParticipantsUpdate(chatId, userId, "remove");
                await sleep(500);
                await message.client.sendMessage(chatId, { delete: message.key });
            } else if (antilink.action === "warn") {
                const reason = "anti bot";
                const warnInfo = await getWarns(userId);
                let userWarnCount = warnInfo ? warnInfo.warnCount : 0;
                userWarnCount += 1;
                if (userWarnCount >= WARN_COUNT) {
                    await message.client.sendMessage(chatId, {
                        text: `_Warn limit exceeded. Kicking user @${userId.split("@")[0]}_`,
                        mentions: [userId]
                    });
                    await sleep(500);
                    await resetWarn(userId);
                    await message.client.groupParticipantsUpdate(chatId, userId, "remove");
                } else {
                    await saveWarn(userId, reason);
                    await message.client.sendMessage(chatId, {
                        text: `_Warning_\nUser @${userId.split("@")[0]} warned.\nWarn Count: ${userWarnCount}.\nReason: ${reason}`,
                        mentions: [userId]
                    });
                    await sleep(500);
                    await message.client.sendMessage(chatId, { delete: message.key });
                }
            } else if (antilink.action === "null") {
                await sleep(500);
                await message.client.sendMessage(chatId, { delete: message.key });
            }
        }
    } catch (error) {
        errorHandler(message, error);
    }
});
  
  