import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentPage from './pages/StudentPage';
import StartScreen from './screens/StartScreen';
import GameScreen from './screens/GameScreen';
import ResultScreen from './screens/ResultScreen';
import { useGameStore } from './store/gameStore';

function App() {
  const [page, setPage] = useState('home');
  const nickname = useGameStore((state) => state.nickname);

  // Mock navigation hook to make the Links work
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor && anchor.getAttribute('href')) {
        const href = anchor.getAttribute('href');
        
        if (href === '/') {
          e.preventDefault();
          setPage('home');
        } else if (href === '/teacher') {
          e.preventDefault();
          setPage('teacher');
        } else if (href === '/student' || href === '/join') {
          e.preventDefault();
          setPage('student');
        }
      }
    };
    
    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={
            page === 'home' ? <HomePage /> :
            page === 'teacher' ? <TeacherDashboard /> :
            page === 'student' ? <StudentPage /> :
            <HomePage />
          } />
          <Route path="/game/start" element={<StartScreen />} />
          <Route 
            path="/game/play" 
            element={nickname ? <GameScreen /> : <StartScreen />} 
          />
          <Route 
            path="/game/result" 
            element={nickname ? <ResultScreen /> : <StartScreen />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;