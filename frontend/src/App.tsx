import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RoomPage from './pages/RoomPage';
import GamePage from './pages/GamePage';
import LoadingScreen from './components/LoadingScreen';
import { useTelegram } from './hooks/useTelegram';

const App: React.FC = () => {
  const { user, isReady } = useTelegram();

  if (!isReady) {
    return <LoadingScreen />; // или просто <div>Загрузка...</div>, если компонента нет
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
        <Route path="/game/:gameType/:roomId" element={<GamePage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Router>
  );
};

export default App;
