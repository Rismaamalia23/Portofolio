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

// KONEKSI KE MONGODB ATLAS
// Gunakan MONGODB_URI dari .env (untuk Online) atau localhost (untuk cadangan)
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/portofolio';

mongoose.connect(mongoURI)
    .then(() => console.log('✅ DATABASE ONLINE SIAP!'))
    .catch(err => console.error('❌ Gagal konek:', err.message));

const Message = mongoose.model('Message', new mongoose.Schema({
    name: String,
    email: String,
    message: String,
    date: { type: Date, default: Date.now }
}));

app.post(['/', '/api/contact'], async (req, res) => {
    try {
        const { name, email, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Semua kolom harus diisi.' });
        }

        // Simpan ke Atlas
        const newMessage = new Message({ name, email, message });
        await newMessage.save();

        // Kirim Notifikasi Email
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
            subject: `Pesan Baru dari ${name}`,
            text: `Nama: ${name}\nEmail: ${email}\nPesan: ${message}`
        };

        transporter.sendMail(mailOptions).catch(e => console.log('Email Error:', e.message));

        res.status(200).json({ success: true, message: 'Pesan terkirim secara Online!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = app; // Penting untuk Vercel

if (require.main === module) {
    app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
}
