const cron = require("node-cron");
const ScheduleDB = require("./database/schedule");
const { config, errorHandler , sleep } = require("../lib");


const jobFunctions = {
  muteGroup: async (message, jid, scheduleId) => {
    try {
      await message.client.groupSettingUpdate(jid, "announcement");
      await sleep(250);
      await message.sendMessage(jid, "_muted group_\n> automated System.");
      await scheduleModule.deleteSchedule(scheduleId);
    } catch (error) {
      errorHandler(message, error);
    }
  },
  unmuteGroup: async (message, jid, scheduleId) => {
    try {
      await message.client.groupSettingUpdate(jid, "not_announcement");
      await sleep(250);
      await message.sendMessage(jid, "_unmuted group_\n> automated System.");
      await scheduleModule.deleteSchedule(scheduleId);
    } catch (error) {
      errorHandler(message, error);
    }
  },
};

const scheduleModule = {
  scheduleCron: async (timeString, jobFunction, ...args) => {
    try {
      let [hours, minutes] = timeString.split(":");
      let cronJob = cron.schedule(`${minutes} ${hours} * * *`, async () => {
        await jobFunction(...args);
        cronJob.stop();
      }, {
        scheduled: false,
        timezone: config.TZ,
      });
      cronJob.start();
      return cronJob;
    } catch (error) {
      throw error;
    }
  },

  generateId: async () => {
    const minId = 100000;
    const maxId = 999999;
    let id;
    let exists;

    do {
      id = Math.floor(Math.random() * (maxId - minId + 1)) + minId;
      exists = await ScheduleDB.findOne({ where: { id } });
    } while (exists);

    return id;
  },

  saveSchedule: async (chatId, timeString, jobFunctionName) => {
    try {
      const id = await scheduleModule.generateId();
      const schedule = await ScheduleDB.create({
        id,
        chatId,
        time: timeString,
        jobFunction: jobFunctionName,
      });
      return schedule.id;
    } catch (error) {
      throw error;
    }
  },

  getSchedule: async (chatId) => {
    try {
      return await ScheduleDB.findAll({
        where: { chatId },
      });
    } catch (error) {
      throw error;
    }
  },

  deleteSchedule: async (scheduleId) => {
    try {
      await ScheduleDB.destroy({
        where: { id: scheduleId },
      });
    } catch (error) {
      throw error;
    }
  },

  startSchedule: async (message, chatId = "all") => {
    try {
      const schedulesToStart =
        chatId === "all"
          ? await ScheduleDB.findAll()
          : await ScheduleDB.findAll({ where: { chatId } });

      for (let schedule of schedulesToStart) {
        const jobFunction = jobFunctions[schedule.jobFunction];
        if (jobFunction) {
          await scheduleModule.scheduleCron(
            schedule.time,
            jobFunction,
            message,
            schedule.chatId,
            schedule.id
          );
        }
      }
    } catch (error) {
      throw error;
    }
  },

  initializeSchedules: async (message) => {
    try {
      const schedules = await ScheduleDB.findAll();
      for (let schedule of schedules) {
        const jobFunction = jobFunctions[schedule.jobFunction];
        if (jobFunction) {
          await scheduleModule.scheduleCron(
            schedule.time,
            jobFunction,
            message,
            schedule.chatId,
            schedule.id
          );
        }
      }
    } catch (error) {
      throw error;
    }
  }
};

//scheduleModule.initializeSchedules();

module.exports = scheduleModule;
