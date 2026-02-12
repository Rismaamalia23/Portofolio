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

// Fungsi sakti untuk koneksi
async function getDBConnection() {
    const configs = [
        { host: '127.0.0.1', user: 'root', password: '', database: 'portofolio', port: 3306 },
        { host: 'localhost', user: 'root', password: '', database: 'portofolio', port: 3306 }
    ];

    for (let config of configs) {
        try {
            const conn = await mysql.createConnection(config);
            console.log(`✅ BERHASIL KONEK PAKE: ${config.host}`);
            return conn;
        } catch (err) {
            console.log(`❌ Gagal pake ${config.host}: ${err.message}`);
        }
    }
    throw new Error('Semua jalur koneksi diblokir oleh Windows! Coba restart laptop atau cek Firewall.');
}

app.post(['/', '/api/contact'], async (req, res) => {
    let connection;
    try {
        const { name, email, message } = req.body;

        // Coba koneksi
        connection = await getDBConnection();

        // Query simpan
        const [result] = await connection.execute(
            'INSERT INTO messages (name, email, message) VALUES (?, ?, ?)',
            [name, email, message]
        );

        console.log('✅ Data berhasil masuk phpMyAdmin!');

        // Kirim Email (optional, kalau gagal tidak apa-apa)
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
            });
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_RECEIVER,
                subject: `Pesan Baru: ${name}`,
                text: `Nama: ${name}\nEmail: ${email}\nPesan: ${message}`
            });
        } catch (e) { console.log('⚠️ Email eror tapi DB aman.'); }

        res.status(201).json({ success: true, message: 'MANDRAGUNA! Pesan sudah masuk ke phpMyAdmin!' });
    } catch (error) {
        console.error('🔴 ERROR TOTAL:', error.message);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

app.listen(PORT, () => {
    console.log(`� SERVER ON http://localhost:${PORT}`);
    console.log('--------------------------------------');
});
