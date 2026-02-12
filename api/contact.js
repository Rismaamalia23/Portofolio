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
        return res.status(503).json({
            success: false,
            message: 'MongoDB Belum Konek! Sabar Risma, laptop kamu lagi usaha nyambungin...'
        });
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
        }).catch(e => console.log('Email Gagal (DB Sukses):', e.message));

        res.status(201).json({ success: true, message: 'AKHIRNYA JADI! Pesan masuk ke MongoDB.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// KONEKSI CERDAS: Coba localhost dulu, kalo gagal coba 127.0.0.1
const connectDB = async () => {
    const uris = [
        'mongodb://localhost:27017/portofolio',
        'mongodb://127.0.0.1:27017/portofolio'
    ];

    for (let uri of uris) {
        try {
            console.log(`📡 Mencoba konek ke: ${uri}...`);
            await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
            console.log('✅ BERHASIL! MongoDB kamu sudah terhubung sekarang Risma!');
            return;
        } catch (err) {
            console.log(`❌ Gagal pake ${uri}`);
        }
    }

    console.log('🔄 Belum dapet nih, nyoba lagi dalam 5 detik...');
    setTimeout(connectDB, 5000);
};

connectDB();

app.listen(PORT, () => {
    console.log(`🚀 Server on http://localhost:${PORT}`);
});
