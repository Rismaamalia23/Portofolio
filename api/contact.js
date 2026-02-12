const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

// Pastikan .env terbaca dari folder utama
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Konfigurasi Database - Ambil dari .env atau default XAMPP
const dbConfig = {
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'portofolio',
    port: 3306,
    connectTimeout: 10000
};

app.post(['/', '/api/contact'], async (req, res) => {
    let connection;
    try {
        const { name, email, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Semua kolom harus diisi.' });
        }

        // 1. Simpan ke Database
        try {
            // Gunakan host 'localhost' jika 127.0.0.1 gagal (ciri khas Windows)
            connection = await mysql.createConnection(dbConfig).catch(async () => {
                return await mysql.createConnection({ ...dbConfig, host: 'localhost' });
            });

            const query = 'INSERT INTO messages (name, email, message) VALUES (?, ?, ?)';
            await connection.execute(query, [name, email, message]);
            console.log('✅ Pesan tersimpan di database');
        } catch (dbError) {
            console.error('❌ Database Connection Error:', dbError.message);
            return res.status(500).json({
                success: false,
                message: `Salah Koneksi: ${dbError.message}. Pastikan MySQL di XAMPP sudah berwarna HIJAU.`
            });
        }

        // 2. Kirim Email
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
                subject: `Pesan Baru Portofolio: ${name}`,
                text: `Nama: ${name}\nEmail: ${email}\nPesan: ${message}`
            });
            console.log('📧 Email terkirim');
        } catch (mailError) {
            console.warn('⚠️ Email gagal (tapi data aman di DB):', mailError.message);
        }

        res.status(201).json({ success: true, message: 'Pesan berhasil masuk ke Database phpMyAdmin!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem.' });
    } finally {
        if (connection) await connection.end();
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server Risma Jalan di http://localhost:${PORT}`);
    console.log(`📡 Mencoba konek ke database: ${dbConfig.database}`);
});
