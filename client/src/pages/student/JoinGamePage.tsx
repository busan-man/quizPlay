import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { joinGame } from '../../api/game';
import { useGameStore } from '../../stores/gameStore';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Loader, PlayCircle, Users } from 'lucide-react';
 import { useEffect } from 'react';

type JoinGameFormData = {
  gameCode: string;
  playerName: string;
};

const JoinGamePage = () => {
  const navigate = useNavigate();
  const { setGameInfo } = useGameStore();
  const [isJoining, setIsJoining] = useState(false);
  const [gameCodeValid, setGameCodeValid] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<JoinGameFormData>({
    mode: 'onChange',
  });
  
  const gameCode = watch('gameCode', '');

  useEffect(() => {
    setGameCodeValid(/^\d+$/.test(gameCode));
  }, [gameCode]);

  const onSubmit = async (data: JoinGameFormData) => {
    setIsJoining(true);
    
    try {
      const response = await joinGame({
        gameCode: data.gameCode,
        playerName: data.playerName,
      });
      
      // Store game info in store
      setGameInfo(response.gameId, response.playerId, response.playerName);
      
      toast.success('Joined game successfully!');
      
      // 캐릭터 선택 페이지로 이동
      navigate('/student/character-select', {
        state: {
          gameCode: data.gameCode,
          playerName: response.playerName,
          playerId: response.playerId
        }
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to join game';
      toast.error(message);
    } finally {
      setIsJoining(false);
    }
  };
  
  // Simple validation for game code
  const validateGameCode = (value: string) => {
    setGameCodeValid(value.length === 6 && /^\d+$/.test(value));
    return true;
  };
  
  return (
    <div className="max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg overflow-hidden"
      >
        <div className="bg-indigo-600 px-6 py-8 text-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <PlayCircle className="h-16 w-16 text-white mx-auto" />
          </motion.div>
          <h1 className="mt-4 text-2xl font-bold text-white">Join a Game</h1>
          <p className="mt-2 text-indigo-200">
            Enter a game code to join and start playing!
          </p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-8 space-y-6">
          <div>
            <label htmlFor="gameCode" className="block text-sm font-medium text-gray-700">
              Game Code
            </label>
            <div className="mt-1">
              <input
                id="gameCode"
                type="text"
                maxLength={6}
                {...register('gameCode', { 
                  required: 'Game code is required',
                  minLength: { value: 6, message: 'Game code must be 6 digits' },
                  maxLength: { value: 6, message: 'Game code must be 6 digits' },
                  
                  pattern: {
                    value: /^\d+$/,
                    message: 'Game code must contain only numbers'
                  }
                })}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-3xl text-center font-bold tracking-widest"
                placeholder="123456"
              />
              {errors.gameCode && (
                <p className="mt-2 text-sm text-red-600">{errors.gameCode.message}</p>
              )}
            </div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ 
              opacity: gameCodeValid ? 1 : 0,
              height: gameCodeValid ? 'auto' : 0 
            }}
            className="overflow-hidden"
          >
            <div>
              <label htmlFor="playerName" className="block text-sm font-medium text-gray-700">
                Your Nickname
              </label>
              <div className="mt-1">
                <input
                  id="playerName"
                  type="text"
                  {...register('playerName', { 
                    required: 'Nickname is required',
                    maxLength: { value: 15, message: 'Nickname cannot be longer than 15 characters' }
                  })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your nickname"
                />
                {errors.playerName && (
                  <p className="mt-2 text-sm text-red-600">{errors.playerName.message}</p>
                )}
              </div>
            </div>
          </motion.div>
          
          <div>
            <button
              type="submit"
              disabled={isJoining || !gameCodeValid}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {isJoining ? (
                <>
                  <Loader className="animate-spin h-5 w-5 mr-2" />
                  Joining...
                </>
              ) : (
                'Join Game'
              )}
            </button>
          </div>
        </form>
        
        <div className="px-6 py-4 bg-gray-50 flex items-center justify-center text-gray-500 text-sm">
          <Users className="h-4 w-4 mr-2" />
          <span>Join a game hosted by your teacher</span>
        </div>
      </motion.div>
    </div>
  );
};

export default JoinGamePage;