const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Online (Atlas) Connection
const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
    console.error('❌ ERROR: MONGODB_URI tidak ditemukan di .env!');
}

mongoose.connect(mongoURI)
    .then(() => console.log('✅ DATABASE ATLAS ONLINE TERKONEKSI!'))
    .catch(err => console.error('❌ Gagal konek ke Atlas:', err.message));

// Schema
const Message = mongoose.model('Message', new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    date: { type: Date, default: Date.now }
}));

// Route Utama
app.post(['/', '/api/contact'], async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Semua kolom harus diisi.' });
        }

        // 1. Simpan ke Atlas
        const newMessage = new Message({ name, email, message });
        await newMessage.save();
        console.log(`✅ Pesan dari ${name} berhasil disimpan di MongoDB Atlas.`);

        // 2. Email Notifikasi (Background)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_RECEIVER || 'rismaamaliaputri366@gmail.com',
            subject: `Portfolio Message from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
        };

        transporter.sendMail(mailOptions).catch(err => console.error('⚠️ Email Error:', err.message));

        res.status(200).json({ success: true, message: 'Pesan Terkirim ke Database Online!' });
    } catch (error) {
        console.error('❌ Error API:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Export untuk Vercel
module.exports = app;

// Jalankan jika di localhost
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}
