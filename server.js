const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/portofolio';

// Fungsi untuk koneksi database
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    try {
        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 10000
        });
        console.log('✅ MongoDB Terkoneksi!');
    } catch (err) {
        console.error('❌ MongoDB Gagal Konek:', err.message);
    }
};

// Database Schema
const Message = mongoose.model('Message', new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    date: { type: Date, default: Date.now }
}));

// API Endpoint
app.post('/api/contact', async (req, res) => {
    try {
        await connectDB();

        const { name, email, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Harap isi semua kolom!' });
        }

        // 1. Simpan ke Database
        const newMessage = new Message({ name, email, message });
        await newMessage.save();
        console.log(`✅ Pesan dari ${name} disimpan.`);

        // 2. Kirim Email
        const cleanPass = (process.env.EMAIL_PASS || '').replace(/\s/g, '');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: cleanPass
            }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_RECEIVER || 'rismaamaliaputri366@gmail.com',
            subject: `Pesan Baru Portofolio: ${name}`,
            text: `Nama: ${name}\nEmail: ${email}\nPesan: ${message}`
        });

        res.status(200).json({ success: true, message: 'Pesan berhasil dikirim!' });
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ success: false, message: 'Gagal mengirim pesan: ' + error.message });
    }
});

// Export untuk Vercel
module.exports = app;

// Jalankan Server (Lokal)
if (require.main === module) {
    app.listen(PORT, () => console.log(`🚀 Server jalan di http://localhost:${PORT}`));
}
