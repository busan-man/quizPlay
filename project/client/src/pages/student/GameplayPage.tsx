import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../../stores/gameStore';
import { 
  getSocket, 
  joinGameRoom, 
  submitAnswer,
  leaveGameRoom
} from '../../socket/socket';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Award, AlertCircle, Check, X, Gamepad2 } from 'lucide-react';

const GameplayPage = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { 
    playerId, 
    playerName,
    currentQuestion,
    setCurrentQuestion,
    setAnswerResult,
    lastAnswerResult,
    players,
    setPlayers
  } = useGameStore();
  
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [leaderboard, setLeaderboard] = useState<{ id: string; name: string; score: number }[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showUnityOption, setShowUnityOption] = useState(false);
  const [useUnity, setUseUnity] = useState(false);
  
  // Find current player in leaderboard
  const currentPlayerRank = leaderboard.findIndex(p => p.id === playerId);
  
  useEffect(() => {
    if (!gameId || !playerId) {
      navigate('/student');
      return;
    }
    
    // Unity 옵션 표시 (첫 번째 질문에서만)
    setShowUnityOption(true);
    
    // Initialize socket connection
    const socket = getSocket();
    
    // Join game room
    joinGameRoom(gameId, playerId);
    
    // Socket event listeners
    socket.on('question', (data) => {
      setCurrentQuestion(data.question, data.questionNumber, data.totalQuestions);
      setSelectedAnswer(null);
      setHasAnswered(false);
      setShowLeaderboard(false);
      
      // Set up timer if question has timeLimit
      if (data.question.timeLimit) {
        setTimeRemaining(data.question.timeLimit);
        
        if (timerInterval) {
          clearInterval(timerInterval);
        }
        
        const interval = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev === null || prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        setTimerInterval(interval);
      }
    });
    
    socket.on('answer-result', (data) => {
      setAnswerResult(data);
      setShowLeaderboard(true);
    });
    
    socket.on('update-scores', (data) => {
      setPlayers(data.players);
      setLeaderboard(data.players);
    });
    
    return () => {
      // Clean up
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      leaveGameRoom();
    };
  }, [gameId, playerId]);
  
  // Cleanup timer when component unmounts
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);
  
  const handleSelectAnswer = (answer: string) => {
    if (hasAnswered || !currentQuestion) return;
    
    setSelectedAnswer(answer);
  };
  
  const handleSubmitAnswer = () => {
    if (!selectedAnswer || hasAnswered || !currentQuestion) return;
    
    const timeLeft = timeRemaining || 0;
    submitAnswer(selectedAnswer, timeLeft);
    setHasAnswered(true);
  };

  const handleUnityMode = () => {
    setUseUnity(true);
    setShowUnityOption(false);
    
    // Unity WebGL 페이지로 이동
    const unityUrl = `/unity?gameId=${gameId}&playerId=${playerId}&playerName=${encodeURIComponent(playerName || '')}&isHost=false`;
    window.open(unityUrl, '_blank');
  };

  const handleWebMode = () => {
    setUseUnity(false);
    setShowUnityOption(false);
  };
  
  if (!currentQuestion && !showLeaderboard && !showUnityOption) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-white p-8">
        <div className="animate-pulse mb-4">
          <Clock className="h-12 w-12 mx-auto text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Waiting for the teacher to start...</h2>
        <p className="text-gray-400 text-center">
          The game will begin when the teacher sends the first question.
        </p>
      </div>
    );
  }

  // Unity 모드 선택 화면
  if (showUnityOption) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-white p-8">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-6 text-center">게임 모드 선택</h2>
          
          <div className="space-y-4">
            <button
              onClick={handleUnityMode}
              className="w-full p-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center justify-center space-x-3 transition-colors"
            >
              <Gamepad2 className="h-6 w-6" />
              <span className="text-lg font-medium">Unity WebGL 모드</span>
            </button>
            
            <button
              onClick={handleWebMode}
              className="w-full p-4 bg-gray-600 hover:bg-gray-700 rounded-lg flex items-center justify-center space-x-3 transition-colors"
            >
              <Award className="h-6 w-6" />
              <span className="text-lg font-medium">웹 모드</span>
            </button>
          </div>
          
          <div className="mt-6 text-sm text-gray-400 text-center">
            <p>Unity WebGL 모드: 더 나은 그래픽과 게임 경험</p>
            <p>웹 모드: 빠른 로딩과 간단한 인터페이스</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full p-4 flex flex-col">
      <AnimatePresence mode="wait">
        {showLeaderboard ? (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {lastAnswerResult && (
              <div className={`rounded-lg ${
                lastAnswerResult.correct ? 'bg-green-900' : 'bg-red-900'
              } p-6 mb-6 text-center`}>
                <div className="flex justify-center mb-2">
                  {lastAnswerResult.correct ? (
                    <Check className="h-12 w-12 text-green-400" />
                  ) : (
                    <X className="h-12 w-12 text-red-400" />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {lastAnswerResult.correct ? 'Correct!' : 'Incorrect!'}
                </h2>
                {lastAnswerResult.correct ? (
                  <p className="text-green-300 text-lg">
                    You earned {lastAnswerResult.pointsEarned} points!
                  </p>
                ) : (
                  <p className="text-red-300 text-lg">
                    The correct answer was: {
                      Array.isArray(lastAnswerResult.correctAnswer) 
                        ? lastAnswerResult.correctAnswer.join(', ')
                        : lastAnswerResult.correctAnswer
                    }
                  </p>
                )}
              </div>
            )}
            
            <div className="bg-gray-800 rounded-lg p-6 flex-1">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <Award className="h-5 w-5 mr-2 text-yellow-400" />
                Leaderboard
              </h2>
              
              {leaderboard.length > 0 ? (
                <div className="space-y-3 mt-4">
                  {leaderboard.map((player, index) => (
                    <div 
                      key={player.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        player.id === playerId 
                          ? 'bg-indigo-900 border border-indigo-600' 
                          : 'bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          index === 0 
                            ? 'bg-yellow-500 text-yellow-900' 
                            : index === 1 
                            ? 'bg-gray-400 text-gray-900'
                            : index === 2 
                            ? 'bg-amber-500 text-amber-900'
                            : 'bg-gray-600 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <span className={`font-medium ${player.id === playerId ? 'text-white' : 'text-gray-200'}`}>
                          {player.name}
                          {player.id === playerId && ' (You)'}
                        </span>
                      </div>
                      <div className="font-bold text-xl text-white">{player.score}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">No scores to display yet.</p>
              )}
              
              {/* Your position */}
              {currentPlayerRank !== -1 && (
                <div className="mt-6 bg-indigo-900 rounded-lg p-4 text-center">
                  <p className="text-indigo-300 mb-1">Your Position</p>
                  <p className="text-xl font-bold text-white">
                    {currentPlayerRank + 1}{getOrdinalSuffix(currentPlayerRank + 1)} Place
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ) : currentQuestion ? (
          <motion.div
            key="question"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-white">
                  {playerName}
                </h2>
                {timeRemaining !== null && (
                  <div className={`flex items-center px-3 py-1 rounded-full ${
                    timeRemaining > 10 
                      ? 'bg-green-900 text-green-300' 
                      : timeRemaining > 5
                      ? 'bg-yellow-900 text-yellow-300'
                      : 'bg-red-900 text-red-300'
                  }`}>
                    <Clock className="h-4 w-4 mr-1" />
                    <span className="font-medium">{timeRemaining}s</span>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <p className="text-white text-lg">{currentQuestion.prompt}</p>
              </div>
              
              {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectAnswer(index.toString())}
                      disabled={hasAnswered}
                      className={`w-full text-left p-4 rounded-lg transition-colors ${
                        selectedAnswer === index.toString()
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-700 text-white hover:bg-gray-600'
                      } ${hasAnswered ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
              
              {currentQuestion.type === 'true_false' && (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleSelectAnswer('true')}
                    disabled={hasAnswered}
                    className={`p-4 rounded-lg text-center font-bold transition-colors ${
                      selectedAnswer === 'true'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    } ${hasAnswered ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    TRUE
                  </button>
                  <button
                    onClick={() => handleSelectAnswer('false')}
                    disabled={hasAnswered}
                    className={`p-4 rounded-lg text-center font-bold transition-colors ${
                      selectedAnswer === 'false'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    } ${hasAnswered ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    FALSE
                  </button>
                </div>
              )}
              
              {currentQuestion.type === 'short_answer' && (
                <div className="mt-4">
                  <input
                    type="text"
                    value={selectedAnswer || ''}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    disabled={hasAnswered}
                    placeholder="Type your answer here"
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
            
            <div className="mt-auto">
              <button
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer || hasAnswered || timeRemaining === 0}
                className="w-full py-3 px-4 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:bg-gray-600 disabled:text-gray-300"
              >
                {hasAnswered ? 'Answer Submitted' : 'Submit Answer'}
              </button>
              
              {timeRemaining === 0 && !hasAnswered && (
                <div className="mt-4 bg-red-900 text-red-300 p-3 rounded-lg flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <span>Time's up! Please wait for the next question.</span>
                </div>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

// Helper function to get ordinal suffix
function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  
  if (j === 1 && k !== 11) {
    return 'st';
  }
  if (j === 2 && k !== 12) {
    return 'nd';
  }
  if (j === 3 && k !== 13) {
    return 'rd';
  }
  return 'th';
}

export default GameplayPage;