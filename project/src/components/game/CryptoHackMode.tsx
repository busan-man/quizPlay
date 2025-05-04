import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { QuestionCard } from './QuestionCard';
import { Shield, Zap, Lock, Unlock } from 'lucide-react';

interface Player {
  id: string;
  nickname: string;
  codes: number;
  isProtected: boolean;
}

export const CryptoHackMode: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', nickname: 'Player 1', codes: 0, isProtected: false },
    { id: '2', nickname: 'Player 2', codes: 0, isProtected: false },
    { id: '3', nickname: 'Player 3', codes: 0, isProtected: false },
  ]);
  
  const { currentQuestion, questions, answerQuestion, updateScore } = useGameStore();
  const [showingQuestion, setShowingQuestion] = useState(true);
  const [hackAttempt, setHackAttempt] = useState<string | null>(null);
  
  const handleAnswer = (answer: string | number) => {
    const isCorrect = answerQuestion(questions[currentQuestion].id, answer);
    if (isCorrect) {
      setPlayers(prev => {
        const newPlayers = [...prev];
        const currentPlayer = newPlayers[0]; // Player 1 is always the current player
        currentPlayer.codes += 1;
        return newPlayers;
      });
      updateScore(100);
      setShowingQuestion(false);
    }
  };
  
  const handleHack = (targetId: string) => {
    const successRate = Math.random();
    const success = successRate > 0.5;
    
    setPlayers(prev => {
      const newPlayers = [...prev];
      const target = newPlayers.find(p => p.id === targetId);
      const player = newPlayers[0];
      
      if (target && success && !target.isProtected) {
        const stolenCodes = Math.min(2, target.codes);
        target.codes -= stolenCodes;
        player.codes += stolenCodes;
        updateScore(stolenCodes * 50);
      }
      
      return newPlayers;
    });
    
    setHackAttempt(null);
    setShowingQuestion(true);
  };
  
  const activateProtection = () => {
    setPlayers(prev => {
      const newPlayers = [...prev];
      const player = newPlayers[0];
      player.isProtected = true;
      return newPlayers;
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {players.map((player) => (
          <motion.div
            key={player.id}
            className={`bg-white rounded-lg shadow-md p-4 ${
              player.isProtected ? 'border-2 border-blue-500' : ''
            }`}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{player.nickname}</h3>
              {player.isProtected && (
                <Shield className="w-5 h-5 text-blue-500" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center text-purple-600">
                <Lock className="w-4 h-4 mr-1" />
                {player.codes} codes
              </div>
              {!showingQuestion && player.id !== '1' && (
                <button
                  onClick={() => handleHack(player.id)}
                  className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  <Zap className="w-5 h-5" />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {showingQuestion ? (
        <QuestionCard
          question={questions[currentQuestion]}
          onAnswer={handleAnswer}
        />
      ) : (
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setShowingQuestion(true)}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Next Question
          </button>
          {!players[0].isProtected && (
            <button
              onClick={activateProtection}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Activate Protection
            </button>
          )}
        </div>
      )}
    </div>
  );
};