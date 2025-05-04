import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { SequentialMap } from '../components/game/SequentialMap';
import { ExplorationMap } from '../components/game/ExplorationMap';
import { GoldQuestMode } from '../components/game/GoldQuestMode';
import { CryptoHackMode } from '../components/game/CryptoHackMode';
import { TowerDefenseMode } from '../components/game/TowerDefenseMode';

const GameScreen = () => {
  const navigate = useNavigate();
  const { nickname, gameMode, currentScore } = useGameStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold">{nickname}</h2>
              <p className="text-indigo-200">Score: {currentScore}</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              Exit Game
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-lg rounded-xl p-6"
          >
            {gameMode === 'sequential' && <SequentialMap />}
            {gameMode === 'exploration' && <ExplorationMap />}
            {gameMode === 'gold-quest' && <GoldQuestMode />}
            {gameMode === 'crypto-hack' && <CryptoHackMode />}
            {gameMode === 'tower-defense' && <TowerDefenseMode />}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default GameScreen;