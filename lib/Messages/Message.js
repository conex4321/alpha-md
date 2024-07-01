const {
  decodeJid,
  createInteractiveMessage,
  parsedJid,
} = require("../functions");
const Base = require("./Base");
const {
  imageToWebp,
	videoToWebp,
	writeExifImg,
	writeExifVid,
	writeExifWebp
 } = require("../sticker");
const config = require("../../config");
const { getBuffer } = require("../");
const { fromBuffer } = require("file-type")
const ReplyMessage = require("./ReplyMessage");
const fileType = require("file-type");
const util = require("util");
const {
  generateWAMessageFromContent,
  getContentType,
  downloadMediaMessage,
  generateWAMessage,
  WA_DEFAULT_EPHEMERAL,
} = require("baileys");

class Message extends Base {
  constructor(client, data) {
    super(client);
    if (data) this._patch(data);
  }

  _patch(data) {
    this.user = decodeJid(this.client.user.id);
    this.key = data.key;
    this.isGroup = data.isGroup;
    this.prefix = data.prefix;
    this.id = data.key.id;
    this.jid = data.key.remoteJid;
    this.message = { key: data.key, message: data.message };
    this.pushName = data.pushName;
    this.participant = parsedJid(data.sender)[0];
    try {
      this.sudo = config.SUDO.split(",").includes(
        this.participant.split("@")[0]
      );
    } catch {
      this.sudo = false;
    }
    this.text = data.body;
    this.fromMe = data.key.fromMe;
    this.isBaileys = this.id.startsWith("BAE5");
    this.timestamp = data.messageTimestamp.low || data.messageTimestamp;
    const contextInfo = data.message.extendedTextMessage?.contextInfo;
    this.mention = contextInfo?.mentionedJid || false;
    if (data.quoted) {
      if (data.message.buttonsResponseMessage) return;
      this.reply_message = new ReplyMessage(this.client, contextInfo, data);
      const quotedMessage = data.quoted.message.extendedTextMessage;
      this.reply_message.type = data.quoted.type || "extendedTextMessage";
      this.reply_message.mtype = data.quoted.mtype;
      this.reply_message.key = data.quoted.key;
      this.reply_message.mention =
        quotedMessage?.contextInfo?.mentionedJid || false;
    } else {
      this.reply_message = false;
    }

    return super._patch(data);
  }

  async sendReply(text, opt = {}) {
    return this.client.sendMessage(
      this.jid,
      { text },
      { ...opt, quoted: this }
    );
  }

  async log() {
    console.log(this.data);
  }

  async sendpoll(jid, name = '', values = [], selectableCount = 1) {
    return this.client.sendMessage(this.jid, {
      poll: {
        name,
        values,
        selectableCount
      }
    });
  }
  
  async sendFile(content, options = {}) {
    const { data } = await this.client.getFile(content);
    const type = (await fileType.fromBuffer(data)) || {};
    return this.client.sendMessage(
      this.jid,
      { [type.mime.split("/")[0]]: data },
      options
    );
  }

  async edit(msg, key) {
    return await this.client.relayMessage(this.jid, {
      protocolMessage: {
        key: key,
        type: 14,
        editedMessage: {
          conversation: msg
        }
      }
    }, {});
  }

  async reply(text, opt = {}) {
    return this.client.sendMessage(
      this.jid,
      { text, ...opt },
      { quoted: this.message, ...opt }
    );
  }

  async send(jid, text, opt = {}) {
    const recipient = jid.endsWith("@s.whatsapp.net") ? jid : this.jid;
    return this.client.sendMessage(recipient, { text, ...opt });
  }

