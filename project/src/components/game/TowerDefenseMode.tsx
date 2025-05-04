import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { QuestionCard } from './QuestionCard';
import { Castle, Sword, Heart } from 'lucide-react';

interface Tower {
  id: string;
  level: number;
  damage: number;
  cost: number;
}

interface Enemy {
  id: string;
  health: number;
  maxHealth: number;
  position: number;
}

export const TowerDefenseMode: React.FC = () => {
  const [towers, setTowers] = useState<Tower[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [wave, setWave] = useState(1);
  const [points, setPoints] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  
  const { currentQuestion, questions, answerQuestion, updateScore } = useGameStore();
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (!gameOver) {
        // Move enemies
        setEnemies(prev => {
          const newEnemies = prev.map(enemy => ({
            ...enemy,
            position: enemy.position + 1
          }));
          
          // Remove enemies that reached the end
          const survivingEnemies = newEnemies.filter(enemy => enemy.position < 100);
          if (survivingEnemies.length < newEnemies.length) {
            setGameOver(true);
          }
          
          return survivingEnemies;
        });
        
        // Tower attacks
        towers.forEach(tower => {
          setEnemies(prev => {
            return prev.map(enemy => ({
              ...enemy,
              health: Math.max(0, enemy.health - tower.damage)
            }));
          });
        });
        
        // Remove dead enemies
        setEnemies(prev => prev.filter(enemy => enemy.health > 0));
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [towers, gameOver]);
  
  const handleAnswer = (answer: string | number) => {
    const isCorrect = answerQuestion(questions[currentQuestion].id, answer);
    if (isCorrect) {
      const pointsEarned = Math.floor(Math.random() * 50) + 50;
      setPoints(prev => prev + pointsEarned);
      updateScore(pointsEarned);
    }
  };
  
  const buildTower = () => {
    if (points >= 100) {
      setTowers(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          level: 1,
          damage: 10,
          cost: 100
        }
      ]);
      setPoints(prev => prev - 100);
    }
  };
  
  const upgradeTower = (towerId: string) => {
    setTowers(prev => {
      return prev.map(tower => {
        if (tower.id === towerId && points >= tower.cost) {
          setPoints(p => p - tower.cost);
          return {
            ...tower,
            level: tower.level + 1,
            damage: tower.damage * 1.5,
            cost: tower.cost * 2
          };
        }
        return tower;
      });
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Castle className="w-5 h-5 text-purple-600 mr-1" />
            <span className="font-semibold">{towers.length} Towers</span>
          </div>
          <div className="flex items-center">
            <Sword className="w-5 h-5 text-red-600 mr-1" />
            <span className="font-semibold">Wave {wave}</span>
          </div>
          <div className="flex items-center">
            <Heart className="w-5 h-5 text-green-600 mr-1" />
            <span className="font-semibold">{points} Points</span>
          </div>
        </div>
        
        <button
          onClick={buildTower}
          disabled={points < 100}
          className={`px-4 py-2 rounded-lg ${
            points >= 100
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          } transition-colors`}
        >
          Build Tower (100)
        </button>
      </div>

      <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl p-6 mb-8">
        <div className="grid grid-cols-4 gap-4 mb-4">
          {towers.map((tower) => (
            <motion.div
              key={tower.id}
              className="bg-white rounded-lg p-4 shadow-md"
              whileHover={{ scale: 1.05 }}
            >
              <div className="flex justify-between items-center mb-2">
                <Castle className="w-6 h-6 text-purple-600" />
                <span className="text-sm font-semibold">Level {tower.level}</span>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                Damage: {tower.damage.toFixed(1)}
              </div>
              <button
                onClick={() => upgradeTower(tower.id)}
                disabled={points < tower.cost}
                className={`w-full px-3 py-1 rounded ${
                  points >= tower.cost
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                } transition-colors text-sm`}
              >
                Upgrade ({tower.cost})
              </button>
            </motion.div>
          ))}
        </div>
        
        <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
          {enemies.map((enemy) => (
            <motion.div
              key={enemy.id}
              className="absolute top-0 h-full w-6 bg-red-500"
              style={{ left: `${enemy.position}%` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div
                className="h-full bg-green-500"
                style={{ width: `${(enemy.health / enemy.maxHealth) * 100}%` }}
              />
            </motion.div>
          ))}
        </div>
      </div>

      <QuestionCard
        question={questions[currentQuestion]}
        onAnswer={handleAnswer}
      />
    </div>
  );
};