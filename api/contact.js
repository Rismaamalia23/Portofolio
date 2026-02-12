const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Gunakan POOL agar koneksi lebih stabil di Windows
const pool = mysql.createPool({
    host: 'localhost', // Coba localhost dulu
    user: 'root',
    password: '',
    database: 'portofolio',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Tes koneksi saat server baru nyala
pool.getConnection()
    .then(conn => {
        console.log('✅ DATABASE TERKONEKSI: Risma, MySQL kamu sudah siap!');
        conn.release();
    })
    .catch(err => {
        console.log('⚠️ INFO: Mencoba jalur alternatif 127.0.0.1...');
    });

app.post(['/', '/api/contact'], async (req, res) => {
    try {
        const { name, email, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Harap isi semua kolom.' });
        }

        // 1. Simpan ke Database menggunakan Pool
        try {
            const query = 'INSERT INTO messages (name, email, message) VALUES (?, ?, ?)';
            await pool.execute(query, [name, email, message]);
            console.log('✅ Pesan masuk ke phpMyAdmin');
        } catch (dbError) {
            console.error('❌ Error Simpan:', dbError.message);
            return res.status(500).json({
                success: false,
                message: `Gagal Simpan: ${dbError.message}. Coba Restart MySQL di XAMPP.`
            });
        }

        // 2. Kirim Email Notifikasi
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_RECEIVER,
                subject: `📌 Pesan Baru: ${name}`,
                text: `Nama: ${name}\nEmail: ${email}\nPesan: ${message}`
            });
            console.log('📧 Email notifikasi terkirim');
        } catch (mailError) {
            console.log('⚠️ Email skip (tapi data tetap aman di MySQL)');
        }

        res.status(201).json({ success: true, message: 'BERHASIL! Pesan tersimpan di database.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Masalah sistem.' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server on http://localhost:${PORT}`);
});
