// src/api/index.js
const express = require('express');
const router = express.Router();

// Импортируем роуты
const roomsRoutes = require('./routes/rooms');

// Используем роуты
router.use('/rooms', roomsRoutes);

// Health check для API
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'games-api',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
