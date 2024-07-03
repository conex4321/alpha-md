const { alpha, isAdmin, parsedJid, isPrivate, getBuffer } = require("../lib");
const { delay } = require("baileys");
const  GroupDBB  = require('../lib/database/snapshot')
const axios = require("axios");









async function getUserProfilePicture(message, user) {
  try {
     return await message.client.profilePictureUrl(user, "image");
  }
  catch {
     return "false";
  }
}

function formatDate(inputDate) {
  // Parse the input date string
  const date = new Date(inputDate);

  // Extract date components
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are zero-based
  const day = String(date.getUTCDate()).padStart(2, '0');

  // Extract time components
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  // Construct the formatted date string
  const formattedDate = `${day}/${month}/${year}`;

  return formattedDate;
}


alpha({
     pattern: "snapshot",
     fromMe: isPrivate,
     desc: "Save a snapshot of the Group setings",
  },
  async (message, match) => {
   console.log("'"+match+"'")
     const {
        key
     } = await message.reply("_Procesing that request!_");
     let isyouadmin = await isAdmin(message.jid, message.key.participant, message.client);
     if (!isyouadmin) return;
     const ismeadmin = await isAdmin(message.jid, message.user, message.client);
     if (!ismeadmin) return await message.client.sendMessage(message.jid, { text: "_I'm not admin_", edit: key });

     const SnapShots = await GroupDBB.getSnapshot(message.jid);

     try {
        if (match === " new") {
           return await saveNewData()
        }
        else if (match === " restore") {
           return await RestoreData()
        }
        else if (match === " -help") {
           return await message.client.sendMessage(message.jid, {
              text: `*Info*\nThis command will Save the current Metadata To database.
*Tags*
- New : makes new Snapshot
- restore : Restores the Saved Snapshot (Group name, Description, Profile Pic)
- restore full : Restores the Group including admins and members.
- -help : Shows the information of this command`,
              edit: key
           });
        } else {
           //============================================================================================================================================================
           //========================== Get values ==========================

           if (SnapShots) {

              let cal = await extract()
              const {
                 ProfilePic,
                 createdAt,
                 subject,
                 size,
                 desc,
                 restrict,
                 announce,
                 participants
              } = cal;
              const participantsArray = participants;

              var adminList = [];
              var participantList = [];
              var n = 1
              // Loop through the data
              for (var i = 0; i < participantsArray.length; i++) {
                 var entry = participantsArray[i];
                 if (entry.admin === 'admin') {
                    adminList.push(`      •` + entry.id.split("@")[0]);
                 }
                 else {
                    participantList.push(`      •` + entry.id.split("@")[0]);
                 }
              }

              var adminListz = adminList.join("\n");

              let pfpp;
              if (ProfilePic) {
                 pfpp = "[Saved]"
              }
              else {
                 pfpp = "[No Profile Pic]"
              }


              let texax = `You Already have a snapshot of this Group from:\n ${ await formatDate(createdAt)}\n\n
Saved Values:
- ProfilePic: ${pfpp}
- Subjest: ${subject}
- Restricted: ${restrict}
- Anounce: ${announce}
- Size: ${size}
- Admins: \n${adminListz}
- Description: ${desc}`
              const jid = parsedJid(texax);

              return await message.client.sendMessage(message.jid, {
                 text: texax,
                 edit: key
              },{
               mentions: [jid],
             });

           }
           //====================================================================
           //============================================================================================================================================================
           if (!SnapShots) {
              saveNewData()
           }
        }

        async function extract() {
           try {
              var groupSnapshot = SnapShots[0];
              const {
                 chat,
                 ProfilePic,
                 metaData,
                 createdAt
              } = groupSnapshot.dataValues;
              const parsedMetaData = JSON.parse(metaData);
              const {
                 id,
                 subject,
                 subjectOwner,
                 subjectTime,
                 size,
                 creation,
                 owner,
                 desc,
                 descId,
                 linkedParent,
                 restrict,
                 announce,
                 isCommunity,
                 isCommunityAnnounce,
                 joinApprovalMode,
                 memberAddMode,
                 participants
              } = parsedMetaData;
              const participantsArray = parsedMetaData.participants;
              const jsonResponse = {
                 chat,
                 ProfilePic,
                 id,
                 subject,
                 subjectOwner,
                 subjectTime,
                 size,
                 creation,
                 owner,
                 desc,
                 descId,
                 linkedParent,
                 restrict,
                 announce,
                 isCommunity,
                 isCommunityAnnounce,
                 joinApprovalMode,
                 memberAddMode,
                 participants: participantsArray,
                 createdAt
              };
              return jsonResponse;
           }
           catch (err) {
              console.log("[Snap Save Error]:" + err);
              return JSON.stringify({
                 error: err.message
              });
           }
        }

        async function RestoreData() {
           try {
              let {
                 chat,
                 ProfilePic,
                 id,
                 subject,
                 subjectOwner,
                 subjectTime,
                 size,
                 creation,
                 owner,
                 desc,
                 descId,
                 linkedParent,
                 restrict,
                 announce,
                 isCommunity,
                 isCommunityAnnounce,
                 joinApprovalMode,
                 memberAddMode,
                 participants,
                 createdAt
              } = await extract()
              delay(1000)
              if (ProfilePic === "false") {
                 message.client.removeProfilePicture(chat);
                 await message.client.sendMessage(message.jid, {
                    text: `Profile picture Restored!`,
                    edit: key
                 });
              }
              else {
                 let buff = await getBuffer(ProfilePic)

                 message.setPP(chat, buff);
                 await message.client.sendMessage(message.jid, {
                    text: `Profile picture Restored!`,
                    edit: key
                 });
              }
              delay(1000)
              message.client.groupUpdateSubject(chat, subject)
              await message.client.sendMessage(message.jid, {
                 text: `Group Name Restored!`,
                 edit: key
              });
              delay(1000)
              message.client.groupUpdateDescription(chat, desc)
              await message.client.sendMessage(message.jid, {
                 text: `Group Description Restored!`,
                 edit: key
              });
              delay(1000)
              let announcement;
              if (announce === true) {
                 announcement = "announcement"
              }
              else {
                 announcement = "not_announcement"
              }
              message.client.groupSettingUpdate(chat, announcement)
              await message.client.sendMessage(message.jid, {
                 text: `Group Announcement settings Restored!`,
                 edit: key
              });
              delay(1000)
              let lock;
              if (restrict === true) {
                 lock = "unlocked"
              }
              else {
                 lock = "locked"
              }
              message.client.groupSettingUpdate(chat, lock)
              await message.client.sendMessage(message.jid, {
                 text: `Group Editing settings Restored!`,
                 edit: key
              });
              delay(2000)
              return await message.client.sendMessage(message.jid, {
                 text: `Group Restored!`,
                 edit: key
              });

           }
           catch (err) {
              console.log("[Snap Save Error]:" + err);
              return JSON.stringify({
                 error: err.message
              });
           }
        }


        async function saveNewData() {
           try {
              const MetaData = await message.client.groupMetadata(message.jid);
              const pp = await getUserProfilePicture(message, message.jid);

              const ppfile = await getBuffer(pp)
              const response = await axios.post("http://paste.c-net.org/", ppfile, {
               headers: { "Content-Type": "image/jpeg" },
            });

              let metaData = JSON.stringify(MetaData);
              let res = await GroupDBB.setSnapshot(message.jid, response, metaData)
              if (!res) return
              let pfpp;
              if (pp === "false") {
                 pfpp = "[NO PROFILE PIC]"
              }
              else {
                 pfpp = "[SAVED]"
              }
              return await message.client.sendMessage(message.jid, {
                 text: `New data saved!\n
Saved:
- Picture: ${pfpp}
- MetaData: [Metadata]`,
                 edit: key
              });
           }
           catch (err) {
              console.log("[Snap Save Error]:" + err)
           }

        }


     }
     catch (error) {
        console.error(error);
        return message.reply("_Error activating Bot Banning!_");
     }


  });

