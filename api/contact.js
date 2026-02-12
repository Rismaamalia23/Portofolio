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

mongoose.set('bufferCommands', false);

// LOGIKA KONEKSI: Cek Atlas dulu, kalo ga ada pake Lokal
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/portofolio';

console.log('📡 Menghubungkan ke Database...');

mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 5000 })
    .then(() => console.log('✅ DATABASE TERHUBUNG!'))
    .catch(err => console.log('❌ GAGAL KONEK:', err.message));

const Message = mongoose.model('Message', new mongoose.Schema({
    name: String, email: String, message: String,
    date: { type: Date, default: Date.now }
}));

app.post(['/', '/api/contact'], async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ success: false, message: 'Database belum siap. Jika ini di Vercel, pastikan Environment Variables MONGODB_URI sudah diisi.' });
    }

    try {
        const { name, email, message } = req.body;
        await new Message({ name, email, message }).save();

        const cleanPass = (process.env.EMAIL_PASS || '').replace(/\s/g, '');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: cleanPass }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_RECEIVER || 'rismaamaliaputri366@gmail.com',
            subject: `Pesan Baru: ${name}`,
            text: `Nama: ${name}\nEmail: ${email}\nPesan: ${message}`
        });

        res.status(200).json({ success: true, message: 'Berhasil dikirim!' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error: ' + err.message });
    }
});

module.exports = app;
if (require.main === module) {
    app.listen(PORT, () => console.log(`🚀 Server: http://localhost:${PORT}`));
}
