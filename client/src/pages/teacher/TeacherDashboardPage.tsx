import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      setLoading(true);
      const gamesData = await getTeacherGames();
      setGames(gamesData);
    } catch (error) {
      toast.error('Failed to load games');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = async (gameId: string) => {
    try {
      setActionInProgress(gameId);
      await startGame(gameId);
      toast.success('Game started successfully');
      loadGames();
    } catch (error) {
      toast.error('Failed to start game');
      console.error(error);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleEndGame = async (gameId: string) => {
    try {
      setActionInProgress(gameId);
      await endGame(gameId);
      toast.success('Game ended successfully');
      loadGames();
    } catch (error) {
      toast.error('Failed to end game');
      console.error(error);
    } finally {
      setActionInProgress(null);
    }
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
                  {activePlayers} {activePlayers === 1 ? 'player' : 'players'}
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
                  ? 'Live' 
                  : game.status === 'finished' 
                  ? 'Ended' 
                  : 'Lobby'}
              </span>
            </div>
          </div>
          
          <div className="mt-4 border-t border-gray-200 pt-4 flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-700">Game Code:</span>
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
                  Start
                </button>
              )}
              
              {game.status === 'active' && (
                <button
                  onClick={() => handleEndGame(game._id)}
                  disabled={isActionDisabled}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:bg-red-400"
                >
                  <Trash className="h-4 w-4 mr-1" />
                  End
                </button>
              )}
              
              <Link
                to={`/teacher/host/${game._id}`}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
              >
                {game.status === 'active' ? (
                  <>
                    <Play className="h-4 w-4 mr-1" />
                    Host
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-1" />
                    View
                  </>
                )}
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
        <Link
          to="/teacher/create-quiz"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Quiz
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : games.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 mb-8">
          {games.map(renderGameCard)}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Quizzes Created Yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first quiz to get started with engaging your students.
          </p>
          <Link
            to="/teacher/create-quiz"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create First Quiz
          </Link>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboardPage;