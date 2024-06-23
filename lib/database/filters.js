const config = require("../../config");
const { DataTypes } = require("sequelize");

const GroupFiltersDB = config.DATABASE.define("group_filters", {
  chat: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  pattern: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  regex: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  }
});

const PersonalFiltersDB = config.DATABASE.define("personal_filters", {
  pattern: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  regex: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  }
});

async function getFilters(type, jid = null, filter = null) {
  let filters;
  if (type === 'group') {
    const whereClause = { chat: jid };
    if (filter !== null) {
      whereClause.pattern = filter;
    }
    filters = await GroupFiltersDB.findAll({
      where: whereClause,
    });
  } else if (type === 'pm') {
    const whereClause = {};
    if (filter !== null) {
      whereClause.pattern = filter;
    }
    filters = await PersonalFiltersDB.findAll({
      where: whereClause,
    });
  } else {
    throw new Error('Invalid filter type');
  }

  return filters.length > 0 ? filters : false;
}

async function setFilter(type, jid = null, filter = null, tex = null, regx = false) {
  if (type === 'group') {
    return await GroupFiltersDB.create({
      chat: jid,
      pattern: filter,
      text: tex.toLowerCase(),
      regex: regx,
    });
  } else if (type === 'pm') {
    return await PersonalFiltersDB.create({
      pattern: filter,
      text: tex,
      regex: regx,
    });
  } else {
    throw new Error('Invalid filter type');
  }
}

async function deleteFilter(type, jid = null, filter) {
  let whereClause;
  if (type === 'group') {
    whereClause = {
      chat: jid,
      pattern: filter,
    };
  } else if (type === 'pm') {
    whereClause = {
      pattern: filter,
    };
  } else {
    throw new Error('Invalid filter type');
  }

  const existingFilter = await (type === 'group' ? GroupFiltersDB : PersonalFiltersDB).findOne({
    where: whereClause,
  });

  if (!existingFilter) {
    return false;
  } else {
    return await existingFilter.destroy();
  }
}

module.exports = {
  getFilters,
  setFilter,
  deleteFilter,
};