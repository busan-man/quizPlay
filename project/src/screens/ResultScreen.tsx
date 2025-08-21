import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { Trophy, ArrowLeft, Share2 } from 'lucide-react';

const ResultScreen = () => {
  const navigate = useNavigate();
  const { nickname, currentScore, resetGame } = useGameStore();

  const handlePlayAgain = () => {
    resetGame();
    navigate('/');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Trophy className="w-16 h-16 text-yellow-300 mx-auto mb-4" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Congratulations, {nickname}!
          </h1>
          <p className="text-indigo-100">You've completed the game!</p>
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <div className="text-4xl font-bold text-indigo-600 mb-2">
              {currentScore}
            </div>
            <div className="text-gray-600">Total Score</div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handlePlayAgain}
              className="w-full py-3 px-6 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Play Again
            </button>
            
            <button
              onClick={() => console.log('Share score')}
              className="w-full py-3 px-6 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Share Score
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResultScreen;