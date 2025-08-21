import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
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
      // 서버 사전 참가 없이 바로 Unity 페이지로 이동
      navigate('/unity-game', {
        state: {
          mode: 'student',
          gameCode: data.gameCode,
          playerName: data.playerName,
          // characterId는 Unity 내에서 선택
        }
      });
      toast.success('게임으로 이동 중...');
    } catch (error: any) {
      const message = error?.message || '게임 참가에 실패했습니다';
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
          <h1 className="mt-4 text-2xl font-bold text-white">게임 참가</h1>
          <p className="mt-2 text-indigo-200">
            게임 코드를 입력하여 게임에 참가하세요!
          </p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-8 space-y-6">
          <div>
            <label htmlFor="gameCode" className="block text-sm font-medium text-gray-700">
              게임 코드
            </label>
            <div className="mt-1">
              <input
                id="gameCode"
                type="text"
                maxLength={6}
                {...register('gameCode', { 
                  required: '게임 코드를 입력해주세요',
                  minLength: { value: 6, message: '게임 코드는 6자리 숫자입니다' },
                  maxLength: { value: 6, message: '게임 코드는 6자리 숫자입니다' },
                  
                  pattern: {
                    value: /^\d+$/,
                    message: '게임 코드는 숫자만 입력 가능합니다'
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
                닉네임
              </label>
              <div className="mt-1">
                <input
                  id="playerName"
                  type="text"
                  {...register('playerName', { 
                    required: '닉네임을 입력해주세요',
                    maxLength: { value: 15, message: '닉네임은 15자를 초과할 수 없습니다' }
                  })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="닉네임을 입력하세요"
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
                  참가 중...
                </>
              ) : (
                '게임 참가'
              )}
            </button>
          </div>
        </form>
        
        <div className="px-6 py-4 bg-gray-50 flex items-center justify-center text-gray-500 text-sm">
          <Users className="h-4 w-4 mr-2" />
          <span>선생님이 호스팅하는 게임에 참가하세요</span>
        </div>
      </motion.div>
    </div>
  );
};

export default JoinGamePage;