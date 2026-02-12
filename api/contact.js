const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL Connection Configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'portofolio'
};

// Routes
app.post(['/', '/api/contact'], async (req, res) => {
    let connection;
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Semua kolom harus diisi.' });
        }

        // 1. Simpan ke Database
        try {
            connection = await mysql.createConnection(dbConfig);
            const query = 'INSERT INTO messages (name, email, message) VALUES (?, ?, ?)';
            await connection.execute(query, [name, email, message]);
            console.log('✅ Pesan tersimpan di database');
        } catch (dbError) {
            console.error('❌ Database Error:', dbError);
            return res.status(500).json({
                success: false,
                message: `Database error: ${dbError.message}. Pastikan tabel "messages" sudah dibuat di database "${dbConfig.database}".`
            });
        }

        // 2. Kirim Email (Jangan gagalkan respon jika email gagal)
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_RECEIVER,
                subject: `Pesan Baru Portofolio: ${name}`,
                text: `Nama: ${name}\nEmail: ${email}\nPesan: ${message}`
            };

            await transporter.sendMail(mailOptions);
            console.log('📧 Email terkirim');
        } catch (mailError) {
            console.warn('⚠️ Email gagal dikirim (Cek App Password di .env):', mailError.message);
            // Tetap lanjut karena data sudah masuk database
        }

        res.status(201).json({ success: true, message: 'Pesan berhasil dikirim!' });
    } catch (error) {
        console.error('❌ System Error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem.' });
    } finally {
        if (connection) await connection.end();
    }
});

// Export for Vercel
module.exports = app;

if (process.env.NODE_ENV !== 'production' && require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}
