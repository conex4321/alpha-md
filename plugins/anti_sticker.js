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
        const chatId = message.jid;
        const sudoList = config.SUDO.split(',').map(Number);
        const senderId = message.key.participant.split("@")[0];
        const userId = message.key.participant;

        if (sudoList.includes(Number(senderId))) return;
        const isYouAdmin = await isAdmin(chatId, userId, message.client);
        const isMeAdmin = await isAdmin(chatId, message.user, message.client);
        if (message.sticker && message.isGroup) {
            let { key } = await message.reply("*_Sticker Detected!_*");
            if (isYouAdmin) {
                return await message.client.sendMessage(chatId, {
                    text: "_Verified Admin!_",
                    edit: key
                });
            }
            if (!isMeAdmin) return;
            const { antisticker } = await groupDB(["antisticker"], { jid: message.jid, content: {} }, "get");
            if (antisticker.status && antisticker.action) {
                if (!isYouAdmin) {
                    if (antisticker.action === "kick") {
                        await message.client.sendMessage(chatId, { text: "_Anti Sticker_" });
                        await sleep(500);
                        await message.client.groupParticipantsUpdate(chatId, [userId], "remove");
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
                            await sleep(500);
                            await resetWarn(userId);
                            await message.client.groupParticipantsUpdate(chatId, [userId], "remove");
                            return;
                        }
                        await saveWarn(userId, reason);
                        await message.client.sendMessage(chatId, {
                            text: `_Warning_\nUser @${userId.split("@")[0]} warned.\nWarn Count: ${userWarnCount}.\nReason: ${reason}`,
                            mentions: [userId]
                        });
                        await sleep(500);
                        await message.client.sendMessage(chatId, { delete: message.key });
                    } else if (antisticker.action === "null") {
                        await message.client.sendMessage(chatId, { delete: message.key });
                    }
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
        const chatId = message.jid;
        const sudoList = config.SUDO.split(',').map(Number);
        const senderId = message.key.participant.split("@")[0];
        const userId = message.key.participant;

        if (sudoList.includes(Number(senderId))) return;
        const isYouAdmin = await isAdmin(chatId, userId, message.client);
        const isMeAdmin = await isAdmin(chatId, message.user, message.client);
        if (message.isBaileys && message.isGroup) {
            let { key } = await message.reply("*_Bot Detected!_*");
            if (isYouAdmin) {
                return await message.client.sendMessage(chatId, {
                    text: "_Verified Admin!_",
                    edit: key
                });
            }
            if (!isMeAdmin) return;
            const { antibot } = await groupDB(["antibot"], { jid: message.jid, content: {} }, "get");
            if (antibot.status && antibot.action) {
                if (!isYouAdmin) {
                    if (antibot.action === "kick") {
                        await message.client.sendMessage(chatId, { text: "_Anti Bot_" });
                        await sleep(500);
                        await message.client.groupParticipantsUpdate(chatId, [userId], "remove");
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
                            await message.client.groupParticipantsUpdate(chatId, [userId], "remove");
                            return;
                        }
                        await saveWarn(userId, reason);
                        await message.client.sendMessage(chatId, {
                            text: `_Warning_\nUser @${userId.split("@")[0]} warned.\nWarn Count: ${userWarnCount}.\nReason: ${reason}`,
                            mentions: [userId]
                        });
                        await sleep(500);
                        await message.client.sendMessage(chatId, { delete: message.key });
                    } else if (antibot.action === "null") {
                        await message.client.sendMessage(chatId, { delete: message.key });
                    }
                }
            }
        }
    } catch (error) {
        errorHandler(message, error);
    }
});



alpha({
    on: "message",
    fromMe: false,
    dontAddCommandList: true
},
async (message, match) => {
    try {
       console.log(message.text, "wfffffffffffffffffffffffff")
    } catch (error) {
        errorHandler(message, error);
    }
});
