const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// Skema
const Message = mongoose.model('Message', new mongoose.Schema({
    name: String, email: String, message: String,
    date: { type: Date, default: Date.now }
}));

// Fungsi Koneksi
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000
        });
        console.log('✅ Connected to MongoDB Atlas');
    } catch (err) {
        console.error('❌ DB Connection Error:', err.message);
        throw err;
    }
};

app.post('/api/contact', async (req, res) => {
    try {
        // Pastikan URI ada
        if (!process.env.MONGODB_URI) {
            return res.status(500).json({ success: false, message: "Server Error: MONGODB_URI is missing in Vercel settings." });
        }

        await connectDB();

        const { name, email, message } = req.body;
        await new Message({ name, email, message }).save();

        // Email
        const cleanPass = (process.env.EMAIL_PASS || '').replace(/\s/g, '');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: cleanPass }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_RECEIVER || 'rismaamaliaputri366@gmail.com',
            subject: `Pesan Portofolio: ${name}`,
            text: `Nama: ${name}\nEmail: ${email}\nPesan: ${message}`
        });

        res.status(200).json({ success: true, message: '🎉 BERHASIL! Pesan terkirim dan tersimpan.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error: " + error.message });
    }
});

module.exports = app;
