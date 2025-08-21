import api from './axios';

interface CreateGameData {
  title: string;
  questionIds: string[];
  mode?: string;
}

interface JoinGameData {
  gameCode: string;
  playerName: string;
}

// Create a new game
export const createGame = async (data: CreateGameData) => {
  const response = await api.post('/games', data);
  return response.data;
};

// Get all games for a teacher
export const getTeacherGames = async () => {
  const response = await api.get('/games/teacher');
  return response.data;
};

// Get a game by ID
export const getGameById = async (gameId: string) => {
  const response = await api.get(`/games/${gameId}`);
  return response.data;
};

// Join a game as student
export const joinGame = async (data: JoinGameData) => {
  const response = await api.post('/games/join', data);
  return response.data;
};

// Start a game
export const startGame = async (gameId: string) => {
  const response = await api.put(`/games/${gameId}/start`);
  return response.data;
};

// End a game
export const endGame = async (gameId: string) => {
  const response = await api.put(`/games/${gameId}/end`);
  return response.data;
};