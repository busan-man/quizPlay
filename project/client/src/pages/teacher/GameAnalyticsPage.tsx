import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { ArrowLeft, Users, Trophy, Clock, Target } from 'lucide-react';

interface GameAnalytics {
  gameInfo: {
    _id: string;
    title: string;
    createdAt: string;
    totalQuestions: number;
  };
  totalParticipants: number;
  analytics: {
    averageScore: number;
    averageAccuracy: number;
    averageTime: number;
    scoreDistribution: Record<string, number>;
    questionAnalysis: Array<{
      questionId: string;
      prompt: string;
      correctRate: number;
      averageTime: number;
      totalResponses: number;
      difficulty: string;
    }>;
    topPerformers: Array<{
      playerName: string;
      finalScore: number;
      accuracyRate: number;
      rank: number;
    }>;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const GameAnalyticsPage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<GameAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (gameId) {
      fetchAnalytics();
    }
  }, [gameId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/game-results/analytics/${gameId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600 text-center">
          <p className="text-xl mb-4">{error}</p>
          <button
            onClick={() => navigate('/teacher')}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!analytics || analytics.totalParticipants === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">아직 게임 결과가 없습니다.</p>
          <button
            onClick={() => navigate('/teacher')}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 점수 분포 데이터 변환
  const scoreDistributionData = Object.entries(analytics.analytics.scoreDistribution).map(([range, count]) => ({
    range,
    count,
    percentage: ((count / analytics.totalParticipants) * 100).toFixed(1)
  }));

  // 문제별 분석 데이터
  const questionAnalysisData = analytics.analytics.questionAnalysis.map((q, index) => ({
    ...q,
    questionNumber: index + 1,
    shortPrompt: q.prompt.length > 30 ? q.prompt.substring(0, 30) + '...' : q.prompt
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/teacher')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              대시보드로 돌아가기
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{analytics.gameInfo.title}</h1>
              <p className="text-gray-600">
                {new Date(analytics.gameInfo.createdAt).toLocaleDateString('ko-KR')} 게임 분석
              </p>
            </div>
          </div>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">참가자 수</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalParticipants}명</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">평균 점수</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(analytics.analytics.averageScore)}점</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Target className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">평균 정답률</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(analytics.analytics.averageAccuracy)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">평균 소요시간</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(analytics.analytics.averageTime)}초</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 점수 분포 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">점수 분포</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}명`, '참가자 수']} />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 상위 성과자 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">상위 성과자</h3>
            <div className="space-y-3">
              {analytics.analytics.topPerformers.map((performer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-yellow-600' : 'bg-gray-300'
                    }`}>
                      {performer.rank}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{performer.playerName}</p>
                      <p className="text-sm text-gray-600">정답률: {Math.round(performer.accuracyRate)}%</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{performer.finalScore}점</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 문제별 분석 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">문제별 분석</h3>
          <div className="mb-4">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={questionAnalysisData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="questionNumber" label={{ value: '문제 번호', position: 'insideBottom', offset: -10 }} />
                <YAxis label={{ value: '정답률 (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  formatter={(value, name) => [`${value}%`, '정답률']}
                  labelFormatter={(label) => `문제 ${label}`}
                />
                <Bar dataKey="correctRate" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 문제별 상세 정보 */}
          <div className="mt-6">
            <h4 className="text-md font-semibold text-gray-900 mb-3">문제별 상세 분석</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">문제</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">정답률</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">평균 응답시간</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">난이도</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {questionAnalysisData.map((question, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">문제 {question.questionNumber}</div>
                        <div className="text-sm text-gray-500">{question.shortPrompt}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          question.correctRate >= 80 ? 'bg-green-100 text-green-800' :
                          question.correctRate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {question.correctRate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {question.averageTime}초
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {question.difficulty === 'easy' ? '쉬움' : 
                           question.difficulty === 'medium' ? '보통' : '어려움'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameAnalyticsPage;

