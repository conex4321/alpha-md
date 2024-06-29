const { alpha, isAdmin, parsedJid, isPrivate, getBuffer } = require("../lib");
const { downloadMediaMessage } = require('baileys');
const { groupDB } = require('../lib/database/group');

alpha({
    on: "message",
    fromMe: false,
    dontAddCommandList: true
}, async (message, match, m) => {
    try {
        const gcstn = await groupDB(['antiviewonce'], { jid: message.jid }, 'get');
        if (gcstn.antiviewonce === 'true') {
            const viewOnceMessage = message.message.message.viewOnceMessageV2 || message.message.message.viewOnceMessage;
            if (viewOnceMessage) {
                const buffer = await downloadMediaMessage(m.client, 'buffer', {}, {
                    reuploadRequest: message.client
                });
                const caption = viewOnceMessage.message.imageMessage?.caption || viewOnceMessage.message.videoMessage?.caption || '';
                return await message.sendvv(
                    message.jid,
                    buffer,
                    { caption: caption },
                    message
                );
            }
        }
    } catch (error) {
        errorHandler(message, error);
    }
});