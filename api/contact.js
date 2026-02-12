const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

// Explicitly load .env from root
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Set mongoose options globally
mongoose.set('strictQuery', false);

// MongoDB URI - Try 127.0.0.1 (common) or localhost
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/portofolio';

// Schema & Model
const MessageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    date: { type: String, default: () => new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) }
}, {
    bufferCommands: false // Jangan buffering, langsung error kalau gak konek
});

const Message = mongoose.model('Message', MessageSchema);

// Nodemailer Config
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Routes
app.post(['/', '/api/contact'], async (req, res) => {
    // Check MongoDB Connection Status FIRST
    if (mongoose.connection.readyState !== 1) {
        console.error('❌ Database not connected. State:', mongoose.connection.readyState);
        return res.status(503).json({
            success: false,
            message: 'Database sedang bermasalah atau belum terhubung. Pastikan MongoDB (Compass/Service) sudah ON.'
        });
    }

    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Semua kolom harus diisi.' });
        }

        // 1. Save to MongoDB
        const newMessage = new Message({ name, email, message });
        await newMessage.save();
        console.log('✅ Pesan tersimpan di MongoDB');

        // 2. Email Notification (Async)
        transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_RECEIVER || 'rismaamaliaputri366@gmail.com',
            subject: `Pesan Baru Portofolio: ${name}`,
            text: `Nama: ${name}\nEmail: ${email}\nPesan: ${message}`
        }).then(() => console.log('📧 Email terkirim'))
            .catch(e => console.error('⚠️ Email Error:', e.message));

        res.status(201).json({ success: true, message: 'Berhasil! Pesan tersimpan.' });
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ success: false, message: `Error: ${error.message}` });
    }
});

// Start Server with Connection
console.log('📡 Mencoba menghubungkan ke MongoDB...');
mongoose.connect(mongoURI, {
    serverSelectionTimeoutMS: 5000,
}).then(() => {
    console.log('✅ MongoDB Connected Ready!');
    app.listen(PORT, () => {
        console.log(`🚀 Server on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('❌ Gagal Konek ke MongoDB:', err.message);
    console.log('💡 TIP: Pastikan "MongoDB Service" di Windows Services (services.msc) sudah Running.');
    // Start server anyway to show errors on frontend
    app.listen(PORT, () => {
        console.log(`🚀 Server on port ${PORT} (Disconnected from DB)`);
    });
});
