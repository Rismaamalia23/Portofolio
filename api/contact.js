const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Skema Pesan
const Message = mongoose.model('Message', new mongoose.Schema({
    name: String, email: String, message: String,
    date: { type: Date, default: Date.now }
}));

// Fungsi Koneksi Database (Pintar untuk Vercel)
const connectDB = async () => {
    if (mongoose.connection.readyState === 1) return;

    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/portofolio';
    console.log('📡 Mencoba konek ke MongoDB...');

    await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 8000
    });
};

app.post(['/', '/api/contact'], async (req, res) => {
    try {
        // 1. Paksa konek dulu sebelum proses
        await connectDB();

        const { name, email, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Semua kolom harus diisi.' });
        }

        // 2. Simpan
        const newMessage = new Message({ name, email, message });
        await newMessage.save();

        // 3. Email (Background)
        const cleanPass = (process.env.EMAIL_PASS || '').replace(/\s/g, '');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: cleanPass }
        });

        transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_RECEIVER || 'rismaamaliaputri366@gmail.com',
            subject: `Pesan Baru: ${name}`,
            text: `Nama: ${name}\nEmail: ${email}\nPesan: ${message}`
        }).catch(e => console.log('⚠️ Email Error:', e.message));

        res.status(200).json({ success: true, message: 'Berhasil dikirim secara Online!' });

    } catch (error) {
        console.error('❌ Error API:', error.message);
        res.status(500).json({
            success: false,
            message: 'Maaf, terjadi masalah koneksi ke database. Pastikan Network Access di Atlas sudah 0.0.0.0/0 dan coba lagi.'
        });
    }
});

module.exports = app;

if (require.main === module) {
    app.listen(PORT, () => console.log(`🚀 Server Lokal: http://localhost:${PORT}`));
}
