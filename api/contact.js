const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

// FORCE LOAD ENV
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

console.log('--- INI VERSI MONGODB TERBARU ---');

// Schema
const Message = mongoose.model('Message', new mongoose.Schema({
    name: String,
    email: String,
    message: String,
    date: { type: String, default: () => new Date().toLocaleString("id-ID") }
}));

// Route
app.post(['/', '/api/contact'], async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ success: false, message: 'MongoDB Belum Konek! Tunggu sebentar.' });
    }

    try {
        const { name, email, message } = req.body;
        const msg = new Message({ name, email, message });
        await msg.save();

        // Email notify
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });
        transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_RECEIVER || 'rismaamaliaputri366@gmail.com',
            subject: `Pesan Portofolio: ${name}`,
            text: `Nama: ${name}\nEmail: ${email}\nPesan: ${message}`
        }).catch(e => console.log('Email Error (abaikan jika DB sukses):', e.message));

        res.status(201).json({ success: true, message: 'BERHASIL! Pesan tersimpan di MongoDB.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Connection Logic
const connectDB = () => {
    mongoose.connect('mongodb://127.0.0.1:27017/portofolio', {
        serverSelectionTimeoutMS: 5000,
    }).then(() => {
        console.log('✅ DATABASE TERKONEKSI: Risma, MONGODB kamu sudah siap!');
    }).catch(err => {
        console.error('❌ Gagal konek ke MongoDB:', err.message);
        setTimeout(connectDB, 5000);
    });
};

connectDB();

app.listen(PORT, () => {
    console.log(`🚀 Server Risma Jalan di http://localhost:${PORT}`);
});
