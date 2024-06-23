const { alpha, errorHandler, extractUrlsFromString } = require("../lib");
const axios = require("axios");
const fs = require("fs");
const { personalDB } = require("../lib/database/personal");

alpha(
  {
    pattern: "plugin",
    fromMe: true,
    desc: "Installs External plugins",
    type: "misc",
  },
  async (message, match) => {
    match = match || message.reply_message.text;
    try {
      if (!match) {
        return await message.sendMessage(message.jid, "_Send a plugin URL_");
      }
      if (match && extractUrlsFromString(match)) {
        await message.reply("_Please wait, installing..._");
        const urll = extractUrlsFromString(match);
        
        if (!urll[0]) return message.reply("_Invalid URL provided._");
        
        urll.map(async (url) => {
          let NewUrl = !url?.toString().includes('/raw') ? url.toString() : url.toString().split('/raw')[0];
          let plugin_name;
          
          let { data, status } = await axios(NewUrl + '/raw').catch((e) => {
            return message.reply("_Invalid URL provided._");
          });          
          if (status == 200) {
            try {
              plugin_name = data.match(/(?<=pattern:) ["'](.*?)["']/g).map(match => match.trim().split(" ")[0]).join(', ').replace(/'/g, '').replace(/"/g, '');
              fs.writeFileSync(__dirname + "/" + plugin_name.split(',')[0] + ".js", data);
              require("./" + plugin_name.split(',')[0]);
            } catch (e) {
              fs.unlinkSync(__dirname + "/" + plugin_name.split(',')[0] + ".js");
              return await message.reply(e.toString());
            }
            await message.reply("_Installed plugin(s):_ " + plugin_name);
            await personalDB(['plugins'], {
              content: {
                [plugin_name.split(',')[0]]: NewUrl
              }
            }, 'add');            
            fs.unlinkSync(__dirname + "/" + plugin_name.split(',')[0] + ".js");
          }
        });
      } else {
        const { plugins } = await personalDB(['plugins'], {
          content: {}
        }, 'get');        
        if (!Object.keys(plugins)[0]) {
          return await message.reply("_There are no installed plugins._");
        }
        let text = "_List of Installed Plugins:_\n\n";        
        for (const p in plugins) {
          text += `_*${p}*_\n_${plugins[p]}_\n\n`;
        }        
        return await message.reply(text);
      }
    } catch (error) {
      errorHandler(message, error);
      return await message.sendMessage(message.jid, "_Failed to fetch plugin._");
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
        return await message.reply("*Give me a plugin name that you want to remove*");
      }      
      const { plugins } = await personalDB(['plugins'], {
        content: {}
      }, 'get');      
      if (!Object.keys(plugins)[0]) {
        return await message.reply("_There are no installed plugins to remove._");
      }      
      let Available = false;
       for (const p in plugins) {
        if (p == match) {
          Available = true;
          await personalDB(['plugins'], {
            content: {
              id: match
            }
          }, 'delete');          
          await message.reply("_Plugin removed successfully! Type 'restart' to apply changes._");
          break;
        }
      }      
      if (!Available) {
        return await message.reply("_Plugin not found in the installed plugins list._");
      }
    } catch (error) {
      errorHandler(message, error);
      return await message.sendMessage(message.jid, "_Failed to remove plugin._");
    }
  }
);