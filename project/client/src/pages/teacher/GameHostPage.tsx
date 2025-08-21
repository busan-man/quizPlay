import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { getGameById } from '../../api/game';
import { 
  getSocket, 
  joinGameRoom, 
  sendNextQuestion, 
  leaveGameRoom,
  disconnectSocket 
} from '../../socket/socket';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { 
  Users, 
  Award, 
  Clock, 
  Play, 
  ChevronRight, 
  BarChart3,
  Gamepad2
} from 'lucide-react';

interface Player {
  id: string;
  name: string;
  score: number;
  isActive: boolean;
}

interface Question {
  _id: string;
  prompt: string;
  type: string;
  options?: string[];
  points: number;
  timeLimit?: number;
}

interface Game {
  _id: string;
  title: string;
  gameCode: string;
  status: 'lobby' | 'active' | 'finished';
  mode: string;
  players: Player[];
  questions: Question[];
  currentQuestion: number;
}

const GameHostPage = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionData, setCurrentQuestionData] = useState<{
    question: Partial<Question>;
    questionNumber: number;
    totalQuestions: number;
  } | null>(null);
  const [playerAnswers, setPlayerAnswers] = useState<{
    [playerId: string]: { correct: boolean; pointsEarned: number };
  }>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    loadGame();
    
    // Initialize socket connection
    const token = localStorage.getItem('token');
    const socket = getSocket(token || '');
    
    if (gameId) {
      joinGameRoom(gameId);
      
      // Socket event listeners
      socket.on('game-state', (data) => {
        setGame(data.game);
      });
      
      socket.on('player-joined', () => {
        // Refresh game data when a player joins
        loadGame();
      });
      
      socket.on('player-left', () => {
        // Refresh game data when a player leaves
        loadGame();
      });
      
      socket.on('question', (data) => {
        setCurrentQuestionData(data);
        setPlayerAnswers({});
        
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
      
      socket.on('player-answer', (data) => {
        setPlayerAnswers((prev) => ({
          ...prev,
          [data.playerId]: { 
            correct: data.correct, 
            pointsEarned: data.pointsEarned 
          }
        }));
      });
      
      socket.on('update-scores', (data) => {
        if (game) {
          setGame({ 
            ...game, 
            players: data.players.map((p: any) => ({
              ...p,
              isActive: true // Assume active from this event
            }))
          });
        }
      });
    }
    
    return () => {
      // Clean up
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      leaveGameRoom();
      disconnectSocket();
    };
  }, [gameId]);
  
  const loadGame = async () => {
    if (!gameId) return;
    
    try {
      setLoading(true);
      const gameData = await getGameById(gameId);
      setGame(gameData);
    } catch (error) {
      toast.error('Failed to load game');
      console.error(error);
      navigate('/teacher');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSendNextQuestion = () => {
    if (!gameId) return;
    
    sendNextQuestion();
  };

  const handleUnityHostMode = () => {
    if (!gameId || !user) return;
    
    // Unity WebGL 호스트 페이지로 이동
    const unityUrl = `/unity?gameId=${gameId}&playerId=${user.id}&playerName=${encodeURIComponent(user.name || '')}&isHost=true`;
    window.location.href = unityUrl;
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (!game) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <p className="text-gray-500">Game not found or you don't have permission to view it.</p>
      </div>
    );
  }
  
  const activePlayers = game.players?.filter(player => player.isActive) ?? [];
  const answeredPlayers = Object.keys(playerAnswers).length;
  const correctAnswers = Object.values(playerAnswers).filter(a => a.correct).length;
  
  const isNextQuestionAvailable = 
    game.status === 'active' && 
    game.currentQuestion < (game.questions?.length ?? 0);
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-indigo-600">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-white">{game.title}</h1>
            <div className="bg-white rounded-full px-4 py-1 text-indigo-600 font-bold">
              {game.gameCode}
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-indigo-50 rounded-lg p-4 flex items-center">
              <Users className="h-8 w-8 text-indigo-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Players</p>
                <p className="text-xl font-semibold">{activePlayers.length}</p>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 flex items-center">
              <BarChart3 className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Questions</p>
                <p className="text-xl font-semibold">{game.currentQuestion} / {game.questions?.length ?? 0}</p>
              </div>
            </div>
            
            <div className={`rounded-lg p-4 flex items-center ${
              game.status === 'active' 
                ? 'bg-green-50' 
                : game.status === 'finished'
                ? 'bg-gray-50'
                : 'bg-yellow-50'
            }`}>
              <div className={`h-8 w-8 mr-3 ${
                game.status === 'active' 
                  ? 'text-green-500' 
                  : game.status === 'finished'
                  ? 'text-gray-500'
                  : 'text-yellow-500'
              }`}>
                {game.status === 'active' ? (
                  <Play />
                ) : game.status === 'finished' ? (
                  <Award />
                ) : (
                  <Clock />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="text-xl font-semibold capitalize">{game.status}</p>
              </div>
            </div>
          </div>
          
          {game.status === 'lobby' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800">
                Waiting for players to join. Share the game code with your students.
              </p>
              <div className="mt-4">
                <button
                  onClick={handleUnityHostMode}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                >
                  <Gamepad2 className="h-5 w-5 mr-2" />
                  Unity 호스트 모드로 시작
                </button>
              </div>
            </div>
          )}
          
          {game.status === 'finished' && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
              <p className="text-indigo-800">
                This game has ended. You can view the final results below.
              </p>
            </div>
          )}
          
          {currentQuestionData && game.status === 'active' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm"
            >
              <div className="border-b border-gray-200 bg-gray-50 p-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    Question {currentQuestionData.questionNumber} of {currentQuestionData.totalQuestions}
                  </h3>
                  {timeRemaining !== null && (
                    <div className="flex items-center bg-indigo-100 px-3 py-1 rounded-full">
                      <Clock className="h-4 w-4 text-indigo-600 mr-1" />
                      <span className="font-medium text-indigo-600">{timeRemaining}s</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4">
                <p className="text-gray-900 font-medium mb-4">{currentQuestionData.question.prompt}</p>
                
                {currentQuestionData.question.type === 'multiple_choice' && currentQuestionData.question.options && (
                  <div className="space-y-2">
                    {currentQuestionData.question.options.map((option, index) => (
                      <div key={index} className="border border-gray-200 rounded-md p-3 bg-gray-50">
                        {option}
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm text-gray-500">
                        {answeredPlayers} of {activePlayers.length} answered
                      </span>
                      <div className="w-48 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${(answeredPlayers / Math.max(1, activePlayers.length)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-500">
                        Correct: {correctAnswers} ({answeredPlayers > 0 ? Math.round((correctAnswers / answeredPlayers) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {isNextQuestionAvailable && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleSendNextQuestion}
                disabled={currentQuestionData !== null && timeRemaining !== null && timeRemaining > 0}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:bg-indigo-400"
              >
                <ChevronRight className="h-5 w-5 mr-2" />
                {currentQuestionData === null ? 'Start First Question' : 'Next Question'}
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-indigo-600">
          <h2 className="text-lg font-semibold text-white">Leaderboard</h2>
        </div>
        
        <div className="p-6">
          {activePlayers.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {activePlayers
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                  <div key={player.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        index === 0 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : index === 1 
                          ? 'bg-gray-100 text-gray-800'
                          : index === 2 
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="font-medium">{player.name}</span>
                      
                      {/* Highlight recent answers */}
                      {playerAnswers[player.id] && (
                        <span className={`ml-3 text-xs px-2 py-1 rounded-full ${
                          playerAnswers[player.id].correct 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {playerAnswers[player.id].correct 
                            ? `+${playerAnswers[player.id].pointsEarned}` 
                            : 'Wrong'}
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-xl">{player.score}</div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">No players have joined yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameHostPage;