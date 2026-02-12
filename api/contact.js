const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

// Load environment variables dari folder utama
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Hubungkan ke MongoDB Compass (Lokal)
const mongoURI = 'mongodb://127.0.0.1:27017/portofolio';

mongoose.connect(mongoURI)
    .then(() => console.log('✅ DATABASE TERKONEKSI: MongoDB Compass Siap!'))
    .catch(err => console.error('❌ GAGAL KONEK MONGODB:', err.message));

// Schema
const Message = mongoose.model('Message', new mongoose.Schema({
    name: String,
    email: String,
    message: String,
    date: { type: Date, default: Date.now }
}));

// Route Simpan & Kirim Email
app.post(['/', '/api/contact'], async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Harap isi semua kolom!' });
        }

        // 1. Simpan ke MongoDB Compass
        const newMessage = new Message({ name, email, message });
        await newMessage.save();
        console.log(`✅ Pesan dari ${name} masuk ke Compass!`);

        // 2. Kirim Notifikasi ke Email Risma
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_RECEIVER,
            subject: `Pesan Baru Portofolio: ${name}`,
            text: `Halo Risma,\n\nAda pesan baru masuk:\nNama: ${name}\nEmail: ${email}\nPesan: ${message}`
        };

        // Kirim email di background
        transporter.sendMail(mailOptions, (err) => {
            if (err) console.log('⚠️ Email error:', err.message);
            else console.log('📧 Email notifikasi sudah dikirim ke Risma!');
        });

        res.status(200).json({ success: true, message: 'Berhasil! Pesan tersimpan di Compass dan terkirim ke Email.' });
    } catch (error) {
        console.error('❌ Error API:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server Risma Jalan di http://localhost:${PORT}`);
});
