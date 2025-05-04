import React, { useState, useEffect } from 'react';
import { Clock, Award } from 'lucide-react';
import { Button } from '../ui/Button';

interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

interface QuizGameProps {
  roomId?: string;
}

const QuizGame: React.FC<QuizGameProps> = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isAnswered, setIsAnswered] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  
  // Mock questions
  const questions: QuizQuestion[] = [
    {
      id: '1',
      text: 'What is the capital of France?',
      options: ['London', 'Paris', 'Berlin', 'Madrid'],
      correctAnswer: 1
    },
    {
      id: '2',
      text: 'Which of these is NOT a primary color?',
      options: ['Red', 'Yellow', 'Blue', 'Green'],
      correctAnswer: 3
    },
    {
      id: '3',
      text: 'What is 7 × 8?',
      options: ['56', '64', '48', '72'],
      correctAnswer: 0
    },
    {
      id: '4',
      text: 'Which planet is closest to the sun?',
      options: ['Earth', 'Venus', 'Mercury', 'Mars'],
      correctAnswer: 2
    },
    {
      id: '5',
      text: 'How many sides does a hexagon have?',
      options: ['5', '6', '7', '8'],
      correctAnswer: 1
    }
  ];
  
  // Timer effect
  useEffect(() => {
    if (gameOver || isAnswered || timeLeft <= 0) return;
    
    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
      
      if (timeLeft === 1) {
        setIsAnswered(true);
        setTimeout(nextQuestion, 2000);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [timeLeft, isAnswered, gameOver]);
  
  const handleSelectOption = (optionIndex: number) => {
    if (isAnswered) return;
    
    setSelectedOption(optionIndex);
    setIsAnswered(true);
    
    const currentQuestion = questions[currentQuestionIndex];
    if (optionIndex === currentQuestion.correctAnswer) {
      // Calculate score based on time left - faster answers get more points
      const pointsEarned = Math.max(50, 100 + (timeLeft * 10));
      setScore(prev => prev + pointsEarned);
    }
    
    setTimeout(nextQuestion, 2000);
  };
  
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(15);
    } else {
      setGameOver(true);
    }
  };
  
  const restartGame = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setScore(0);
    setTimeLeft(15);
    setIsAnswered(false);
    setGameOver(false);
  };
  
  const currentQuestion = questions[currentQuestionIndex];
  
  const getOptionClassName = (index: number) => {
    let className = "p-4 border rounded-lg text-center cursor-pointer transition-all transform hover:scale-105 ";
    
    if (!isAnswered) {
      className += "border-gray-300 hover:border-indigo-500 hover:bg-indigo-50";
    } else if (index === currentQuestion.correctAnswer) {
      className += "border-green-500 bg-green-100 font-bold";
    } else if (index === selectedOption) {
      className += "border-red-500 bg-red-100";
    } else {
      className += "border-gray-300 opacity-50";
    }
    
    return className;
  };
  
  if (gameOver) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-4">
            <Award className="h-10 w-10 text-indigo-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
          <p className="text-gray-600">You scored:</p>
          <div className="text-5xl font-bold text-indigo-600 my-6">{score} points</div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-gray-800 mb-4">Your Results</h3>
          <div className="flex justify-between items-center border-b border-gray-200 py-3">
            <span className="text-gray-600">Questions Answered</span>
            <span className="font-medium">{questions.length} / {questions.length}</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-200 py-3">
            <span className="text-gray-600">Correct Answers</span>
            <span className="font-medium text-green-600">
              {Math.round(score / 150)} / {questions.length}
            </span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-gray-600">Your Rank</span>
            <span className="font-medium text-amber-600">#3 out of 24</span>
          </div>
        </div>
        
        <Button onClick={restartGame}>
          Play Again
        </Button>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="text-sm text-gray-500 mb-1">Question {currentQuestionIndex + 1} of {questions.length}</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full" 
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="text-gray-500 mr-2">Score:</div>
          <div className="font-bold text-indigo-600">{score}</div>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="bg-indigo-50 p-4 flex justify-between items-center">
          <h3 className="font-semibold text-indigo-900">Quiz Challenge</h3>
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-indigo-600 mr-1" />
            <span className={`font-medium ${timeLeft <= 5 ? 'text-red-600' : 'text-indigo-600'}`}>
              {timeLeft}s
            </span>
          </div>
        </div>
        
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{currentQuestion.text}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion.options.map((option, index) => (
              <div
                key={index}
                className={getOptionClassName(index)}
                onClick={() => handleSelectOption(index)}
              >
                {option}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="text-center text-sm text-gray-500">
        {isAnswered ? (
          selectedOption === currentQuestion.correctAnswer ? (
            <div className="text-green-600 font-medium">Correct! +{Math.max(50, 100 + (timeLeft * 10))} points</div>
          ) : (
            <div className="text-red-600 font-medium">
              Incorrect! The correct answer is: {currentQuestion.options[currentQuestion.correctAnswer]}
            </div>
          )
        ) : (
          <div>Select the correct answer. Faster answers earn more points!</div>
        )}
      </div>
    </div>
  );
};

export default QuizGame;