import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Play, Clock, Users, Trash, Edit } from 'lucide-react';
import { getTeacherGames, startGame, endGame } from '../../api/game';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface Game {
  _id: string;
  title: string;
  gameCode: string;
  status: 'lobby' | 'active' | 'finished';
  mode: string;
  players: Array<{ id: string; name: string; score: number; isActive: boolean }>;
  createdAt: string;
}

const TeacherDashboardPage = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      setLoading(true);
      console.log('게임 목록 로딩 중...');
      const gamesData = await getTeacherGames();
      console.log('게임 목록 로딩 완료:', gamesData);
      setGames(gamesData);
    } catch (error) {
      console.error('게임 목록 로딩 실패:', error);
      toast.error('게임 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = async (gameId: string) => {
    try {
      setActionInProgress(gameId);
      await startGame(gameId);
      toast.success('게임이 시작되었습니다');
      // games 배열에서 해당 게임 정보 찾기
      const game = games.find(g => g._id === gameId);
      if (game && game.mode === 'quiz') {
        // 소켓 브리지가 포함된 UnityGamePage로 이동
        navigate('/unity-game', {
          state: { mode: 'teacher', gameCode: game.gameCode, gameId: game._id }
        });
      } else {
        // 다른 모드는 기존대로 대시보드 새로고침
        loadGames();
      }
    } catch (error) {
      toast.error('게임 시작에 실패했습니다');
      console.error(error);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleEndGame = async (gameId: string) => {
    try {
      setActionInProgress(gameId);
      await endGame(gameId);
      toast.success('게임이 종료되었습니다');
      loadGames();
    } catch (error) {
      toast.error('게임 종료에 실패했습니다');
      console.error(error);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleUnityHost = (game: Game) => {
    // 소켓 브리지가 포함된 UnityGamePage로 이동
    navigate('/unity-game', {
      state: { mode: 'teacher', gameCode: game.gameCode, gameId: game._id }
    });
  };

  // Host 버튼: 진행 중인 게임이면 Unity로 이동
  const handleHost = (game: Game) => {
    if (game.mode === 'quiz') {
      // 진행 중인 게임 재입장 - UnityGamePage로 이동
      navigate('/unity-game', {
        state: { mode: 'teacher', gameCode: game.gameCode, gameId: game._id }
      });
    } else {
      // 기존 호스트 페이지로 이동
      navigate(`/teacher/host/${game._id}`);
    }
  };
  // Review 버튼: 리뷰 페이지로 이동
  const handleReview = (game: Game) => {
    navigate(`/teacher/review/${game.gameCode}`);
  };

  const renderGameCard = (game: Game) => {
    const isActionDisabled = actionInProgress !== null;
    const activePlayers = game.players.filter(player => player.isActive).length;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        key={game._id}
        className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
      >
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{game.title}</h3>
              <div className="mt-1 flex items-center">
                <span className="text-sm text-gray-500 flex items-center mr-4">
                  <Clock className="h-4 w-4 mr-1" />
                  {new Date(game.createdAt).toLocaleDateString()}
                </span>
                <span className="text-sm text-gray-500 flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {activePlayers}명
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span 
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  game.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : game.status === 'finished'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {game.status === 'active' 
                  ? '진행중' 
                  : game.status === 'finished' 
                  ? '종료됨' 
                  : '대기중'}
              </span>
            </div>
          </div>
          
          <div className="mt-4 border-t border-gray-200 pt-4 flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-700">게임 코드:</span>
              <span className="ml-2 text-2xl font-bold text-indigo-600">{game.gameCode}</span>
            </div>
            
            <div className="flex space-x-2">
              {game.status === 'lobby' && (
                <button
                  onClick={() => handleStartGame(game._id)}
                  disabled={isActionDisabled}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:bg-green-400"
                >
                  <Play className="h-4 w-4 mr-1" />
                  시작
                </button>
              )}
              
              {game.status === 'active' && (
                <button
                  onClick={() => handleEndGame(game._id)}
                  disabled={isActionDisabled}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:bg-red-400"
                >
                  <Trash className="h-4 w-4 mr-1" />
                  종료
                </button>
              )}
              
              {/* 진행 중(lobby, active)일 때만 Host 버튼 */}
              {(game.status === 'lobby' || game.status === 'active') && (
                <button
                  onClick={() => handleHost(game)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                >
                  <Play className="h-4 w-4 mr-1" />
                  호스팅
                </button>
              )}
              {/* 끝난 게임이면 Review 버튼 */}
              {game.status === 'finished' && (
                <button
                  onClick={() => handleReview(game)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none"
                >
                  결과 보기
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">선생님 대시보드</h1>
        <Link
          to="/teacher/create-quiz"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          새 퀴즈 만들기
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-gray-600">게임 로딩 중...</p>
          </div>
        </div>
      ) : games.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 mb-8">
          {games.map(renderGameCard)}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">아직 만든 퀴즈가 없습니다</h3>
          <p className="text-gray-600 mb-6">
            학생들과 소통할 첫 번째 퀴즈를 만들어보세요.
          </p>
          <Link
            to="/teacher/create-quiz"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            첫 퀴즈 만들기
          </Link>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboardPage;