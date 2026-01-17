// src/components/LoadingScreen.tsx
const LoadingScreen = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-telegram-bg to-gray-100">
      <div className="relative">
        <div className="w-24 h-24 border-4 border-telegram-button/20 border-t-telegram-button rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-telegram-button rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-white">🎮</span>
          </div>
        </div>
      </div>
      <div className="mt-8 text-center">
        <h1 className="text-2xl font-bold text-telegram-text mb-2">Игровой Хаб</h1>
        <p className="text-telegram-hint">Загрузка...</p>
      </div>
      <div className="mt-12">
        <div className="flex space-x-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 bg-telegram-button rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
