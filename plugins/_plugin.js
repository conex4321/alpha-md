const { alpha, errorHandler } = require("../lib");
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

    var pluginName;
    try {
      const { data, status } = await axios.get(url);
      if (status === 200) {
        var command = data.match(/(?<=pattern:) ["'](.*?)["']/);
        pluginName = command ? command[0].replace(/["']/g, "").trim().split(" ")[0] : "__" + Math.random().toString(36).substring(8);
        
        if (!pluginName) {
          pluginName = "__" + Math.random().toString(36).substring(8);
        }

        fs.writeFileSync(__dirname + "/" + pluginName + ".js", data);

        try {
          require("./" + pluginName);
        } catch (e) {
          fs.unlinkSync(__dirname + "/" + pluginName + ".js");
          return await message.sendMessage(
            message.jid,
            "Invalid Plugin\n ```" + e + "```"
          );
        }

        await installPlugin(url, pluginName);
        await message.sendMessage(
          message.jid,
          `_New plugin installed: ${pluginName}_`
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
          "_No external plugins installed_"
        );
      } else {
        plugins.forEach((plugin) => {
          messageText +=
            "```" +
            plugin.dataValues.name +
            "```: " +
            plugin.dataValues.url +
            "\n";
        });
        return await message.sendMessage(message.jid, messageText);
      }
    } catch (error) {
      errorHandler(message, error);
      return await message.sendMessage(
        message.jid,
        "Failed to fetch installed plugins"
      );
    }
  }
);

alpha(
  {
    pattern: "remove",
    fromMe: true,
    desc: "Remove external plugins",
    type: "user",
  },
  async (message, match) => {
    try {
      if (!match) {
        return await message.sendMessage(message.jid, "_Need a plugin name_");
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
