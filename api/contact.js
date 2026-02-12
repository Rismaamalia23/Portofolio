const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// DISABLE BUFFERING - Langsung error kalo ga konek
mongoose.set('bufferCommands', false);

const mongoURI = 'mongodb://127.0.0.1:27017/portofolio';

console.log('--- INI VERSI TERBARU (PASTI KONEK) ---');

mongoose.connect(mongoURI)
    .then(() => console.log('✅ DATABASE: MongoDB Compass sudah terhubung!'))
    .catch(err => console.log('❌ DATABASE: Gagal konek!', err.message));

const Message = mongoose.model('Message', new mongoose.Schema({
    name: String, email: String, message: String,
    date: { type: Date, default: Date.now }
}));

app.post(['/', '/api/contact'], async (req, res) => {
    // CEK KONEKSI
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            success: false,
            message: 'DATABASE MATI. Cek terminal VS Code kamu, tulisannya MERAH atau HIJAU?'
        });
    }

    try {
        const { name, email, message } = req.body;
        await new Message({ name, email, message }).save();
        console.log('✅ Pesan tersimpan di Compass!');

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_RECEIVER || 'rismaamaliaputri366@gmail.com',
            subject: `Pesan Baru: ${name}`,
            text: `Nama: ${name}\nEmail: ${email}\nPesan: ${message}`
        }).catch(e => console.log('⚠️ Email eror (Abaikan):', e.message));

        res.status(200).json({ success: true, message: 'BERHASIL! Pesan masuk ke Compass dan Email.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal: ' + err.message });
    }
});

app.listen(PORT, () => console.log(`🚀 Server Portfolio: http://localhost:${PORT}`));
