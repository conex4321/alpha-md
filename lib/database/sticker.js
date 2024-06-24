const config = require("../../config");
const { DataTypes } = require("sequelize");

const StickBan = config.DATABASE.define("StickBan", {
  chat: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  stickid: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

async function getStickBan(jid = null) {

  var Where = { chat: jid };
  var Msg = await StickBan.findAll({
    where: Where,
  });

  if (Msg.length < 1) {
    return null;
  } else {
    return Msg.map(item => item.stickid);
  }
}

async function saveStickBan(jid = null, stickid = null) {
  var Msg = await StickBan.findAll({
    where: {
      chat: jid,
      stickid: stickid,
    },
  });

  if (Msg.length < 1) {
    return await StickBan.create({
      chat: jid,
      stickid: stickid,
    });
  } else {
    return await Msg[0].update({
      chat: jid,
      stickid: stickid,
    });
  }
}

async function deleteStickBan(jid = null, stickid) {
  var Msg = await StickBan.findAll({
    where: {
      chat: jid,
      stickid: stickid,
    },
  });
  if (Msg.length < 1) {
    return false;
  } else {
    return await Msg[0].destroy();
  }
}

module.exports = {
  StickBan: StickBan,
  getStickBan: getStickBan,
  saveStickBan: saveStickBan,
  deleteStickBan: deleteStickBan,
};