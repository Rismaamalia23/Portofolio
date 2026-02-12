const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files (html, css, js)

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/portofolio';
mongoose.connect(mongoURI)
    .then(() => console.log('✅ MongoDB Connected to portofolio database'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Schema
const MessageSchema = new mongoose.Schema({
    name: String,
    email: String,
    message: String,
    date: { type: String, default: () => new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) }
});

const Message = mongoose.model('Message', MessageSchema);

// Routes
// 1. Contact Form
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        const newMessage = new Message({ name, email, message });
        await newMessage.save();
        res.status(201).json({ success: true, message: 'Message sent successfully! Thank you.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Gagal menyimpan pesan.' });
    }
});

// Root Route - Serve index.html explicitly if needed
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Export for Vercel
module.exports = app;

// Listen only if not on Vercel
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}
