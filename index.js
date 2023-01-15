const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  delay,
} = require("@adiwajshing/baileys");
const logger = require("pino")({ level: "silent" });
const { Boom } = require("@hapi/boom");

async function run() {
  const { state, saveCreds } = await useMultiFileAuthState("sessions");
  const client = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger,
  });

  //   connection
  client.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      if (
        new Boom(lastDisconnect.error).output?.statusCode ===
        DisconnectReason.loggedOut
      ) {
        client.logout();
        console.log("Logged out...");
      } else {
        run();
      }
    } else {
      console.log("BOT Running...");
    }
  });
  //   save creds
  client.ev.on("creds.update", saveCreds);

  //   message
  client.ev.on("messages.upsert", async (msg) => {
    try {
      if (!msg.messages) return;
      const m = msg.messages[0];
      if (m.key.fromMe) return;
      var from = m.key.remoteJid;
      let type = Object.keys(m.message)[0];
      const body =
        type === "conversation"
          ? m.message.conversation
          : type == "imageMessage"
          ? m.message.imageMessage.caption
          : type == "videoMessage"
          ? m.message.videoMessage.caption
          : type == "extendedTextMessage"
          ? m.message.extendedTextMessage.text
          : type == "buttonsResponseMessage"
          ? m.message.buttonsResponseMessage.selectedButtonId
          : type == "listResponseMessage"
          ? m.message.listResponseMessage.singleSelectReply.selectedRowId
          : type == "templateButtonReplyMessage"
          ? m.message.templateButtonReplyMessage.selectedId
          : type === "messageContextInfo"
          ? m.message.listResponseMessage.singleSelectReply.selectedRowId ||
            m.message.buttonsResponseMessage.selectedButtonId ||
            m.text
          : "";
      global.reply = async (text) => {
        await client.sendPresenceUpdate("composing", from);
        return client.sendMessage(from, { text }, { quoted: m });
      };

      //   auto reply
      if (body) {
        const openAi = require("./lib/openai.js");
        if (apiKey == "SET_TOKEN_HERE")
          return reply(`Harap set token dahulu pada folder:\n*src/config.js*`);
        try {
          const result = await openAi(body);
          await delay(2000);
          await reply(result.hasil);
        } catch (e) {
          console.log(e);
          await reply("Ups.. ada yang error nih :(");
        }
      }
    } catch (error) {
      console.log(error);
    }
  });
}

// running bot
try {
  run();
} catch (e) {
  console.log(e);
}
