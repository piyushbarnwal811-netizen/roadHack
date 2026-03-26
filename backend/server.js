const express = require("express");
const cors = require("cors");
const twilio = require("twilio");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

function normalizeNumber(number) {
  const cleaned = String(number).replace(/\D/g, "");
  if (!cleaned) return null;
  return cleaned.startsWith("91") ? `+${cleaned}` : `+91${cleaned}`;
}

function buildMessage(lat, lon, customMessage, photoUrl) {
  let msg = customMessage && customMessage.trim()
    ? customMessage.trim()
    : "Emergency! I may be in danger or had an accident.";
  if (lat && lon) {
    msg += `\nLocation: https://www.google.com/maps?q=${lat},${lon}`;
  }
  if (photoUrl) {
    msg += `\nPhoto: ${photoUrl}`;
  }
  return msg;
}

app.get("/", (req, res) => {
  res.json({ success: true, message: "RoadSOS backend running" });
});

app.post("/send-sos", upload.single("photo"), async (req, res) => {
  try {
    let { contacts, lat, lon, message } = req.body;

    if (!contacts) {
      return res.status(400).json({ success: false, error: "Contacts are required" });
    }

    if (typeof contacts === "string") {
      contacts = contacts.split(",").map(n => n.trim()).filter(Boolean);
    }

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ success: false, error: "Valid contacts are required" });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const photoUrl = req.file ? `${baseUrl}/uploads/${req.file.filename}` : "";
    const finalMessage = buildMessage(lat, lon, message, photoUrl);

    const results = [];

    for (const rawNumber of contacts) {
      const phone = normalizeNumber(rawNumber);

      if (!phone) {
        results.push({
          number: rawNumber,
          sms: { success: false, error: "Invalid number" },
          whatsapp: { success: false, error: "Invalid number" }
        });
        continue;
      }

      let smsResult = { success: false };
      let whatsappResult = { success: false };

      try {
        const sms = await client.messages.create({
          body: finalMessage,
          from: process.env.TWILIO_SMS_NUMBER,
          to: phone
        });
        smsResult = { success: true, sid: sms.sid };
      } catch (error) {
        smsResult = { success: false, error: error.message };
      }

      try {
        const whatsapp = await client.messages.create({
          body: finalMessage,
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          to: `whatsapp:${phone}`
        });
        whatsappResult = { success: true, sid: whatsapp.sid };
      } catch (error) {
        whatsappResult = { success: false, error: error.message };
      }

      results.push({
        number: phone,
        sms: smsResult,
        whatsapp: whatsappResult
      });
    }

    res.json({
      success: true,
      message: "SOS processed",
      photoUrl,
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});