const { sleep, addSpace } = require('./index');

const common = async (message, jids, action) => {
    const groupParticipantsPromises = jids.map(async (jid) => {
        const groupMetadata = await message.client.groupMetadata(jid).catch(e => {});
        const participants = groupMetadata ? groupMetadata.participants.map(p => p.id) : [];
        const admins = groupMetadata ? groupMetadata.participants.filter(p => p.admin !== null).map(p => p.id) : [];
        return { participants, admins };
    });

    const groupData = await Promise.all(groupParticipantsPromises);
    const allParticipants = groupData.map(data => data.participants);
    const allAdmins = groupData.map(data => data.admins);

    const commonParticipants = allParticipants.reduce((acc, participants) => {
        if (acc === null) return participants;
        return acc.filter(id => participants.includes(id));
    }, null) || [];

    const commonAdmins = allAdmins.reduce((acc, admins) => {
        if (acc === null) return admins;
        return acc.filter(id => admins.includes(id));
    }, null) || [];

    let response = '';

    switch (action) {
        case 'list':
            const commonList = commonParticipants.filter(p => !commonAdmins.includes(p));
            response = commonList.map((user, index) => `${addSpace(index + 1, 3)} @${user.split('@')[0]}`).join('\n');
            return await message.sendMessage(message.jid, '```'+response+'```',
            {mentions: commonList.map(a => a)});
        case 'listall':
            response = commonParticipants.map((user, index) => `${addSpace(index + 1, 3)} @${user.split('@')[0]}`).join('\n');
            return await message.sendMessage(message.jid, '```'+response+'```',
            {mentions: commonParticipants.map(a => a)});
        case 'kick':
            const participantsToKick = commonParticipants.filter(p => !commonAdmins.includes(p));
            for (const id of participantsToKick) {
                await sleep(250);
                await message.client.groupParticipantsUpdate(message.jid, [id], 'remove');
            }
            response = 'Common participants (excluding admins) have been kicked.';
            return await message.reply('```'+response+'```');
        case 'kickall':
            const botJid = conn.user.id;
            const participantsToKickAll = commonParticipants.filter(p => p !== botJid);
            for (const id of participantsToKickAll) {
                await sleep(250);
                await message.client.groupParticipantsUpdate(message.jid, [id], 'remove');
            }
            response = 'All common participants (excluding the bot) have been kicked.';
            return await message.reply('```'+response+'```');
        default:
            response = 'Invalid action specified.';
            return await message.reply('```'+response+'```');
    }
};

module.exports = {
    common,
};