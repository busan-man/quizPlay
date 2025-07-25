import { Server, Socket } from 'socket.io';
import Game, { GameStatus } from '../models/Game';
import jwt from 'jsonwebtoken';

interface SocketUser {
  id: string;
  role: string;
}

interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
  gameId?: string;
  playerId?: string;
}

export const setupSocketHandlers = (io: Server) => {
  // Middleware to authenticate socket connections
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    
    if (token) {
      try {
        const decoded = jwt.verify(
          token, 
          process.env.JWT_SECRET || 'your_jwt_secret'
        ) as SocketUser;
        
        socket.user = decoded;
      } catch (error) {
        // Invalid token, but still allow connection for students without tokens
        console.log('Socket auth error:', error);
      }
    }
    
    next();
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log('New socket connection:', socket.id);

    // Join a game room
    socket.on('join-game', async ({ gameId, playerId }) => {
      try {
        const game = await Game.findById(gameId);
        
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        // Store game info in socket
        socket.gameId = gameId;
        socket.playerId = playerId;
        
        // Join the game room
        socket.join(`game:${gameId}`);
        
        // Notify everyone about new player
        if (playerId) {
          io.to(`game:${gameId}`).emit('player-joined', {
            playerId,
            playerCount: game.players.length
          });
        }
        
        // If it's the teacher joining
        if (socket.user && socket.user.id === game.createdBy.toString()) {
          socket.emit('game-state', {
            game: {
              _id: game._id,
              title: game.title,
              status: game.status,
              players: game.players,
              currentQuestion: game.currentQuestion
            }
          });
        }
      } catch (error) {
        console.error('Join game error:', error);
        socket.emit('error', { message: 'Failed to join game' });
      }
    });

    // Leave game
    socket.on('leave-game', async () => {
      if (socket.gameId) {
        socket.leave(`game:${socket.gameId}`);
        
        if (socket.playerId) {
          try {
            const game = await Game.findById(socket.gameId);
            if (game) {
              // Mark player as inactive
              const playerIndex = game.players.findIndex(p => p.id === socket.playerId);
              
              if (playerIndex !== -1) {
                game.players[playerIndex].isActive = false;
                await game.save();
                
                io.to(`game:${socket.gameId}`).emit('player-left', {
                  playerId: socket.playerId,
                  playerCount: game.players.filter(p => p.isActive).length
                });
              }
            }
          } catch (error) {
            console.error('Leave game error:', error);
          }
        }
      }
    });

    // Send next question (teacher only)
    socket.on('next-question', async () => {
      try {
        if (!socket.user || !socket.gameId) {
          socket.emit('error', { message: 'Not authenticated or not in a game' });
          return;
        }
        
        const game = await Game.findById(socket.gameId)
          .populate('questions', 'prompt type options points timeLimit');
        
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        // Verify user is the game creator
        if (socket.user.id !== game.createdBy.toString()) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }
        
        if (game.status !== GameStatus.ACTIVE) {
          socket.emit('error', { message: 'Game is not active' });
          return;
        }
        
        // Check if we have more questions
        if (game.currentQuestion >= game.questions.length) {
          socket.emit('error', { message: 'No more questions' });
          return;
        }
        
        // Get the current question
        const question = game.questions[game.currentQuestion] as any;
        const questionForPlayers = {
          prompt: (question as any).prompt,
          type: (question as any).type,
          options: (question as any).options,
          points: (question as any).points,
          timeLimit: (question as any).timeLimit
        };
        
        // Send question to all players in the game
        io.to(`game:${socket.gameId}`).emit('question', {
          question: questionForPlayers,
          questionNumber: game.currentQuestion + 1,
          totalQuestions: game.questions.length
        });
        
        // Increment the current question counter
        game.currentQuestion += 1;
        await game.save();
      } catch (error) {
        console.error('Next question error:', error);
        socket.emit('error', { message: 'Failed to send next question' });
      }
    });

    // Submit answer
    socket.on('submit-answer', async ({ answer, timeRemaining }) => {
      try {
        if (!socket.gameId || !socket.playerId) {
          socket.emit('error', { message: 'Not in a game' });
          return;
        }
        
        const game = await Game.findById(socket.gameId)
          .populate('questions');
        
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        if (game.status !== GameStatus.ACTIVE) {
          socket.emit('error', { message: 'Game is not active' });
          return;
        }
        
        // Get the current question (considering it's 0-indexed)
        const questionIndex = game.currentQuestion - 1;
        if (questionIndex < 0 || questionIndex >= game.questions.length) {
          socket.emit('error', { message: 'Invalid question' });
          return;
        }
        
        const question = game.questions[questionIndex];
        
        // Check if the answer is correct
        const isCorrect = Array.isArray((question as any).correctAnswer)
          ? (question as any).correctAnswer.includes(answer)
          : (question as any).correctAnswer === answer;
        
        let pointsEarned = 0;
        
        if (isCorrect) {
          // Calculate points based on time remaining
          const timePercent = timeRemaining / ((question as any).timeLimit || 30);
          pointsEarned = Math.round((question as any).points * (0.5 + 0.5 * timePercent));
          
          // Find player and update score
          const playerIndex = game.players.findIndex(p => p.id === socket.playerId);
          
          if (playerIndex !== -1) {
            game.players[playerIndex].score += pointsEarned;
            await game.save();
          }
        }
        
        // Send result to the player
        socket.emit('answer-result', {
          correct: isCorrect,
          pointsEarned,
          correctAnswer: (question as any).correctAnswer
        });
        
        // Notify teacher about the answer
        io.to(`game:${socket.gameId}`).emit('player-answer', {
          playerId: socket.playerId,
          correct: isCorrect,
          pointsEarned
        });
        
        // Send updated scores to everyone
        io.to(`game:${socket.gameId}`).emit('update-scores', {
          players: game.players
            .filter(p => p.isActive)
            .sort((a, b) => b.score - a.score)
            .map(p => ({
              id: p.id,
              name: p.name,
              score: p.score
            }))
        });
      } catch (error) {
        console.error('Submit answer error:', error);
        socket.emit('error', { message: 'Failed to submit answer' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log('Socket disconnected:', socket.id);
      
      if (socket.gameId && socket.playerId) {
        try {
          const game = await Game.findById(socket.gameId);
          
          if (game) {
            // Mark player as inactive
            const playerIndex = game.players.findIndex(p => p.id === socket.playerId);
            
            if (playerIndex !== -1) {
              game.players[playerIndex].isActive = false;
              await game.save();
              
              io.to(`game:${socket.gameId}`).emit('player-left', {
                playerId: socket.playerId,
                playerCount: game.players.filter(p => p.isActive).length
              });
            }
          }
        } catch (error) {
          console.error('Disconnect handler error:', error);
        }
      }
    });
  });
};