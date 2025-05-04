import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GameMode } from '../types/game';
import { useGameStore } from '../store/gameStore';
import { Gamepad2, Map, Coins, Binary, Castle } from 'lucide-react';
import { questions } from '../data/questions';

const gameModes = [
  {
    id: 'sequential',
    name: 'Sequential Map',
    description: 'Follow a path and answer questions to progress',
    icon: <Map className="w-8 h-8 text-indigo-400" />,
    color: 'from-indigo-500 to-blue-600'
  },
  {
    id: 'exploration',
    name: 'Free Exploration',
    description: 'Explore the map freely and discover hidden questions',
    icon: <Gamepad2 className="w-8 h-8 text-emerald-400" />,
    color: 'from-emerald-500 to-green-600'
  },
  {
    id: 'gold-quest',
    name: 'Gold Quest',
    description: 'Earn gold and steal from others',
    icon: <Coins className="w-8 h-8 text-yellow-400" />,
    color: 'from-yellow-500 to-amber-600'
  },
  {
    id: 'crypto-hack',
    name: 'Crypto Hack',
    description: 'Hack and defend your way to victory',
    icon: <Binary className="w-8 h-8 text-cyan-400" />,
    color: 'from-cyan-500 to-blue-600'
  },
  {
    id: 'tower-defense',
    name: 'Tower Defense',
    description: 'Build towers and defend against waves',
    icon: <Castle className="w-8 h-8 text-purple-400" />,
    color: 'from-purple-500 to-pink-600'
  }
];

export default function StartScreen() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [selectedMode, setSelectedMode] = useState<GameMode>('sequential');
  const [error, setError] = useState('');
  
  const { setNickname: setGameNickname, setGameMode, setQuestions } = useGameStore();
  
  const handleStart = () => {
    if (nickname.trim().length < 2) {
      setError('Nickname must be at least 2 characters');
      return;
    }
    
    setGameNickname(nickname);
    setGameMode(selectedMode);
    setQuestions(questions); // Set the questions from our data
    navigate('/game/play');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-8"
      >
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
          Quest Quiz
        </h1>
        
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter Your Nickname
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              setError('');
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Your game nickname"
            maxLength={15}
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {gameModes.map((mode) => (
            <motion.button
              key={mode.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedMode(mode.id as GameMode)}
              className={`p-4 rounded-xl text-left transition-all ${
                selectedMode === mode.id
                  ? `bg-gradient-to-r ${mode.color} text-white ring-2 ring-offset-2 ring-indigo-500`
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center mb-2">
                {mode.icon}
                <span className="ml-2 font-semibold">{mode.name}</span>
              </div>
              <p className={`text-sm ${
                selectedMode === mode.id ? 'text-white/90' : 'text-gray-600'
              }`}>
                {mode.description}
              </p>
            </motion.button>
          ))}
        </div>
        
        <div className="text-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all"
          >
            Start Game
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}