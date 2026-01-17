const Redis = require('ioredis');

async function testRedis() {
  console.log('🔍 Тестирую подключение к Redis Cloud...');
  
  const config = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    connectTimeout: 5000,
    maxRetriesPerRequest: 1
  };
  
  console.log('Конфигурация:', {
    host: config.host,
    port: config.port,
    password: config.password ? '***' + config.password.slice(-3) : 'нет'
  });
  
  try {
    const redis = new Redis(config);
    
    // Слушаем события
    redis.on('connect', () => console.log('✅ Соединение установлено'));
    redis.on('error', (err) => console.log('❌ Ошибка:', err.message));
    redis.on('ready', () => console.log('🟢 Redis готов'));
    
    // Тест ping
    const result = await redis.ping();
    console.log(`🏓 Ping результат: ${result}`);
    
    await redis.quit();
    
  } catch (error) {
    console.log('💥 Критическая ошибка:', error.message);
    console.log('Проверьте:');
    console.log('1. Интернет соединение');
    console.log('2. Пароль правильный?');
    console.log('3. База активна в Redis Cloud?');
  }
}

// Загружаем .env
require('dotenv').config();
testRedis();
