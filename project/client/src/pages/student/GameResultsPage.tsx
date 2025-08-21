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

interface PlayerResult {
  playerName: string;
  finalScore: number;
  correctAnswers: number;
  totalQuestions: number;
  rank: number;
  characterId?: string;
  accuracy: number;
  timeBonus?: number;
  streakBonus?: number;
}

const GameResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [playerResult, setPlayerResult] = useState<PlayerResult | null>(null);
  const [allResults, setAllResults] = useState<GameResult[]>([]);
  const [showAllResults, setShowAllResults] = useState(false);

  useEffect(() => {
    const { gameResults, playerName } = location.state || {};
    if (gameResults && playerName) {
      const player = gameResults.find((r: GameResult) => r.playerName === playerName);
      if (player) {
        setPlayerResult({
          ...player,
          accuracy: Math.round((player.correctAnswers / player.totalQuestions) * 100)
        });
        setAllResults(gameResults);
      }
    }
  }, [location]);

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-green-600';
    if (accuracy >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceMessage = (accuracy: number, rank: number, totalPlayers: number) => {
    if (accuracy >= 90) return '완벽한 성과입니다! 🎉';
    if (accuracy >= 80) return '훌륭한 성과입니다! 👏';
    if (accuracy >= 60) return '좋은 성과입니다! 👍';
    if (rank <= Math.ceil(totalPlayers * 0.3)) return '상위권에 진입했습니다! 🏆';
    return '다음에는 더 잘할 수 있을 거예요! 💪';
  };

  const handlePlayAgain = () => {
    navigate('/student/join-game');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleShareResult = () => {
    if (navigator.share && playerResult) {
      navigator.share({
        title: '퀴즈 게임 결과',
        text: `${playerResult.playerName}님이 ${playerResult.rank}위로 ${playerResult.finalScore}점을 획득했습니다!`,
        url: window.location.href
      });
    } else {
      // 클립보드에 복사
      const text = `${playerResult?.playerName}님이 ${playerResult?.rank}위로 ${playerResult?.finalScore}점을 획득했습니다!`;
      navigator.clipboard.writeText(text);
      alert('결과가 클립보드에 복사되었습니다!');
    }
  };

  if (!playerResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">결과를 찾을 수 없습니다</h1>
          <Button onClick={handleBackToHome}>홈으로 돌아가기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">게임 완료!</h1>
          <p className="text-gray-600">수고하셨습니다!</p>
        </div>

        {/* 메인 결과 카드 */}
        <Card className="p-8 mb-8 text-center">
          <div className="mb-6">
            <div className="text-6xl mb-4">
              {getRankEmoji(playerResult.rank)}
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {playerResult.rank}위
            </h2>
            <p className="text-lg text-gray-600 mb-4">
              {playerResult.playerName}님
            </p>
            {playerResult.characterId && (
              <p className="text-sm text-gray-500 mb-4">
                캐릭터: {playerResult.characterId}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {playerResult.finalScore.toLocaleString()}
              </div>
              <div className="text-gray-600">최종 점수</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {playerResult.correctAnswers}/{playerResult.totalQuestions}
              </div>
              <div className="text-gray-600">정답 수</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold mb-2 ${getAccuracyColor(playerResult.accuracy)}`}>
                {playerResult.accuracy}%
              </div>
              <div className="text-gray-600">정답률</div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-blue-800 font-semibold">
              {getPerformanceMessage(playerResult.accuracy, playerResult.rank, allResults.length)}
            </p>
          </div>

          <div className="flex justify-center space-x-4">
            <Button onClick={handleShareResult} className="bg-purple-600 hover:bg-purple-700">
              결과 공유하기
            </Button>
            <Button onClick={() => setShowAllResults(!showAllResults)}>
              {showAllResults ? '내 결과만 보기' : '전체 순위 보기'}
            </Button>
          </div>
        </Card>

        {/* 전체 순위 (토글) */}
        {showAllResults && (
          <Card className="p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">전체 순위</h3>
            <div className="space-y-3">
              {allResults
                .sort((a, b) => a.rank - b.rank)
                .map((result, index) => (
                  <div
                    key={result.playerId}
                    className={`flex justify-between items-center p-3 rounded-lg ${
                      result.playerName === playerResult.playerName
                        ? 'bg-blue-100 border-2 border-blue-300'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getRankEmoji(result.rank)}</span>
                      <span className="font-semibold text-gray-800">
                        {result.playerName}
                        {result.playerName === playerResult.playerName && (
                          <span className="ml-2 text-blue-600">(나)</span>
                        )}
                      </span>
                      {result.characterId && (
                        <span className="text-sm text-gray-500">
                          ({result.characterId})
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-800">
                        {result.finalScore.toLocaleString()}점
                      </div>
                      <div className="text-sm text-gray-600">
                        {result.correctAnswers}/{result.totalQuestions} (
                        {Math.round((result.correctAnswers / result.totalQuestions) * 100)}%)
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        )}

        {/* 상세 통계 */}
        <Card className="p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">상세 통계</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">성과 분석</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>전체 참가자 중 순위:</span>
                  <span className="font-semibold">
                    {playerResult.rank} / {allResults.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>상위 퍼센타일:</span>
                  <span className="font-semibold">
                    {Math.round((allResults.length - playerResult.rank + 1) / allResults.length * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>평균 점수 대비:</span>
                  <span className="font-semibold">
                    {(() => {
                      const avgScore = allResults.reduce((sum, r) => sum + r.finalScore, 0) / allResults.length;
                      const diff = playerResult.finalScore - avgScore;
                      return `${diff >= 0 ? '+' : ''}${Math.round(diff)}점`;
                    })()}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">정답률 분석</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>정답률:</span>
                  <span className={`font-semibold ${getAccuracyColor(playerResult.accuracy)}`}>
                    {playerResult.accuracy}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>정답 수:</span>
                  <span className="font-semibold">{playerResult.correctAnswers}개</span>
                </div>
                <div className="flex justify-between">
                  <span>오답 수:</span>
                  <span className="font-semibold">
                    {playerResult.totalQuestions - playerResult.correctAnswers}개
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 액션 버튼 */}
        <div className="flex justify-center space-x-4">
          <Button onClick={handlePlayAgain} className="px-6 py-3 bg-green-600 hover:bg-green-700">
            다시 플레이하기
          </Button>
          <Button onClick={handleBackToHome} className="px-6 py-3">
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GameResultsPage; 