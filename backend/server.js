
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
}
if (!fs.existsSync("data")) {
    fs.mkdirSync("data");
}
if (!fs.existsSync("data/sos.json")) {
    fs.writeFileSync("data/sos.json", JSON.stringify([]));
}


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + ".png");
    }
});

const upload = multer({ storage: storage });



app.get("/", (req, res) => {
    res.send("🚀 SOS Backend Running Successfully");
});



app.get("/all-sos", (req, res) => {
    try {
        const data = fs.readFileSync("data/sos.json");
        res.json(JSON.parse(data));
    } catch (err) {
        res.status(500).json({ error: "Error reading data" });
    }
});



app.post("/send-sos", upload.single("photo"), (req, res) => {
    try {
        let { contacts, lat, lon } = req.body;

        if (!contacts || !lat || !lon) {
            return res.status(400).json({
                success: false,
                message: "Missing data"
            });
        }

        let sosData = {
            id: Date.now(),
            contacts: contacts.split(","),
            location: {
                latitude: lat,
                longitude: lon
            },
            photo: req.file ? req.file.path : null,
            time: new Date().toLocaleString()
        };

       
        let existingData = JSON.parse(fs.readFileSync("data/sos.json"));
        existingData.push(sosData);
        fs.writeFileSync("data/sos.json", JSON.stringify(existingData, null, 2));

        console.log("🚨 SOS RECEIVED:", sosData);

        res.json({
            success: true,
            message: "SOS stored successfully",
            data: sosData
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});



app.delete("/delete/:id", (req, res) => {
    try {
        let id = parseInt(req.params.id);

        let data = JSON.parse(fs.readFileSync("data/sos.json"));
        let newData = data.filter(item => item.id !== id);

        fs.writeFileSync("data/sos.json", JSON.stringify(newData, null, 2));

        res.json({
            success: true,
            message: "Deleted successfully"
        });

    } catch (err) {
        res.status(500).json({ error: "Delete failed" });
    }
});



app.listen(PORT, () => {
    console.log(`🔥 Server running at http://localhost:${PORT}`);
});