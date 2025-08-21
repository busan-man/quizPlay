import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Question } from '../../types/game';
import { CheckCircle, XCircle } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  onAnswer: (answer: string | number) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, onAnswer }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    
    const correct = selectedAnswer === question.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);
    
    setTimeout(() => {
      onAnswer(selectedAnswer);
      setSelectedAnswer(null);
      setShowResult(false);
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-xl p-6 max-w-xl w-full"
    >
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{question.text}</h3>
      
      {question.type === 'short-answer' ? (
        <input
          type="text"
          value={selectedAnswer as string || ''}
          onChange={(e) => setSelectedAnswer(e.target.value)}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          placeholder="Type your answer..."
        />
      ) : (
        <div className="space-y-3">
          {question.options?.map((option, index) => (
            <button
              key={index}
              onClick={() => setSelectedAnswer(index)}
              className={`w-full p-4 text-left rounded-lg transition-all ${
                selectedAnswer === index
                  ? 'bg-indigo-100 border-indigo-500 border-2'
                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Points: {question.points}
        </div>
        <button
          onClick={handleSubmit}
          disabled={selectedAnswer === null}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            selectedAnswer === null
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          Submit Answer
        </button>
      </div>

      {showResult && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`mt-4 p-4 rounded-lg flex items-center ${
            isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {isCorrect ? (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              Correct! +{question.points} points
            </>
          ) : (
            <>
              <XCircle className="w-5 h-5 mr-2" />
              Incorrect. The correct answer was: {
                question.type === 'multiple-choice' 
                  ? question.options?.[question.correctAnswer as number]
                  : question.correctAnswer
              }
            </>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};