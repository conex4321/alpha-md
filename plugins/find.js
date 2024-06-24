const { alpha, isPrivate, getBuffer, errorHandler } = require("../lib/");
const ytsr = require('ytsr');
const acrcloud = require("acrcloud");

alpha(
  {
    pattern: "find",
    fromMe: isPrivate,
    desc: "Find the music",
    type: "tools",
  },
  async (message, match, m) => {
    try {
      if (!m.quoted.message.videoMessage && !m.quoted.message.audioMessage)
        return await message.reply("*Need Video! Or Audio*");
      let buff = await m.quoted.download();
      try {
        const acr = new acrcloud({
          host: "identify-eu-west-1.acrcloud.com",
          access_key: "df8c1cffbfa4295dd40188b63d363112",
          access_secret: "d5mygczEZkPlBDRpFjwySUexQM26jix0gCmih389"
        });
        let res = await acr.identify(buff);
        let { code, msg } = res.status;
        if (code !== 0) return await message.reply(msg);
        const { album } = res.metadata.music[0];
        const rex = await syt(album?.name);
        const { type, title, url, views, duration, uploadedAt, author, bestThumbnail } = rex;
        const { name, url: authorUrl, verified } = author;
        let im = await getBuffer(bestThumbnail.url);
        let text = `🎵 Type: ${type}\n🎶 Title: ${title}\n📀 Album: ${album?.name}\n👀 Views: ${views}\n⏱️ Duration: ${duration}\n📅 Uploaded At: ${uploadedAt}\n👤 Author: ${name}\n🔗 Author URL: ${authorUrl}\n${verified ? '✔️ Verified: Yes' : '❌ Verified: No'}`;
        return await message.client.sendMessage(message.jid, { image: im, caption: text }, { quoted: message });
      } catch (e) {
        console.log(e);
        throw e;
      }
    } catch (error) {
      errorHandler(message, error);
    }
  }
);

async function syt(res) {
  const filters = await ytsr.getFilters(res);
  const filter = filters.get('Type').get('Video');
  const options = {
    limit: 1 // Retrieve only the first result
  };

  const sr = await ytsr(filter.url, options);
  return sr.items[0];
}
