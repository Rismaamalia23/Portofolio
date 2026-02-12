const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

// Load environment variables from .env in the root directory
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/portofolio';
mongoose.connect(mongoURI, {
    serverSelectionTimeoutMS: 5000 // Batasi waktu tunggu koneksi
})
    .then(() => console.log('✅ MongoDB Connected to portofolio database'))
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err.message);
        // Jangan biarkan server crash, tapi tampilkan error saat request masuk
    });

// Schema
const MessageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    date: { type: String, default: () => new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) }
});

const Message = mongoose.model('Message', MessageSchema);

// Nodemailer Config
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Gunakan App Password Gmail
    }
});

// Routes
app.post(['/', '/api/contact'], async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Semua kolom harus diisi.' });
        }

        // 1. Simpan ke MongoDB
        const newMessage = new Message({ name, email, message });
        await newMessage.save();
        console.log('✅ Pesan tersimpan di MongoDB');

        // 2. Kirim Email Notifikasi
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_RECEIVER || 'rismaamaliaputri366@gmail.com',
                subject: `Pesan Baru Portofolio: ${name}`,
                text: `Anda menerima pesan baru dari website portofolio.\n\n` +
                    `Nama: ${name}\n` +
                    `Email: ${email}\n` +
                    `Pesan: ${message}`
            };

            await transporter.sendMail(mailOptions);
            console.log('📧 Email notifikasi terkirim');
        } catch (mailError) {
            console.warn('⚠️ Email gagal dikirim (Cek App Password):', mailError.message);
        }

        res.status(201).json({ success: true, message: 'Berhasil! Pesan tersimpan dan terkirim ke email.' });
    } catch (error) {
        console.error('❌ Error handling request:', error);
        res.status(500).json({
            success: false,
            message: `Gagal menyimpan pesan: ${error.message}`
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
