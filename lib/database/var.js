const config = require("../../config");
const { DataTypes } = require("sequelize");

const VARDb = config.DATABASE.define("VARDb", {
  key: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  value: {
    type: DataTypes.TEXT,
  },
});



async function getvar(key) {
  try {
    const configVar = await VARDb.findByPk(key);
    return configVar ? configVar.value : null;
  } catch (error) {
    console.log("Error fetching config variable:", error);
    return null;
  }
}

async function setvar(key, value) {
  try {
    let configVar = await VARDb.findByPk(key);
    if (!configVar) {
      configVar = await VARDb.create({ key, value });
    } else {
      configVar.value = value;
      await configVar.save();
    }
    return true;
  } catch (error) {
    console.log("Error setting config variable:", error);
    return false;
  }
}

async function delvar(key) {
  try {
    const configVar = await VARDb.findByPk(key);
    if (configVar) {
      await configVar.destroy();
      return true;
    }
    return false;
  } catch (error) {
    console.log("Error deleting config variable:", error);
    return false;
  }
}

module.exports = {
  getvar,
  setvar,
  delvar,
};
