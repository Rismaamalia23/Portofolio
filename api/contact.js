const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

// Load .env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// MongoDB Connection - Use physical IP for certainty
const mongoURI = 'mongodb://127.0.0.1:27017/portofolio';

mongoose.connect(mongoURI)
    .then(() => console.log('✅ DATABASE TERKONEKSI KE MONGODB'))
    .catch(err => console.error('❌ GAGAL KONEK MONGODB:', err.message));

// Schema
const MessageSchema = new mongoose.Schema({
    name: String,
    email: String,
    message: String,
    date: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', MessageSchema);

// Email Config
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Routes
app.post(['/', '/api/contact'], async (req, res) => {
    try {
        const { name, email, message } = req.body;

        // Simpan ke MongoDB
        const newMessage = new Message({ name, email, message });
        await newMessage.save();
        console.log('✅ Pesan berhasil disimpan ke MongoDB');

        // Kirim Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_RECEIVER || 'rismaamaliaputri366@gmail.com',
            subject: `New Portfolio Message from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) console.log('⚠️ Email error:', error.message);
            else console.log('📧 Email terkirim');
        });

        res.status(200).json({ success: true, message: 'Berhasil dikirim dan disimpan!' });
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
