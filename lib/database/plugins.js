const config = require("../../config");
const { DataTypes } = require("sequelize");

const PluginDB = config.DATABASE.define("Plugin", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  commands: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: "",
    get() {
      const value = this.getDataValue('commands');
      return value ? value.split(',') : [];
    },
    set(value) {
      this.setDataValue('commands', value.join(','));
    },
  },
});

async function installPlugin(adres, file, commands) {
  const existingPlugin = await PluginDB.findOne({ where: { url: adres } });
  if (existingPlugin) {
    return false;
  } else {
    return await PluginDB.create({ url: adres, name: file, commands: commands });
  }
}


async function removePlugin(name) {
  const existingPlugin = await PluginDB.findOne({ where: { name: name } });

  if (existingPlugin) {
    await existingPlugin.destroy();
    return true;
  } else {
    return false;
  }
}

module.exports = {
  PluginDB,
  installPlugin,
  removePlugin,
};