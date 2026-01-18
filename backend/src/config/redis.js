const Redis = require('ioredis');
require('dotenv').config();

const redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    retryStrategy: function(times) {
        const delay = Math.min(times * 50, 2000);
        console.log(`♻️ Переподключение к Redis через ${delay}ms (попытка ${times})...`);
        return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    autoResubscribe: true
});

redisClient.on('connect', () => {
    console.log('🔗 Подключение к Redis...');
});

redisClient.on('ready', () => {
    console.log('✅ Redis подключен!');
});

redisClient.on('error', (err) => {
    console.error(`❌ Redis ошибка: ${err.message}`);
});

redisClient.on('end', () => {
    console.log('⚠️ Redis соединение закрыто');
});

redisClient.on('reconnecting', (ms) => {
    console.log(`♻️ Переподключение к Redis через ${ms}ms...`);
});

module.exports = { redisClient };
