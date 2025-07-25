import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';

interface MapNodeProps {
  index: number;
  currentQuestion: number;
  completed: boolean;
}

const MapNode: React.FC<MapNodeProps> = ({ index, currentQuestion, completed }) => {
  const isCurrent = index === currentQuestion;
  const isAccessible = index <= currentQuestion;
  
  return (
    <motion.div
      className={`relative flex items-center justify-center w-12 h-12 rounded-full ${
        completed
          ? 'bg-green-500'
          : isCurrent
          ? 'bg-indigo-600'
          : isAccessible
          ? 'bg-indigo-400'
          : 'bg-gray-300'
      }`}
      whileHover={isAccessible ? { scale: 1.1 } : {}}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
    >
      <span className="text-white font-bold">{index + 1}</span>
      {index < 4 && (
        <div className={`absolute w-16 h-1 right-0 translate-x-full ${
          index < currentQuestion ? 'bg-indigo-500' : 'bg-gray-300'
        }`} />
      )}
    </motion.div>
  );
};

export const SequentialMap: React.FC = () => {
  const currentQuestion = useGameStore((state) => state.currentQuestion);
  const answeredQuestions = useGameStore((state) => state.answeredQuestions);
  
  return (
    <div className="flex justify-center items-center space-x-16 mb-8">
      {[0, 1, 2, 3, 4].map((index) => (
        <MapNode
          key={index}
          index={index}
          currentQuestion={currentQuestion}
          completed={answeredQuestions.has((index + 1).toString())}
        />
      ))}
    </div>
  );
};