const { alpha, isPrivate, weather, getJson, IMDB, errorHandler } = require("../lib");
const gis = require("g-i-s");

alpha(
  {
    pattern: "google",
    fromMe: isPrivate,
    desc: "Download audio from youtube",
    type: "search",
  },
  async (message, match) => {
    try {
      const text = match || message.reply_message.text;
      if (!text) return await message.reply("*give me a query*");

      let google = require("google-it");
      const results = await google({ query: text });

      let msg = `_*Google Top Search Resuts For Query : ${text}*_\n\n`;
      for (let g of results) {
        msg += `*➣ Title :* ${g.title}\n`;
        msg += `*➣ Description :* ${g.snippet}\n`;
        msg += `*➣ Link :* ${g.link}\n\n────────────────────────\n\n`;
      }

      return await message.reply(msg);
    } catch (error) {
      errorHandler(message, error);
    }
  }
);

alpha(
  {
    pattern: "gis",
    fromMe: isPrivate,
    desc: "search google for random images",
    type: "search",
  },
  async (message, match) => {
    try {
      match = match || message.reply_message.text;
      if (!match) return await message.sendMessage(message.jid, "Provide a text");

      gis(match, async (error, images) => {
        if (error) {
          console.error(error);
          return await message.reply("An error occurred while searching for images.");
        }

        if (images && images.length > 0) {
          const randomIndex = Math.floor(Math.random() * images.length);
          const imageUrl = images[randomIndex].url;
          console.log(images);
          return await message.sendMessage(
            message.jid,
            imageUrl,
            {
              mimetype: "image/jpeg",
              caption: "```Alpha g-i-s Interface```",
            },
            "image"
          );
        } else {
          return await message.reply("```No images found for the given search query.```");
        }
      });
    } catch (error) {
      errorHandler(message, error);
    }
  }
);

alpha(
  {
    pattern: "weather",
    fromMe: isPrivate,
    desc: "gives the weather forecast of a specified country",
    type: "search",
  },
  async (message, match) => {
    try {
      match = match || message.reply_message.text;
      await weather(message, match);
    } catch (error) {
      errorHandler(message, error);
    }
  }
);

alpha(
  {
    pattern: "time",
    fromMe: isPrivate,
    desc: "find time by timeZone or name or shortcode",
    type: "search",
  },
  async (message, match) => {
    try {
      if (!match)
        return await message.reply(
          "```Give me country name or code\nEx .time US\n.time United Arab Emirates\n.time America/new_york```",
        );

      const { status, result } = await getJson(
        `https://levanter.onrender.com/time?code=${encodeURIComponent(match)}`,
      );

      if (!status) return await message.reply(`*Not found*`);

      let msg = "";
      result.forEach(
        (zone) =>
          (msg += `*Name     :* ${zone.name}\n*TimeZone :* ${zone.timeZone}\n*Time     :* ${zone.time}\n\n`),
      );

      return await message.reply("```" + msg.trim() + "```");
    } catch (error) {
      errorHandler(message, error);
    }
  }
);

alpha(
  {
    pattern: "imdb",
    fromMe: isPrivate,
    desc: "imdb movie info",
    type: "search",
  },
  async (message, match, m) => {
    try {
      const apiUrl = `https://www.omdbapi.com/?apikey=3c8ee796&t=${await match}`;
      await IMDB(apiUrl, message, m);
    } catch (error) {
      errorHandler(message, error);
    }
  }
);
