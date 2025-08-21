import { Request, Response } from 'express';
import GameResult from '../models/GameResult';
import Game from '../models/Game';
import Question from '../models/Question';

// 게임 결과 저장 (게임 종료 시 호출)
export const saveGameResult = async (req: Request, res: Response) => {
  try {
    const {
      gameId, playerId, playerName, characterId, 
      finalScore, answers, totalTime
    } = req.body;

    if (!gameId || !playerId || !playerName || !answers) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    // 정답 수 계산
    const correctAnswers = answers.filter((answer: any) => answer.isCorrect).length;
    const totalQuestions = answers.length;

    // 평균 응답 시간 계산
    const totalResponseTime = answers.reduce((sum: number, answer: any) => sum + answer.timeSpent, 0);
    const averageResponseTime = totalResponseTime / totalQuestions;

    // 정답률 계산
    const accuracyRate = (correctAnswers / totalQuestions) * 100;

    // 현재 게임의 모든 결과를 가져와서 순위 계산
    const gameResults = await GameResult.find({ gameId }).sort({ finalScore: -1 });
    const rank = gameResults.length + 1; // 임시 순위 (저장 후 재계산)

    // 게임 결과 저장
    const gameResult = new GameResult({
      gameId,
      playerId,
      playerName,
      characterId,
      finalScore,
      correctAnswers,
      totalQuestions,
      totalTime,
      answers,
      rank,
      averageResponseTime,
      accuracyRate
    });

    await gameResult.save();

    // 모든 결과 다시 조회하여 순위 재계산
    await recalculateRanks(gameId);

    res.status(201).json(gameResult);
  } catch (error) {
    console.error('Save game result error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 특정 게임의 모든 결과 조회
export const getGameResults = async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // 게임 소유자 확인
    const game = await Game.findById(gameId);
    if (!game || game.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const results = await GameResult.find({ gameId })
      .populate('answers.questionId', 'prompt type options correctAnswer')
      .sort({ rank: 1 });

    res.json(results);
  } catch (error) {
    console.error('Get game results error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 게임 통계 분석
export const getGameAnalytics = async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // 게임 소유자 확인
    const game = await Game.findById(gameId).populate('questions');
    if (!game || game.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const results = await GameResult.find({ gameId });

    if (results.length === 0) {
      return res.json({
        gameInfo: game,
        totalParticipants: 0,
        analytics: null
      });
    }

    // 전체 통계 계산
    const analytics = {
      totalParticipants: results.length,
      averageScore: results.reduce((sum, r) => sum + r.finalScore, 0) / results.length,
      averageAccuracy: results.reduce((sum, r) => sum + r.accuracyRate, 0) / results.length,
      averageTime: results.reduce((sum, r) => sum + r.totalTime, 0) / results.length,
      scoreDistribution: calculateScoreDistribution(results),
      questionAnalysis: calculateQuestionAnalysis(results, game.questions as any[]),
      topPerformers: results.slice(0, 5).map(r => ({
        playerName: r.playerName,
        finalScore: r.finalScore,
        accuracyRate: r.accuracyRate,
        rank: r.rank
      }))
    };

    res.json({
      gameInfo: {
        _id: game._id,
        title: game.title,
        createdAt: game.createdAt,
        startedAt: game.startedAt,
        endedAt: game.endedAt,
        totalQuestions: game.questions.length
      },
      totalParticipants: results.length,
      analytics
    });
  } catch (error) {
    console.error('Get game analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 교사의 모든 게임 결과 조회
export const getTeacherGameHistory = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 교사가 생성한 게임들 조회
    const games = await Game.find({ createdBy: req.user.id })
      .select('title gameCode status createdAt startedAt endedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // 각 게임별 참가자 수와 평균 점수 계산
    const gameHistory = await Promise.all(
      games.map(async (game) => {
        const results = await GameResult.find({ gameId: game._id });
        const participantCount = results.length;
        const averageScore = participantCount > 0 
          ? results.reduce((sum, r) => sum + r.finalScore, 0) / participantCount 
          : 0;

        return {
          ...game.toObject(),
          participantCount,
          averageScore: Math.round(averageScore)
        };
      })
    );

    const totalGames = await Game.countDocuments({ createdBy: req.user.id });

    res.json({
      games: gameHistory,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalGames / Number(limit)),
        totalGames
      }
    });
  } catch (error) {
    console.error('Get teacher game history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 순위 재계산
async function recalculateRanks(gameId: string) {
  const results = await GameResult.find({ gameId }).sort({ finalScore: -1 });
  
  for (let i = 0; i < results.length; i++) {
    await GameResult.findByIdAndUpdate(results[i]._id, { rank: i + 1 });
  }
}

// 점수 분포 계산
function calculateScoreDistribution(results: any[]) {
  const distribution = {
    '0-20': 0,
    '21-40': 0,
    '41-60': 0,
    '61-80': 0,
    '81-100': 0
  };

  results.forEach(result => {
    const score = result.accuracyRate;
    if (score <= 20) distribution['0-20']++;
    else if (score <= 40) distribution['21-40']++;
    else if (score <= 60) distribution['41-60']++;
    else if (score <= 80) distribution['61-80']++;
    else distribution['81-100']++;
  });

  return distribution;
}

// 문제별 분석 계산
function calculateQuestionAnalysis(results: any[], questions: any[]) {
  const questionStats = questions.map(question => {
    const questionAnswers = results.flatMap(result => 
      result.answers.filter((answer: any) => 
        answer.questionId.toString() === question._id.toString()
      )
    );

    const correctCount = questionAnswers.filter(answer => answer.isCorrect).length;
    const totalCount = questionAnswers.length;
    const correctRate = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;
    const averageTime = totalCount > 0 
      ? questionAnswers.reduce((sum: number, answer: any) => sum + answer.timeSpent, 0) / totalCount 
      : 0;

    return {
      questionId: question._id,
      prompt: question.prompt,
      correctRate: Math.round(correctRate),
      averageTime: Math.round(averageTime),
      totalResponses: totalCount,
      difficulty: correctRate > 80 ? 'easy' : correctRate > 50 ? 'medium' : 'hard'
    };
  });

  return questionStats;
}

