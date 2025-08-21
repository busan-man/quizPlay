import express from 'express';
import {
  saveGameResult,
  getGameResults,
  getGameAnalytics,
  getTeacherGameHistory
} from '../controllers/gameResultController';
import { authMiddleware, authorizeRoles } from '../middleware/auth';
import { UserRole } from '../models/User';

const router = express.Router();

// 게임 결과 저장 (게임 종료 시)
router.post(
  '/',
  authMiddleware,
  saveGameResult
);

// 특정 게임의 결과 조회 (교사만)
router.get(
  '/game/:gameId',
  authMiddleware,
  authorizeRoles(UserRole.TEACHER),
  getGameResults
);

// 게임 분석 데이터 조회 (교사만)
router.get(
  '/analytics/:gameId',
  authMiddleware,
  authorizeRoles(UserRole.TEACHER),
  getGameAnalytics
);

// 교사의 게임 히스토리 조회 (교사만)
router.get(
  '/history',
  authMiddleware,
  authorizeRoles(UserRole.TEACHER),
  getTeacherGameHistory
);

export default router;

