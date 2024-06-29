const { alpha, isPrivate, errorHandler, parsedJid, sleep } = require("../lib");
const { groupDB } = require("../lib/database/group");
const config = require("../config");
const { getWarns, saveWarn, resetWarn } = require("../lib/database/warn");
const { WARN_COUNT } = require("../config");

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
        const senderId = message.key.participant.split("@")[0];
        if (!sudoList.includes(Number(senderId))) {
            const { antisticker } = await groupDB(["antisticker"], { jid: message.jid, content: {} }, "get");
            if (antisticker.status && antisticker.action) {
                if (antisticker.action === "kick") {
                    await message.client.sendMessage(chatId, { text: "_anti sticker_" })
                    await sleep(500);
                    await message.client.groupParticipantsUpdate(chatId, [message.key.participant], "remove")
                    await message.client.sendMessage(chatId, { delete: message.key })
                } else if (antisticker.action === "warn") {
                    const userId = message.key.participant;
                    const reason = "anti sticker";
                    const warnInfo = await getWarns(userId)
                    let userWarnCount = warnInfo ? warnInfo.warnCount : 0;
                    userWarnCount += 1;
                    if (userWarnCount >= WARN_COUNT) {
                        await message.client.sendMessage(chatId, {
                            text: `_Warn limit exceeded. Kicking user @${userId.split("@")[0]}_`,
                            mentions: [userId]
                        })
                        const jid = parsedJid(userId);
                        await sleep(500);
                        await resetWarn(userId)
                        message.client.groupParticipantsUpdate(chatId, jid, "remove");
                        return;
                    }
                    await saveWarn(userId, reason)
                    await message.client.sendMessage(chatId, {
                        text: `_Warning_\nUser @${userId.split("@")[0]} warned.\nWarn Count: ${userWarnCount}.\nReason: ${reason}`,
                        mentions: [userId]
                    })
                    await sleep(500);
                    await message.client.sendMessage(chatId, { delete: message.key })
                } else if (antisticker.action === "null") {
                    await message.client.sendMessage(chatId, { delete: message.key })
                }
            }
        }
    } catch (error) {
        errorHandler(message, error);
    }
});


/*alpha({
    on: "message",
    fromMe: false,
    dontAddCommandList: true
},
async (message, match) => {
    try {
        console.log('qjfhwlhdddddddddddddd:', message)
        process.exit(0)
    } catch (error) {
        errorHandler(message, error);
    }
});

*/