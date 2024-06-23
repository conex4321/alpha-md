const { alpha, errorHandler, PREFIX } = require("../lib");
const axios = require("axios");
const fs = require("fs");
const { PluginDB, installPlugin } = require("../lib/database").Plugins;

alpha(
  {
    pattern: "install",
    fromMe: true,
    desc: "Installs External plugins",
    type: "misc",
  },
  async (message, match) => {
    if (!match) {
      return await message.sendMessage(message.jid, "_Send a plugin URL_");
    }

    try {
      var url = new URL(match);
    } catch (e) {
      console.log(e);
      return await message.sendMessage(message.jid, "_Invalid URL_");
    }

    if (url.host === "gist.github.com") {
      url.host = "gist.githubusercontent.com";
      url = url.toString() + "/raw";
    } else {
      url = url.toString();
    }

    let plugin_name;
    let plugid;
    try {
      const { data, status } = await axios.get(url);
      if (status === 200) {
        plugin_name = data.match(/(?<=pattern:) ["'](.*?)["']/g).map(match => match.trim().split(" ")[0]).join(', ').replace(/'/g, '').replace(/"/g, '');
        if (!plugin_name) {
          plugin_name = "__" + Math.random().toString(36).substring(8);
        }
        fs.writeFileSync(__dirname + "/" + plugin_name.split(',')[0] + ".js", data);
        try {
          require("./" + plugin_name.split(',')[0]);
        } catch (e) {
          fs.unlinkSync(__dirname + "/" + plugin_name.split(',')[0] + ".js");
          return await message.sendMessage(
            message.jid,
            "Invalid Plugin\n ```" + e + "```"
          );
        }
        plugid = genid();
        await installPlugin(url, plugid, plugin_name.split(','));
        await message.sendMessage(
          message.jid,
          `_Installed plugin(s): ${plugin_name}_\n_with ID ${plugid}_\n_use ${PREFIX}remove ${plugid} to remove plugin_`
        );
      }
    } catch (error) {
      errorHandler(message, error);
      return await message.sendMessage(message.jid, "Failed to fetch plugin");
    }
  }
);

alpha(
  { pattern: "plugin", fromMe: true, desc: "Plugin list", type: "misc" },
  async (message, match) => {
    try {
      var messageText = "";
      var plugins = await PluginDB.findAll();
      
      if (plugins.length < 1) {
        return await message.sendMessage(
          message.jid,
          "_No external plugin(s) installed_"
        );
      } else {
        plugins.forEach((plugin) => {
          messageText +=
            "```" +
            plugin.dataValues.name +
            "```: " +
            plugin.dataValues.url            
        });
        return await message.sendMessage(message.jid, messageText);
      }
    } catch (error) {
      errorHandler(message, error);
      return await message.sendMessage(
        message.jid,
        "Failed to fetch installed plugin(s)"
      );
    }
  }
);



alpha(
  {
    pattern: "remove",
    fromMe: true,
    desc: "Remove external plugin(s)",
    type: "user",
  },
  async (message, match) => {
    try {
      if (!match) {
        return await message.sendMessage(message.jid, "_Need a plugin ID_");
      }
      
      var plugin = await PluginDB.findAll({ where: { name: match } });
      
      if (plugin.length < 1) {
        return await message.sendMessage(message.jid, "_Plugin not found_");
      } else {
        await plugin[0].destroy();
        delete require.cache[require.resolve("./" + match + ".js")];
        fs.unlinkSync(__dirname + "/" + match + ".js");
        await message.sendMessage(message.jid, `Plugin ${match} deleted`);
      }
    } catch (error) {
      errorHandler(message, error);
      return await message.sendMessage(
        message.jid,
        "Failed to remove plugin"
      );
    }
  }
);

function genid() {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
