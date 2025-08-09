import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
import GameLayout from './layouts/GameLayout';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

// Teacher Pages
import TeacherDashboardPage from './pages/teacher/TeacherDashboardPage';
import CreateQuizPage from './pages/teacher/CreateQuizPage';
import ManageQuestionsPage from './pages/teacher/ManageQuestionsPage';
import GameHostPage from './pages/teacher/GameHostPage';
import GameSetupPage from './pages/teacher/GameSetupPage';
import TeacherGameResultsPage from './pages/teacher/GameResultsPage';
import ReviewPage from './pages/teacher/ReviewPage';

// Student Pages
import JoinGamePage from './pages/student/JoinGamePage';
import CharacterSelectPage from './pages/student/CharacterSelectPage';
import GameplayPage from './pages/student/GameplayPage';
import StudentGameResultsPage from './pages/student/GameResultsPage';

// Unity Pages
import UnityGamePage from './pages/UnityGamePage';
import UnityPage from './pages/UnityPage';

// Protected Route
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
                    <Routes>
              {/* Public Routes */}
              <Route path="/" element={<MainLayout />}>
                <Route index element={<HomePage />} />
              </Route>
              
              {/* Auth Routes */}
              <Route path="/auth" element={<AuthLayout />}>
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
              </Route>

          {/* Unity Game Only Route */}
          <Route path="/unity" element={<UnityPage />} />

          {/* Protected Routes */}
          <Route path="/teacher" element={<ProtectedRoute allowedRoles={["teacher"]} />}>
            <Route element={<MainLayout />}>
              <Route index element={<TeacherDashboardPage />} />
              <Route path="dashboard" element={<TeacherDashboardPage />} />
              <Route path="create-quiz" element={<CreateQuizPage />} />
              <Route path="questions" element={<ManageQuestionsPage />} />
              <Route path="review" element={<ReviewPage />} />
            </Route>
            <Route element={<GameLayout />}>
              <Route path="host/:gameId" element={<GameHostPage />} />
              <Route path="setup/:gameId" element={<GameSetupPage />} />
              <Route path="results/:gameId" element={<TeacherGameResultsPage />} />
            </Route>
          </Route>

          <Route path="/student" element={<ProtectedRoute allowedRoles={["student"]} />}>
            <Route element={<MainLayout />}>
              <Route index element={<Navigate to="join" replace />} />
              <Route path="join" element={<JoinGamePage />} />
              <Route path="character-select" element={<CharacterSelectPage />} />
              <Route path="results" element={<StudentGameResultsPage />} />
            </Route>
            <Route element={<GameLayout />}>
              <Route path="gameplay" element={<GameplayPage />} />
            </Route>
          </Route>

          {/* Unity Game Page (with React wrapper) */}
          <Route path="/unity-game" element={<UnityGamePage />} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
                    <Toaster 
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10B981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 4000,
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
      </div>
    </Router>
  );
}

export default App;