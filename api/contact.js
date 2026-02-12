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

// Nonaktifkan buffering Mongoose
mongoose.set('bufferCommands', false);

const mongoURI = 'mongodb://127.0.0.1:27017/portofolio';

console.log('--- SISTEM KONTAK GMAIL READY ---');

mongoose.connect(mongoURI)
    .then(() => console.log('✅ DATABASE: Terhubung ke MongoDB Compass'))
    .catch(err => console.log('❌ DATABASE: Gagal konek!', err.message));

const Message = mongoose.model('Message', new mongoose.Schema({
    name: String, email: String, message: String,
    date: { type: Date, default: Date.now }
}));

app.post(['/', '/api/contact'], async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ success: false, message: 'Database belum siap.' });
    }

    try {
        const { name, email, message } = req.body;
        await new Message({ name, email, message }).save();
        console.log('✅ Pesan disimpan di Database.');

        // EMAIL SETUP
        // Bersihkan spasi dari EMAIL_PASS jika ada
        const cleanPass = (process.env.EMAIL_PASS || '').replace(/\s/g, '');

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // pake port 465 untuk SSL
            auth: {
                user: process.env.EMAIL_USER,
                pass: cleanPass
            }
        });

        console.log('📧 Sedang mencoba mengirim email ke Risma...');

        await transporter.sendMail({
            from: `"Notifikasi Portofolio" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_RECEIVER || 'rismaamaliaputri366@gmail.com',
            subject: `Pesan Baru dari ${name}!`,
            text: `Nama: ${name}\nEmail: ${email}\nPesan: ${message}`
        });

        console.log('✅ Email BERHASIL dikirim!');
        res.status(200).json({ success: true, message: 'BERHASIL! Pesan masuk ke DB dan Email.' });

    } catch (err) {
        console.error('❌ ERROR EMAIL:', err.message);
        res.status(500).json({ success: false, message: 'Simpan DB Berhasil, tapi Email gagal: ' + err.message });
    }
});

app.listen(PORT, () => console.log(`🚀 Server: http://localhost:${PORT}`));