  async sendMessage(
    jid,
    content,
    opt = { packname: "alpha", author: "c-iph3r" },
    type = "text"
  ) {
    switch (type.toLowerCase()) {
      case "text":
        return this.client.sendMessage(jid, { text: content, ...opt });
      case "image":
      case "photo":
        if (Buffer.isBuffer(content)) {
          return this.client.sendMessage(jid, { image: content, ...opt });
        } else if (isUrl(content)) {
          return this.client.sendMessage(jid, {
            image: { url: content },
            ...opt,
          });
        }
        break;
      case "video":
        if (Buffer.isBuffer(content)) {
          return this.client.sendMessage(jid, { video: content, ...opt });
        } else if (isUrl(content)) {
          return this.client.sendMessage(jid, {
            video: { url: content },
            ...opt,
          });
        }
        break;
      case "audio":
        if (Buffer.isBuffer(content)) {
          return this.client.sendMessage(jid, { audio: content, ...opt });
        } else if (isUrl(content)) {
          return this.client.sendMessage(jid, {
            audio: { url: content },
            ...opt,
          });
        }
        break;
      case "template":
        const optional = await generateWAMessage(jid, content, opt);
        const message = {
          viewOnceMessage: {
            message: {
              ...optional.message,
            },
          },
        };
        await this.client.relayMessage(jid, message, {
          messageId: optional.key.id,
        });
        break;
      case "interactive":
        const genMessage = createInteractiveMessage(content);
        await this.client.relayMessage(jid, genMessage.message, {
          messageId: genMessage.key.id,
        });
        break;
      case "sticker":
        const { data, mime } = await this.client.getFile(content);
        if (mime === "image/webp") {
          const buff = await writeExifWebp(data, opt);
          await this.client.sendMessage(
            jid,
            { sticker: { url: buff }, ...opt },
            opt
          );
        } else {
          const mimePrefix = mime.split("/")[0];
          if (mimePrefix === "video" || mimePrefix === "image") {
            await this.client.sendImageAsSticker(this.jid, content, opt);
          }
        }
        break;
      case "delete":
        return await this.client.sendMessage(this.jid, {
          delete: content.key,
        });
        case "contact":
          const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${content.name}\nORG:${content.org};\nTEL;type=CELL;type=VOICE;waid=${content.whatsapp}:${content.phone}\nEND:VCARD`;
          return await this.client.sendMessage(
            this.jid,
            {
              contacts: {
                displayName: content.name,
                contacts: [{ vcard, ...opt }],
              },
              ephemeralExpiration: WA_DEFAULT_EPHEMERAL,
            },
            { quoted: opt.quoted }
          );
    }
  }

  async save(m) {
		const type = getContentType(m.message);
		const mime = m.message[type].mimetype;
		const buffer = await downloadMediaMessage(m,'buffer', {}, {reuploadRequest: this.updateMediaMessage}
		)
		return {
			buff: buffer,
			type: type.replace('Message', ''),
			mime
		}
	}

  isMediaURL(url) {
		const mediaExtensions = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'webm', 'webp'];
		if (!url.includes('.')) return false;
		const extension = url.split('.').pop().toLowerCase();
		return (mediaExtensions.includes(extension) && url.startsWith('http'))
	}
  
  async sendSticker(jid, content, options = {}) {
    const isBuffer = Buffer.isBuffer(content);
    if (!isBuffer) content = await getBuffer(content);
    const { mime } = await fromBuffer(content);
    if (mime.includes('webp')) {
        return await this.client.sendMessage(jid, {
            sticker: {
                url: await writeExifWebp(content, {
                    packname: options.packname,
                    author: options.author ? options.author : options.packname ? undefined : ' '
                })
            },
            ...options,
            ephemeralExpiration: WA_DEFAULT_EPHEMERAL
        }, {
            quoted: options.quoted
        })
    } else if (mime.includes('image')) {
        if (options.packname || options.author) {
            return await this.client.sendMessage(jid, {
                sticker: {
                    url: await writeExifImg(content, {
                        packname: options.packname,
                        author: options.author
                    })
                },
                ...options,
                ephemeralExpiration: WA_DEFAULT_EPHEMERAL
            }, {
                quoted: options.quoted
            })
        } else {
            return await this.client.sendMessage(jid, {
                sticker: await imageToWebp(content),
                ...options,
                ephemeralExpiration: WA_DEFAULT_EPHEMERAL
            }, {
                quoted: options.quoted
            })
        }
    } else if (mime.includes('video')) {
        if (options.packname || options.author) {
            return await this.client.sendMessage(jid, {
                sticker: {
                    url: await writeExifVid(content, {
                        packname: options.packname,
                        author: options.author
                    })
                },
                ...options,
                ephemeralExpiration: WA_DEFAULT_EPHEMERAL
            }, {
                quoted: options.quoted
            })
        } else {
            return await this.client.sendMessage(jid, {
                sticker: await videoToWebp(content),
                ...options,
                ephemeralExpiration: WA_DEFAULT_EPHEMERAL
            }, {
                quoted: options.quoted
            })
        }
    }
}

async forward(jid, content, options = {}) {
  let externalAdReply, text = false;
  const isBuffer = Buffer.isBuffer(content);
  const isMediaUrl = isBuffer ? false : (typeof content !== "object") ? this.isMediaURL(content.trim()) : false;
  const messageObj = (!isBuffer && !isMediaUrl) ? (content?.message || content?.viewOnceMessage || content?.reply_message?.viewOnceMessage) ? false : ((!content?.mime && !content?.client?.mime && !content?.reply_message?.mime) || content?.client?.mime === 'text') ? true : false : false;

  content = content?.message?.conversation ?
      content.message.conversation :
      content?.message?.extendedTextMessage ?
      content.message.extendedTextMessage.text :
      content?.reply_message?.extendedTextMessage ?
      content.reply_message.extendedTextMessage.text :
      content?.extendedTextMessage ?
      content.extendedTextMessage.text :
      content?.reply_message?.conversation ?
      content.reply_message.conversation :
      content?.conversation ?
      content.conversation :
      content?.message ?
      await this.save(content) :
      (typeof content === 'string') ?
      content :
      isBuffer ?
      content :
      getContentType(content) ?
      await this.save({ message: content }) :
      messageObj ?
      content :
      content?.viewOnceMessage ?
      await this.save(content.viewOnceMessage) :
      content?.reply_message?.viewOnceMessage ?
      await this.save(content.reply_message.viewOnceMessage) :
      content?.reply_message?.msg ?
      await this.save({
          message: {
              [content.reply_message.type]: content.reply_message.msg
          }
      }) :
      (content?.msg && content?.type) ?
      await this.save({
          message: {
              [content.type]: content.msg
          }
      }) :
      await this.save({
          message: content
      });

  if (!isMediaUrl && typeof content === 'string' && (!options.forwardType || options.forwardType === 'text')) text = content;

  if (options.linkPreview) {
      externalAdReply = {
          title: options.linkPreview.title,
          body: options.linkPreview.body,
          renderLargerThumbnail: options.linkPreview.renderLargerThumbnail || false,
          showAdAttribution: options.linkPreview.showAdAttribution,
          mediaType: options.linkPreview.mediaType,
          thumbnailUrl: options.linkPreview.thumbnailUrl,
          previewType: options.linkPreview.previewType,
          containsAutoReply: options.linkPreview.containsAutoReply,
          thumbnail: options.linkPreview.thumbnail,
          mediaUrl: options.linkPreview.mediaUrl || options.linkPreview.mediaurl,
          sourceUrl: options.linkPreview.sourceUrl || options.linkPreview.sourceurl
      };
  }

  const opt = {
      mimetype: (options.mimetype || options.mime),
      jpegThumbnail: options.jpegThumbnail,
      mentions: options.mentions,
      fileName: (options.fileName || options.filename || options.name),
      fileLength: (options.fileLength || options.filesize || options.size),
      caption: options.caption,
      headerType: options.headerType,
      ptt: options.ptt,
      gifPlayback: (options.gifPlayback || options.gif),
      seconds: (options.seconds || options.duration),
      waveform: (options.waveform || options.wave),
      contextInfo: {}
  };

  if (!content?.buff && messageObj && (typeof content !== 'string') && (!options.forwardType || options.forwardType !== 'text')) {
      content = content?.reply_message?.i ? content.reply_message : content;
      const msg = await generateWAMessageFromContent(jid, content, {
          quoted: (options.quoted && options.quoted?.message && options.quoted?.key) ? options.quoted : null
      });
      const keys = Object.keys(msg.message)[0];
      msg.message[keys].contextInfo = msg.message[keys].contextInfo || {};
      if (options.contextInfo?.mentionedJid) msg.message[keys].contextInfo.mentionedJid = Array.isArray(options.contextInfo.mentionedJid) ? options.contextInfo.mentionedJid : [options.contextInfo.mentionedJid];
      if (options.contextInfo?.forwardingScore) msg.message[keys].contextInfo.forwardingScore = options.contextInfo.forwardingScore;
      if (options.contextInfo?.isForwarded) msg.message[keys].contextInfo.isForwarded = options.contextInfo.isForwarded;
      if (externalAdReply) msg.message[keys].contextInfo.externalAdReply = externalAdReply;
      return await this.client.relayMessage(jid, msg.message, {});
  } else if (!text && (!options.forwardType || options.forwardType !== 'text')) {
      let buff = content,
          mimetype = false,
          model = false;
      if (!isBuffer && typeof content === 'object') {
          buff = content.buff;
          mimetype = content.mime;
          model = content.type;
      } else if (isMediaUrl) {
          buff = await getBuffer(buff.trim());
      } else if (!isBuffer) {
          buff = {
              url: buff.trim()
          };
      }
      let mime = Buffer.isBuffer(buff) ? await (await require("file-type").fromBuffer(buff)).mime : opt.mimetype ? opt.mimetype : undefined;
      let type = (mime && mime.split('/')[1]) === 'webp' ? 'sticker' : (mime && mime.split('/')[0]) === 'video' ? 'video' : (mime && mime.split('/')[0]) === 'audio' ? 'audio' : 'image';
      type = (options.forwardType || model || type).toLowerCase().trim();
      if (type === "sticker") {
          opt.quoted = (options.quoted && options.quoted?.message && options.quoted?.key) ? options.quoted : null;
          if (options.contextInfo?.mentionedJid) opt.contextInfo.mentionedJid = Array.isArray(options.contextInfo.mentionedJid) ? options.contextInfo.mentionedJid : [options.contextInfo.mentionedJid];
          if (options.contextInfo?.forwardingScore) opt.contextInfo.forwardingScore = options.contextInfo.forwardingScore;
          if (options.contextInfo?.isForwarded) opt.contextInfo.isForwarded = options.contextInfo.isForwarded;
          if (externalAdReply) opt.contextInfo.externalAdReply = externalAdReply;
          return await this.sendSticker(jid, buff, {
              packname: options.packname,
              author: options.author,
              ...opt
          });
      } else {
          const option = {
              contextInfo: {}
          };
          for (let key in opt) {
              if (opt[key] !== undefined) {
                  if (!Array.isArray(opt[key]) || !opt[key].includes(undefined)) {
                      option[key] = opt[key];
                  }
              }
              if (opt.seconds) option.seconds = [opt.seconds];
              if (opt.waveform) option.waveform = opt.waveform;
          }
          if ((type === 'audio') && option.waveform) {
              option.mimetype = "audio/ogg; codecs=opus";
              option.ptt = false;
          }
          if (!option.mimetype) option.mimetype = mimetype || mime;
          if (options.contextInfo?.mentionedJid) option.contextInfo.mentionedJid = Array.isArray(options.contextInfo.mentionedJid) ? options.contextInfo.mentionedJid : [options.contextInfo.mentionedJid];
          if (options.contextInfo?.forwardingScore) option.contextInfo.forwardingScore = options.contextInfo.forwardingScore;
          if (options.contextInfo?.isForwarded) option.contextInfo.isForwarded = options.contextInfo.isForwarded;
          if (externalAdReply) option.contextInfo.externalAdReply = externalAdReply;
          return await this.client.sendMessage(jid, {
              [type]: buff,
              ...option,
              ephemeralExpiration: WA_DEFAULT_EPHEMERAL
          }, {
              quoted: (options.quoted && options.quoted?.message && options.quoted?.key) ? options.quoted : null
          });
      }
  } else {
      if (options.linkPreview) opt.contextInfo.externalAdReply = externalAdReply;
      if (opt.contextInfo.externalAdReply && Object.keys(opt.contextInfo.externalAdReply).length !== 0) {
          opt.contextInfo.externalAdReply.previewType = "PHOTO";
          opt.contextInfo.externalAdReply.containsAutoReply = true;
      }
      return await this.client.sendMessage(jid, {
          text: util.format(content),
          ...opt,
          ephemeralExpiration: WA_DEFAULT_EPHEMERAL
      }, {
          quoted: (options.quoted && options.quoted?.message && options.quoted?.key) ? options.quoted : null
      });
  }  
}

  async PresenceUpdate(status) {
    await this.client.sendPresenceUpdate(status, this.jid);
  }

  async delete(key) {
    await this.client.sendMessage(this.jid, { delete: key });
  }

  async updateName(name) {
    await this.client.updateProfileName(name);
  }

  async getPP(jid) {
    return await this.client.profilePictureUrl(jid, "image");
  }

  async setPP(jid, pp) {
    const profilePicture = Buffer.isBuffer(pp) ? pp : { url: pp };
    await this.client.updateProfilePicture(jid, profilePicture);
  }

  async block(jid) {
    await this.client.updateBlockStatus(jid, "block");
  }

  async unblock(jid) {
    await this.client.updateBlockStatus(jid, "unblock");
  }

  async add(jid) {
    return await this.client.groupParticipantsUpdate(this.jid, jid, "add");
  }

  async kick(jid) {
    return await this.client.groupParticipantsUpdate(this.jid, jid, "remove");
  }

  async promote(jid) {
    return await this.client.groupParticipantsUpdate(this.jid, jid, "promote");
  }

  async demote(jid) {
    return await this.client.groupParticipantsUpdate(this.jid, jid, "demote");
  }
  
  async  react(jid, imog = "", key) {
    return await this.sendMessage(jid, {
      react: {
        text: imog,
        key: key,
      },
    });
  }
}



module.exports = Message;
