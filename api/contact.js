const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = 5002; // PINDAH KE 5002 AGAR FRESH

app.use(cors());
app.use(express.json());

// Schema
const Message = mongoose.model('Message', new mongoose.Schema({
    name: String, email: String, message: String,
    date: { type: String, default: () => new Date().toLocaleString("id-ID") }
}));

// Route
app.post(['/', '/api/contact'], async (req, res) => {
    // Cek koneksi
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ success: false, message: 'Database masih proses nyambung... Coba 2 detik lagi.' });
    }

    try {
        const { name, email, message } = req.body;
        await new Message({ name, email, message }).save();

        console.log(`✅ Pesan dari ${name} masuk ke MongoDB!`);

        // Kirim Email di Background
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });
        transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_RECEIVER || 'rismaamaliaputri366@gmail.com',
            subject: `Pesan Baru: ${name}`,
            text: `Nama: ${name}\nEmail: ${email}\nPesan: ${message}`
        }).catch(e => console.log('Email gagal (DB Aman):', e.message));

        res.status(201).json({ success: true, message: 'AKHIRNYA BERHASIL! Data sudah masuk ke MongoDB Compass.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Koneksi ke MongoDB
console.log('📡 Menghubungkan ke MongoDB...');
mongoose.connect('mongodb://127.0.0.1:27017/portofolio', {
    serverSelectionTimeoutMS: 5000
}).then(() => {
    console.log('✅ PORT 5002 READY! MongoDB Risma sudah siap!');
}).catch(err => {
    console.error('❌ Gagal konek:', err.message);
});

app.listen(PORT, () => {
    console.log(`🚀 Server SEHAT di http://localhost:${PORT}`);
});
