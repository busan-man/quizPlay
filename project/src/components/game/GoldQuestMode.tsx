import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { QuestionCard } from './QuestionCard';
import { Coins, Skull } from 'lucide-react';

interface Player {
  id: string;
  nickname: string;
  gold: number;
}

export const GoldQuestMode: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', nickname: 'Player 1', gold: 100 },
    { id: '2', nickname: 'Player 2', gold: 100 },
    { id: '3', nickname: 'Player 3', gold: 100 },
  ]);
  
  const { currentQuestion, questions, answerQuestion, updateScore } = useGameStore();
  const [showingQuestion, setShowingQuestion] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  
  const handleAnswer = (answer: string | number) => {
    const isCorrect = answerQuestion(questions[currentQuestion].id, answer);
    if (isCorrect) {
      const goldEarned = Math.floor(Math.random() * 50) + 50;
      updateScore(goldEarned);
      setShowingQuestion(false);
    }
  };
  
  const handleSteal = (targetId: string) => {
    setPlayers(prev => {
      const newPlayers = [...prev];
      const target = newPlayers.find(p => p.id === targetId);
      if (target) {
        const stealAmount = Math.floor(Math.random() * 30) + 20;
        target.gold = Math.max(0, target.gold - stealAmount);
        updateScore(stealAmount);
      }
      return newPlayers;
    });
    setSelectedPlayer(null);
    setShowingQuestion(true);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {players.map((player) => (
          <motion.div
            key={player.id}
            className="bg-white rounded-lg shadow-md p-4"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{player.nickname}</h3>
                <div className="flex items-center text-yellow-600">
                  <Coins className="w-4 h-4 mr-1" />
                  {player.gold}
                </div>
              </div>
              {!showingQuestion && (
                <button
                  onClick={() => handleSteal(player.id)}
                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <Skull className="w-5 h-5" />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {showingQuestion && (
        <QuestionCard
          question={questions[currentQuestion]}
          onAnswer={handleAnswer}
        />
      )}
    </div>
  );
};