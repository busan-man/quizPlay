import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import GameJoin from '../components/student/GameJoin';

const StudentPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Join a Game</h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Enter the game code provided by your teacher to start playing and learning.
            </p>
          </div>
          <GameJoin />
          <div className="mt-12 p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Test the Game</h3>
            <p className="text-gray-600 mb-4">
              Want to try a game without joining a room? Click below to start a demo game.
            </p>
            <button
              onClick={() => navigate('/game/start')}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors"
            >
              Try Demo Game
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default StudentPage;