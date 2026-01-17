// src/api/routes/rooms.js
const express = require('express');
const router = express.Router();
const roomsController = require('../controllers/roomsController');

// Получить все комнаты
router.get('/', roomsController.getAllRooms);

// Создать комнату
router.post('/', roomsController.createRoom);

// Получить информацию о комнате
router.get('/:id', roomsController.getRoom);

// Присоединиться к комнате
router.post('/:id/join', roomsController.joinRoom);

// Удалить комнату
router.delete('/:id', roomsController.deleteRoom);

module.exports = router;
