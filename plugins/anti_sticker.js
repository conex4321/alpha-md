/*const { alpha, isPrivate, errorHandler, parsedJid } = require("../lib");
const { groupDB } = require("../lib/database/group");
const { stickban, GroupDBB } = require("../lib/database");
const config = require("../config");
const { PausedChats, WarnDB } = require("../lib/database");
const { WARN_COUNT } = require("../config");
const { saveWarn } = WarnDB;

alpha({
    on: "message",
    fromMe: false,
    dontAddCommandList: true
},
async (message, match) => {
    try {
        if (!message.sticker) return;        
        const chatId = message.jid;
        console.log(chatId)
        const sudoList = config.SUDO.split(',').map(Number);
        const senderId = message.key.participant.split("@")[0];
        if (!sudoList.includes(Number(senderId))) {
            const { antisticker } = await groupDB(["antisticker"], { jid: message.jid, content: {} }, "get");
            console.log(antisticker.status , antisticker.action, 'jajfjklyafd')
            if (antisticker.status && antisticker.action) {
                if (antisticker.action === "kick") {
                    console.log('kjlyhliuagds;', 'kickkking')
                    await message.client.sendMessage(chatId, {
                        text: "_Banned Sticker_"
                    });
                    await delay(500);
                    await message.client.groupParticipantsUpdate(chatId, [message.key.participant], "remove");
                    await message.client.sendMessage(chatId, {
                        delete: message.key
                    });
                } else if (antisticker.action === "warn") {
                    console.log('kjlyhliuagds;', 'warnning')
                    const userId = message.key.participant;
                    const reason = "Using banned sticker"; 
                    const warnInfo = await saveWarn(userId, reason);
                    let userWarnCount = warnInfo ? warnInfo.warnCount : 0;
                    userWarnCount++;                                    
                    await message.client.sendMessage(chatId, {
                        text: `_Warning_\nUser @${userId.split("@")[0]} warned.\nWarn Count: ${userWarnCount}.\nReason: ${reason}`
                    });                                    
                    await delay(500);
                    await message.client.sendMessage(chatId, {
                        delete: message.key
                    });
                    if (userWarnCount > WARN_COUNT) {
                        await message.client.sendMessage(chatId, "Warn limit exceeded. Kicking user.");
                        const jid = parsedJid(userId);
                        await message.client.groupParticipantsUpdate(chatId, [jid], "remove");
                    }
                } else if (antisticker.action === "null") {
                    console.log('kjlyhliuagds;', 'deletinggging')
                    await message.client.sendMessage(chatId, {
                        delete: message.key
                    });
                } else {
                    console.log('kjlyhliuagds;', 'llllllll')
                    await message.client.sendMessage(chatId, {
                        delete: message.key
                    });
                }
            } else {
                console.log('kjlyhliuagds;', 'kkkkkkkk')
                await message.client.sendMessage(chatId, {
                    delete: message.key
                });
            }
        } else {
            return await message.client.sendMessage(chatId, {
               text: "_Sudo user is using Banned Sticker_"
            });
         }
    } catch (error) {
        errorHandler(message, error);
    }
});
*/
