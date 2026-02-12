const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Skema Pesan
const Message = mongoose.model('Message', new mongoose.Schema({
    name: String,
    email: String,
    message: String,
    date: { type: String, default: () => new Date().toLocaleString("id-ID") }
}));

// Fungsi Kirim Email (Pisah agar tidak ganggu DB)
async function notifyEmail(name, email, message) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_RECEIVER || 'rismaamaliaputri366@gmail.com',
            subject: `Pesan Portofolio dari ${name}`,
            text: `Nama: ${name}\nEmail: ${email}\nPesan: ${message}`
        });
        console.log('📧 Email terkirim!');
    } catch (e) {
        console.warn('⚠️ Gagal kirim email:', e.message);
    }
}

app.post(['/', '/api/contact'], async (req, res) => {
    // PROTEKSI: Cek koneksi SEBELUM simpan
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            success: false,
            message: 'DATABASE BELUM SIAP. Klik "Send" lagi dalam 3 detik atau cek apakah MongoDB sudah jalan di laptop kamu.'
        });
    }

    try {
        const { name, email, message } = req.body;
        const msg = new Message({ name, email, message });
        await msg.save();

        console.log('✅ Pesan masuk ke MongoDB!');
        notifyEmail(name, email, message); // Jalankan di background

        res.status(201).json({ success: true, message: 'Berhasil! Pesan sudah tersimpan.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal simpan: ' + err.message });
    }
});

// KONEKSI AGRESIF
const connectWithRetry = () => {
    console.log('📡 Sedang berjuang konek ke MongoDB...');
    // Coba pake localhost tanpa DNS (127.0.0.1)
    mongoose.connect('mongodb://127.0.0.1:27017/portofolio', {
        serverSelectionTimeoutMS: 5000,
    }).then(() => {
        console.log('🎉 AKHIRNYA KONEK! MongoDB sudah siap, Risma!');
    }).catch(err => {
        console.error('❌ Masih gagal konek:', err.message);
        console.log('🔄 Mencoba lagi dalam 5 detik...');
        setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

app.listen(PORT, () => {
    console.log(`🚀 Server Portfolio jalan di http://localhost:${PORT}`);
});
