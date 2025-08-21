import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

type GameMode = 'time' | 'score';

interface GameSetup {
  mode: GameMode;
  timeLimit?: number; // 분 단위
  scoreLimit?: number;
  selectedQuestions: string[];
}

const GameSetupPage: React.FC = () => {
  const [gameSetup, setGameSetup] = useState<GameSetup>({
    mode: 'time',
    timeLimit: 10,
    scoreLimit: 1000,
    selectedQuestions: []
  });

  const navigate = useNavigate();

  const handleModeChange = (mode: GameMode) => {
    setGameSetup(prev => ({ ...prev, mode }));
  };

  const handleTimeLimitChange = (minutes: number) => {
    setGameSetup(prev => ({ ...prev, timeLimit: minutes }));
  };

  const handleScoreLimitChange = (score: number) => {
    setGameSetup(prev => ({ ...prev, scoreLimit: score }));
  };

  const handleStartGame = async () => {
    try {
      // 게임 생성 API 호출
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: `퀴즈 게임 - ${new Date().toLocaleString()}`,
          questionIds: gameSetup.selectedQuestions,
          mode: 'quiz',
          gameSettings: {
            mode: gameSetup.mode,
            timeLimit: gameSetup.timeLimit,
            scoreLimit: gameSetup.scoreLimit
          }
        })
      });

      if (!response.ok) {
        throw new Error('게임 생성에 실패했습니다.');
      }

      const gameData = await response.json();

      // 소켓 브리지가 포함된 UnityGamePage로 이동 (통신 안정)
      navigate('/unity-game', {
        state: {
          mode: 'teacher',
          gameCode: gameData.gameCode,
          gameId: gameData.gameId,
          gameSetup
        }
      });
    } catch (error) {
      console.error('게임 시작 오류:', error);
      alert('게임을 시작할 수 없습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">게임 설정</h1>
          <p className="text-gray-600">게임 규칙을 설정하고 시작하세요!</p>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">게임 모드 선택</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                gameSetup.mode === 'time'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleModeChange('time')}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">⏰</div>
                <h3 className="font-semibold text-gray-800">시간 제한</h3>
                <p className="text-sm text-gray-600">정해진 시간 내에 문제를 풀어보세요</p>
              </div>
            </div>

            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                gameSetup.mode === 'score'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleModeChange('score')}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">🏆</div>
                <h3 className="font-semibold text-gray-800">점수 제한</h3>
                <p className="text-sm text-gray-600">목표 점수에 도달하면 게임 종료</p>
              </div>
            </div>
          </div>

          {gameSetup.mode === 'time' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                게임 시간 (분)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 15, 20, 30, 45].map((minutes) => (
                  <button
                    key={minutes}
                    className={`p-3 border rounded-lg transition-all ${
                      gameSetup.timeLimit === minutes
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => handleTimeLimitChange(minutes)}
                  >
                    {minutes}분
                  </button>
                ))}
              </div>
              <div className="mt-2">
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={gameSetup.timeLimit}
                  onChange={(e) => handleTimeLimitChange(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="직접 입력 (1-120분)"
                />
              </div>
            </div>
          )}

          {gameSetup.mode === 'score' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                목표 점수
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[500, 1000, 1500, 2000, 3000, 5000].map((score) => (
                  <button
                    key={score}
                    className={`p-3 border rounded-lg transition-all ${
                      gameSetup.scoreLimit === score
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => handleScoreLimitChange(score)}
                  >
                    {score}점
                  </button>
                ))}
              </div>
              <div className="mt-2">
                <input
                  type="number"
                  min="100"
                  max="10000"
                  step="100"
                  value={gameSetup.scoreLimit}
                  onChange={(e) => handleScoreLimitChange(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="직접 입력 (100-10000점)"
                />
              </div>
            </div>
          )}
        </Card>

        <div className="text-center">
          <Button
            onClick={handleStartGame}
            className="px-8 py-3 text-lg font-semibold"
          >
            게임 호스트하기
          </Button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">게임 설정 요약</h3>
          <div className="text-sm text-blue-700">
            <p>• 게임 모드: {gameSetup.mode === 'time' ? '시간 제한' : '점수 제한'}</p>
            {gameSetup.mode === 'time' && (
              <p>• 제한 시간: {gameSetup.timeLimit}분</p>
            )}
            {gameSetup.mode === 'score' && (
              <p>• 목표 점수: {gameSetup.scoreLimit}점</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameSetupPage; 