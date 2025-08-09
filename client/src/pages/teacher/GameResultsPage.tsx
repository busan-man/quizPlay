import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface GameResult {
  playerId: string;
  playerName: string;
  finalScore: number;
  correctAnswers: number;
  totalQuestions: number;
  rank: number;
  characterId?: string;
}

interface GameStats {
  totalPlayers: number;
  averageScore: number;
  highestScore: number;
  totalQuestions: number;
  gameDuration: number;
}

const GameResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [gameId, setGameId] = useState<string>('');

  useEffect(() => {
    const { gameResults: results, gameId: id } = location.state || {};
    if (results && id) {
      setGameResults(results);
      setGameId(id);
      calculateStats(results);
    } else {
      // URL 파라미터에서 게임 ID를 가져와서 서버에서 결과 조회
      const urlParams = new URLSearchParams(window.location.search);
      const gameIdFromUrl = urlParams.get('gameId');
      if (gameIdFromUrl) {
        fetchGameResults(gameIdFromUrl);
      }
    }
  }, [location]);

  const fetchGameResults = async (id: string) => {
    try {
      const response = await fetch(`/api/games/${id}/results`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setGameResults(data.results);
        setGameStats(data.stats);
        setGameId(id);
      }
    } catch (error) {
      console.error('게임 결과 조회 오류:', error);
    }
  };

  const calculateStats = (results: GameResult[]) => {
    if (results.length === 0) return;

    const totalPlayers = results.length;
    const totalScore = results.reduce((sum, result) => sum + result.finalScore, 0);
    const averageScore = Math.round(totalScore / totalPlayers);
    const highestScore = Math.max(...results.map(r => r.finalScore));
    const totalQuestions = results[0]?.totalQuestions || 0;

    setGameStats({
      totalPlayers,
      averageScore,
      highestScore,
      totalQuestions,
      gameDuration: 0 // 서버에서 제공하는 경우 사용
    });
  };

  const handleExportResults = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `game_results_${gameId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateCSV = () => {
    const headers = ['순위', '플레이어명', '캐릭터', '최종점수', '정답수', '총문제수', '정답률'];
    const rows = gameResults.map(result => [
      result.rank,
      result.playerName,
      result.characterId || '-',
      result.finalScore,
      result.correctAnswers,
      result.totalQuestions,
      `${Math.round((result.correctAnswers / result.totalQuestions) * 100)}%`
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const handleBackToDashboard = () => {
    navigate('/teacher/dashboard');
  };

  const handleCreateNewGame = () => {
    navigate('/teacher/game-setup');
  };

  if (!gameResults.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">결과를 찾을 수 없습니다</h1>
          <Button onClick={handleBackToDashboard}>대시보드로 돌아가기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">게임 결과</h1>
          <p className="text-gray-600">게임 ID: {gameId}</p>
        </div>

        {/* 통계 카드 */}
        {gameStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {gameStats.totalPlayers}
              </div>
              <div className="text-gray-600">참가자 수</div>
            </Card>
            <Card className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {gameStats.averageScore}
              </div>
              <div className="text-gray-600">평균 점수</div>
            </Card>
            <Card className="p-6 text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-2">
                {gameStats.highestScore}
              </div>
              <div className="text-gray-600">최고 점수</div>
            </Card>
            <Card className="p-6 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {gameStats.totalQuestions}
              </div>
              <div className="text-gray-600">총 문제 수</div>
            </Card>
          </div>
        )}

        {/* 결과 테이블 */}
        <Card className="p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">최종 순위</h2>
            <Button onClick={handleExportResults} className="bg-green-600 hover:bg-green-700">
              결과 내보내기 (CSV)
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">순위</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">플레이어</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">캐릭터</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">최종 점수</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">정답/총문제</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">정답률</th>
                </tr>
              </thead>
              <tbody>
                {gameResults.map((result, index) => (
                  <tr
                    key={result.playerId}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      index < 3 ? 'bg-yellow-50' : ''
                    }`}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        {index < 3 && (
                          <span className="text-lg mr-2">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                          </span>
                        )}
                        <span className={`font-bold ${
                          index === 0 ? 'text-yellow-600' :
                          index === 1 ? 'text-gray-600' :
                          index === 2 ? 'text-orange-600' : 'text-gray-800'
                        }`}>
                          #{result.rank}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-semibold text-gray-800">
                      {result.playerName}
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {result.characterId || '-'}
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-gray-800">
                      {result.finalScore.toLocaleString()}점
                    </td>
                    <td className="py-4 px-4 text-right text-gray-600">
                      {result.correctAnswers}/{result.totalQuestions}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className={`font-semibold ${
                        (result.correctAnswers / result.totalQuestions) >= 0.8 ? 'text-green-600' :
                        (result.correctAnswers / result.totalQuestions) >= 0.6 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {Math.round((result.correctAnswers / result.totalQuestions) * 100)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 액션 버튼 */}
        <div className="flex justify-center space-x-4">
          <Button onClick={handleBackToDashboard} className="px-6 py-3">
            대시보드로 돌아가기
          </Button>
          <Button onClick={handleCreateNewGame} className="px-6 py-3 bg-green-600 hover:bg-green-700">
            새 게임 만들기
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GameResultsPage; 