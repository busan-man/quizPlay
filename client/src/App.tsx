import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import GameLayout from './layouts/GameLayout';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import TeacherDashboardPage from './pages/teacher/TeacherDashboardPage';
import CreateQuizPage from './pages/teacher/CreateQuizPage';
import ManageQuestionsPage from './pages/teacher/ManageQuestionsPage';
import GameHostPage from './pages/teacher/GameHostPage';
import JoinGamePage from './pages/student/JoinGamePage';
import GameplayPage from './pages/student/GameplayPage';
import NotFoundPage from './pages/NotFoundPage';

// Auth
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useAuthStore } from './stores/authStore';

function App() {
  const { checkAuth } = useAuthStore();
  
  // Check for stored auth on app load
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
          </Route>

          {/* Auth routes */}
          <Route path="/auth" element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
          </Route>

          {/* Teacher routes */}
          <Route path="/teacher" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<TeacherDashboardPage />} />
            <Route path="create-quiz" element={<CreateQuizPage />} />
            <Route path="questions" element={<ManageQuestionsPage />} />
            <Route path="host/:gameId" element={<GameHostPage />} />
          </Route>

          {/* Student routes */}
          <Route path="/student" element={<MainLayout />}>
            <Route index element={<JoinGamePage />} />
          </Route>

          {/* Game routes */}
          <Route path="/game/:gameId" element={<GameLayout />}>
            <Route index element={<GameplayPage />} />
          </Route>

          {/* 404 route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
      
      <Toaster position="top-center" />
    </>
  );
}

export default App;