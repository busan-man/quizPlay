import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { Question } from '../../types/game';
import { QuestionCard } from './QuestionCard';
import { Sparkles } from 'lucide-react';

interface QuizSpotProps {
  position: { x: number; y: number };
  question: Question;
  isDiscovered: boolean;
  onDiscover: () => void;
}

const QuizSpot: React.FC<QuizSpotProps> = ({ position, question, isDiscovered, onDiscover }) => {
  return (
    <motion.div
      className={`absolute cursor-pointer ${isDiscovered ? 'opacity-50' : 'animate-pulse'}`}
      style={{ left: `${position.x}%`, top: `${position.y}%` }}
      whileHover={{ scale: 1.1 }}
      onClick={onDiscover}
    >
      <Sparkles className={`w-8 h-8 ${isDiscovered ? 'text-gray-400' : 'text-yellow-400'}`} />
    </motion.div>
  );
};

export const ExplorationMap: React.FC = () => {
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const { questions, answeredQuestions, answerQuestion, updateScore } = useGameStore();
  
  const quizSpots = questions.map((question, index) => ({
    position: {
      x: 20 + (Math.random() * 60),
      y: 20 + (Math.random() * 60)
    },
    question
  }));

  const handleDiscover = (question: Question) => {
    if (!answeredQuestions.has(question.id)) {
      setSelectedQuestion(question);
    }
  };

  const handleAnswer = (answer: string | number) => {
    if (selectedQuestion) {
      const isCorrect = answerQuestion(selectedQuestion.id, answer);
      if (isCorrect) {
        updateScore(selectedQuestion.points);
      }
      setSelectedQuestion(null);
    }
  };

  return (
    <div className="relative w-full h-[600px] bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl overflow-hidden">
      {quizSpots.map((spot, index) => (
        <QuizSpot
          key={index}
          position={spot.position}
          question={spot.question}
          isDiscovered={answeredQuestions.has(spot.question.id)}
          onDiscover={() => handleDiscover(spot.question)}
        />
      ))}
      
      {selectedQuestion && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
          <QuestionCard
            question={selectedQuestion}
            onAnswer={handleAnswer}
          />
        </div>
      )}
    </div>
  );
};