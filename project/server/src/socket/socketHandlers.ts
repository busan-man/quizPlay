import { Server, Socket } from 'socket.io';
import Game, { GameStatus, IGame } from '../models/Game';
import Question from '../models/Question';
import jwt from 'jsonwebtoken';

interface SocketUser {
  id: string;
  role: string;
  gameCode?: string;
  playerName?: string;
  isGuest?: boolean;
}

interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
  gameId?: string;
  playerId?: string;
  gameCode?: string;
  playerName?: string;
  characterId?: string;
}

export const setupSocketHandlers = (io: Server) => {
  // 하트비트를 통한 비활성 플레이어 정리 (5분마다)
  setInterval(async () => {
    try {
      const games = await Game.find({ status: GameStatus.LOBBY });
      for (const game of games) {
        let playersRemoved = false;
        
        // 각 플레이어의 소켓 연결 상태 확인
        const activePlayers = [];
        for (const player of game.players) {
          const playerSocket = Array.from(io.sockets.sockets.values())
            .find(s => (s as AuthenticatedSocket).playerId === player.id);
          
          if (playerSocket && playerSocket.connected) {
            activePlayers.push(player);
          } else {
            console.log(`비활성 플레이어 제거: ${player.id} (${player.name})`);
            io.to(`game:${game._id}`).emit('playerLeft', player.id);
            playersRemoved = true;
          }
        }
        
        if (playersRemoved) {
          game.players = activePlayers;
          await game.save();
          console.log(`게임 ${game.gameCode}: 비활성 플레이어 정리 완료`);
        }
      }
    } catch (error) {
      console.error('하트비트 정리 오류:', error);
    }
  }, 5 * 60 * 1000); // 5분마다 실행

  // Middleware to authenticate socket connections
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    const role = socket.handshake.auth.role;
    const gameCode = socket.handshake.auth.gameCode;
    const playerName = socket.handshake.auth.playerName;
    
    if (token) {
      try {
        // JWT 토큰 검증 시도
        const decoded = jwt.verify(
          token, 
          process.env.JWT_SECRET || 'your_jwt_secret'
        ) as SocketUser;
        
        socket.user = decoded;
        console.log('JWT 토큰 인증 성공:', decoded.id);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log('JWT 토큰 검증 실패, 게스트 토큰 처리 시도:', errorMessage);
        
        // 게스트 토큰인 경우 (guest_로 시작하거나 3부분으로 나뉜 JWT 형식)
        if (token.startsWith('guest_') || token.includes('.')) {
          // 게스트 사용자 생성
          const guestUser: SocketUser = {
            id: token.startsWith('guest_') ? token : `guest_${Date.now()}`,
            role: role || 'student',
            gameCode: gameCode,
            playerName: playerName,
            isGuest: true
          };
          
          socket.user = guestUser;
          console.log('게스트 토큰 인증 성공:', guestUser.id);
        }
      }
    } else if (role || gameCode) {
      // 토큰이 없지만 역할이나 게임코드가 있는 경우 게스트로 처리
      const guestUser: SocketUser = {
        id: `guest_${socket.id}_${Date.now()}`,
        role: role || 'student',
        gameCode: gameCode,
        playerName: playerName,
        isGuest: true
      };
      
      socket.user = guestUser;
      console.log('게스트 사용자 자동 생성:', guestUser.id);
    }
    
    next();
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log('New socket connection:', socket.id);

    // Join a game as student (Unity integration)
    socket.on('joinGame', async ({ gameCode, playerName, characterId, character }) => {
      console.log('=== joinGame 이벤트 수신 ===');
      console.log('요청 데이터:', { gameCode, playerName, characterId, character });
      console.log('소켓 ID:', socket.id);
      console.log('소켓 현재 게임 정보:', { gameId: socket.gameId, playerId: socket.playerId });
      
      // 이미 이 소켓이 게임에 참가한 경우 중복 방지
      if (socket.gameId && socket.playerId) {
        console.log(`소켓 ${socket.id}는 이미 게임 ${socket.gameId}에 참가 중 (플레이어: ${socket.playerId})`);
        socket.emit('error', { message: 'Already joined a game' });
        return;
      }
      
      // characterId와 character 둘 다 처리 (호환성)
      const finalCharacterId = characterId || character || '0';
      console.log('최종 characterId:', finalCharacterId);
      
      try {
        const game = await Game.findOne({ gameCode });
        
        if (!game) {
          console.log('게임을 찾을 수 없음:', gameCode);
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        console.log('게임 발견:', { gameId: game._id, status: game.status, playersCount: game.players.length });

        // 게임 상태에 따른 플레이어 목록 정리
        if (game.status === GameStatus.LOBBY) {
          // 로비 상태일 때: 모든 이전 플레이어 제거
          const activePlayerCount = game.players.filter(p => p.isActive && p.isConnected).length;
          console.log(`로비 상태 - 기존 활성 플레이어: ${activePlayerCount}명`);
          
          // 연결되지 않은 플레이어들 제거
          game.players = game.players.filter(p => p.isConnected && p.isActive);
          console.log(`로비 정리 후 플레이어 수: ${game.players.length}명`);
        }

        if (game.status === GameStatus.FINISHED) {
          console.log('게임이 이미 종료됨');
          socket.emit('error', { message: 'Game has already ended' });
          return;
        }
        
        // ACTIVE 상태의 게임도 참가 허용 (실시간 참가)
        if (game.status === GameStatus.ACTIVE) {
          console.log('진행 중인 게임에 실시간 참가 허용');
        }

        // Generate a unique player ID
        const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Check for duplicate name and auto-generate unique name
        let finalPlayerName = playerName;
        let nameCounter = 1;
        
        // 더 정확한 중복 검사: 현재 게임의 활성 플레이어만 확인
        while (game.players.some(player => 
          player.isActive && player.name === finalPlayerName
        )) {
          finalPlayerName = `${playerName}_${nameCounter}`;
          nameCounter++;
          
          // 무한 루프 방지 (최대 10번까지만 시도)
          if (nameCounter > 10) {
            finalPlayerName = `${playerName}_${Date.now()}`;
            console.log(`이름 중복으로 타임스탬프 사용: ${playerName} → ${finalPlayerName}`);
            break;
          }
          
          console.log(`이름 중복으로 자동 변경: ${playerName} → ${finalPlayerName}`);
        }
        
        if (finalPlayerName !== playerName) {
          console.log(`최종 플레이어 이름: ${finalPlayerName}`);
        }
        
        // 재연결 처리 로직 - 더 정확한 중복 체크
        const existingPlayer = game.players.find(p => 
          p.name === finalPlayerName && p.isActive
        );
        
        // 이미 연결된 플레이어인지 확인
        if (existingPlayer && existingPlayer.isConnected) {
          console.log('이미 연결된 플레이어 중복 참가 시도:', finalPlayerName);
          socket.emit('error', { message: 'Already connected to this game' });
          return;
        }
        
        if (existingPlayer) {
          console.log('기존 플레이어 재연결:', finalPlayerName);
          
          // 재연결 처리
          existingPlayer.isConnected = true;
          existingPlayer.isActive = true;
          existingPlayer.lastActiveAt = new Date();
          existingPlayer.characterId = finalCharacterId;
          
          // 소켓 정보 업데이트
          socket.gameId = game._id.toString();
          socket.gameCode = gameCode;
          socket.playerId = existingPlayer.id;
          socket.playerName = finalPlayerName;
          socket.characterId = finalCharacterId;
          
          // 룸 재참가
          socket.join(`game:${game._id}`);
          
          await game.save();
          
          // 재연결 알림
          io.to(`game:${game._id}`).emit('playerReconnected', {
            id: existingPlayer.id,
            name: finalPlayerName,
            characterId: finalCharacterId
          });
          
          // 현재 게임 상태 전송
          const gameJoinedData = {
            gameId: game._id,
            playerId: existingPlayer.id,
            gameStatus: game.status,
            currentPlayers: game.players.filter(p => p.isActive && p.isConnected)
          };
          socket.emit('gameJoined', gameJoinedData);
          
          console.log(`플레이어 ${finalPlayerName} 재연결 완료`);
          return;
        }

        // 같은 이름의 이전 플레이어들과 연결된 소켓들을 정리
        const roomSockets = io.sockets.adapter.rooms.get(`game:${game._id}`);
        if (roomSockets) {
          for (const existingSocketId of roomSockets) {
            const existingSocket = io.sockets.sockets.get(existingSocketId) as AuthenticatedSocket;
            if (existingSocket && 
                existingSocket.id !== socket.id && 
                existingSocket.playerName === finalPlayerName) {
              console.log(`같은 이름의 이전 소켓 ${existingSocketId} (${existingSocket.playerName}) 연결 해제`);
              existingSocket.leave(`game:${game._id}`);
              existingSocket.disconnect(true);
            }
          }
        }

        // Add player to game
        game.players.push({
          id: playerId,
          name: finalPlayerName,
          score: 0,
          isActive: true,
          isConnected: true,
          characterId: finalCharacterId,
          joinedAt: new Date(),
          lastActiveAt: new Date(),
          correctAnswers: 0
        });

        // 게임에 너무 많은 플레이어가 쌓이는 것을 방지 (최대 50명까지만 유지)
        if (game.players.length > 50)
        {
          // 비활성 플레이어들을 joinedAt 기준으로 정렬하여 가장 오래된 것부터 제거
          const sortedPlayers = game.players.sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());
          
          // 활성 플레이어는 보존하고, 비활성 플레이어만 제거
          const activePlayers = sortedPlayers.filter(p => p.isActive && p.isConnected);
          const inactivePlayers = sortedPlayers.filter(p => !p.isActive || !p.isConnected);
          
          const playersToRemove = game.players.length - 50;
          const removedPlayers = inactivePlayers.slice(0, playersToRemove);
          
          game.players = [...activePlayers, ...inactivePlayers.slice(playersToRemove)];
          
          console.log(`게임 플레이어 수 제한 (50명): ${removedPlayers.length}명의 비활성 플레이어 제거됨`);
        }
        
        // 정기적인 플레이어 목록 정리 (비활성 플레이어 제거)
        const now = new Date();
        const inactiveThreshold = 5 * 60 * 1000; // 5분
        
        game.players = game.players.filter(player => {
          if (!player.isActive && !player.isConnected) {
            const timeSinceLastActive = now.getTime() - new Date(player.lastActiveAt).getTime();
            if (timeSinceLastActive > inactiveThreshold) {
              console.log(`비활성 플레이어 제거: ${player.name} (${timeSinceLastActive / 1000}초 비활성)`);
              return false;
            }
          }
          return true;
        });

        // 재시도 로직으로 VersionError 해결
        let saveAttempts = 0;
        const maxAttempts = 3;
        
        while (saveAttempts < maxAttempts) {
          try {
            await game.save();
            console.log(`게임 저장 성공 - 시도 ${saveAttempts + 1}/${maxAttempts}`);
            break;
          } catch (saveError: any) {
            saveAttempts++;
            
            if (saveError.name === 'VersionError' && saveAttempts < maxAttempts) {
              console.log(`VersionError 발생 - 재시도 ${saveAttempts}/${maxAttempts}`);
              
              // 게임 문서를 다시 가져와서 최신 상태로 업데이트
              const freshGame = await Game.findById(game._id);
              if (!freshGame) {
                throw new Error('게임을 찾을 수 없습니다');
              }
              
              // 플레이어가 이미 추가되었는지 확인
              const existingPlayer = freshGame.players.find((p: any) => p.id === playerId);
              if (existingPlayer) {
                console.log(`플레이어 ${finalPlayerName} 이미 게임에 존재함 - 재시도 중단`);
                // 최신 게임 상태를 현재 변수에 반영
                Object.assign(game, freshGame.toObject());
                break;
              }
              
              // 새로운 게임 상태에 플레이어 추가
              freshGame.players.push({
                id: playerId,
                name: finalPlayerName,
                score: 0,
                isActive: true,
                isConnected: true,
                characterId: finalCharacterId,
                joinedAt: new Date(),
                lastActiveAt: new Date(),
                correctAnswers: 0
              });
              
              // 최신 게임 상태를 현재 변수에 반영
              Object.assign(game, freshGame.toObject());
              await new Promise(resolve => setTimeout(resolve, 100)); // 100ms 대기
            } else {
              throw saveError;
            }
          }
        }
        
        if (saveAttempts >= maxAttempts) {
          throw new Error(`게임 저장 실패 - 최대 재시도 횟수 초과 (${maxAttempts})`);
        }

        // Store game info in socket
        socket.gameId = game._id.toString();
        socket.gameCode = gameCode;
        socket.playerId = playerId;
        socket.playerName = finalPlayerName;
        socket.characterId = finalCharacterId;
        
        // Join the game room
        socket.join(`game:${game._id}`);
        console.log(`소켓 ${socket.id}가 게임 룸 game:${game._id}에 참가`);
        
        // Notify everyone about new player
        const playerJoinedData = {
          id: playerId,
          name: finalPlayerName,
          score: 0,
          characterId: finalCharacterId,
          isActive: true,
          isConnected: true
        };
        
        console.log('모든 룸 참가자에게 playerJoined 이벤트 전송:', playerJoinedData);
        const currentRoomSockets = io.sockets.adapter.rooms.get(`game:${game._id}`);
        console.log(`룸 game:${game._id}의 소켓 수:`, currentRoomSockets?.size || 0);
        if (currentRoomSockets) {
          console.log('룸에 있는 소켓들:', Array.from(currentRoomSockets));
        }
        
        io.to(`game:${game._id}`).emit('playerJoined', playerJoinedData);
        console.log(`playerJoined 이벤트 전송 완료 - 룸: game:${game._id}`);

        // Send current game state to the player
        const activePlayers = game.players.filter(p => p.isActive && p.isConnected);
        const gameJoinedData = {
          gameId: game._id,
          playerId: playerId,
          gameStatus: game.status,
          currentPlayers: activePlayers,
          playerCount: activePlayers.length,
          totalSocketsInRoom: currentRoomSockets?.size || 0
        };
        
        console.log(`게임 상태 전송: 활성 플레이어 ${activePlayers.length}명, 룸 소켓 ${currentRoomSockets?.size || 0}개`);
        
        console.log('학생에게 gameJoined 이벤트 전송:', gameJoinedData);
        socket.emit('gameJoined', gameJoinedData);
        
      } catch (error) {
        console.error('Join game error:', error);
        socket.emit('error', { message: 'Failed to join game' });
      }
    });

    // Host a game as teacher (Unity integration)
    socket.on('hostGame', async ({ gameId, gameCode }) => {
      console.log('=== hostGame 이벤트 수신 ===');
      console.log('요청 데이터:', { gameId, gameCode });
      console.log('소켓 ID:', socket.id);
      console.log('사용자 인증 상태:', !!socket.user);
      
      try {
        if (!socket.user) {
          console.log('인증되지 않은 사용자');
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }
        
        console.log('사용자 인증 정보:', {
          id: socket.user.id,
          role: socket.user.role,
          isGuest: socket.user.isGuest,
          gameCode: socket.user.gameCode
        });

        const game = await Game.findById(gameId);
        
        if (!game) {
          console.log('게임을 찾을 수 없음:', gameId);
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        console.log('게임 발견:', { gameId: game._id, status: game.status, createdBy: game.createdBy });
        console.log('사용자 인증 체크:', { 
          socketUserId: socket.user.id, 
          gameCreatedBy: game.createdBy.toString(),
          isMatch: socket.user.id === game.createdBy.toString()
        });

        // Verify user is the game creator
        const isGameCreator = socket.user.id === game.createdBy.toString();
        const isDevelopment = process.env.NODE_ENV !== 'production';
        
        if (!isGameCreator) {
          console.log(`인증 체크: 사용자 ${socket.user.id} vs 게임 생성자 ${game.createdBy}`);
          
          if (!isDevelopment) {
            console.log('프로덕션 환경: 인증 실패 - 접근 거부');
            socket.emit('error', { message: 'Not authorized' });
            return;
          } else {
            console.log('개발 환경: 인증 체크 우회 허용 (보안 주의)');
          }
        } else {
          console.log('인증 성공: 게임 생성자 확인됨');
        }
        
        console.log('인증 성공: 게임 호스팅 권한 확인됨');

        // 같은 게임의 이전 교사 소켓들을 찾아서 정리
        const roomSockets = io.sockets.adapter.rooms.get(`game:${gameId}`);
        if (roomSockets) {
          console.log(`기존 룸 소켓 수: ${roomSockets.size}`);
          for (const existingSocketId of roomSockets) {
            const existingSocket = io.sockets.sockets.get(existingSocketId) as AuthenticatedSocket;
            if (existingSocket && existingSocket.id !== socket.id) {
              console.log(`이전 소켓 ${existingSocketId} 연결 해제 요청`);
              existingSocket.leave(`game:${gameId}`);
              existingSocket.disconnect(true);
            }
          }
        }

        // 게임 호스팅 시 플레이어 목록 초기화
        const originalPlayerCount = game.players.length;
        game.players = []; // 새 게임 시작 시 모든 이전 플레이어 제거
        
        if (originalPlayerCount > 0) {
          console.log(`게임 호스팅: ${originalPlayerCount}명의 이전 플레이어 제거됨`);
        }
        
        // 게임 상태를 LOBBY로 설정
        game.status = GameStatus.LOBBY;
        await game.save();

        // Store game info in socket
        socket.gameId = gameId;
        socket.gameCode = gameCode;
        
        // Join the game room
        socket.join(`game:${gameId}`);
        console.log(`교사 소켓 ${socket.id}가 게임 룸 game:${gameId}에 참가`);
        console.log(`룸 game:${gameId}의 소켓 수:`, io.sockets.adapter.rooms.get(`game:${gameId}`)?.size || 0);
        
        // Send current game state to the host
        const activePlayersForTeacher = game.players.filter(p => p.isActive && p.isConnected);
        const currentRoomSockets = io.sockets.adapter.rooms.get(`game:${gameId}`);
        
        const gameHostedData = {
          gameId: game._id,
          gameCode: game.gameCode,
          gameStatus: game.status,
          currentPlayers: activePlayersForTeacher,
          playerCount: activePlayersForTeacher.length,
          totalSocketsInRoom: currentRoomSockets?.size || 0,
          questions: game.questions.length
        };
        
        console.log(`교사에게 gameHosted 이벤트 전송: 활성 플레이어 ${activePlayersForTeacher.length}명, 룸 소켓 ${currentRoomSockets?.size || 0}개`);
        console.log('gameHosted 데이터:', gameHostedData);
        socket.emit('gameHosted', gameHostedData);


        
      } catch (error) {
        console.error('Host game error:', error);
        socket.emit('error', { message: 'Failed to host game' });
      }
    });

    // Start game (teacher only)
    socket.on('startGame', async ({ gameId }) => {
      try {
        if (!socket.user || !socket.gameId) {
          socket.emit('error', { message: 'Not authenticated or not in a game' });
          return;
        }
        
        const game = await Game.findById(gameId);
        
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        // Verify user is the game creator (개발 환경에서는 완화)
        if (socket.user.id !== game.createdBy.toString()) {
          console.log('startGame 인증 실패: 사용자가 게임 생성자가 아님');
          console.log('개발 환경에서 인증 체크 우회 중...');
          
          // 개발 환경에서는 경고만 출력하고 계속 진행
          if (process.env.NODE_ENV === 'production') {
            socket.emit('error', { message: 'Not authorized' });
            return;
          } else {
            console.log('개발 환경: startGame 인증 체크 우회됨');
          }
        }
        
          // Idempotent behavior: if already active, rebroadcast gameStarted for late joiners
          if (game.status === GameStatus.ACTIVE) {
            io.to(`game:${gameId}`).emit('gameStarted', {
              gameId: game._id,
              startedAt: game.startedAt || new Date(),
              totalQuestions: game.questions.length
            });
            return;
          }
          if (game.status === GameStatus.FINISHED) {
            socket.emit('error', { message: 'Game has already ended' });
            return;
          }

        game.status = GameStatus.ACTIVE;
        game.startedAt = new Date();
        game.currentQuestion = 0;
        await game.save();

        // Notify all players that game has started
        io.to(`game:${gameId}`).emit('gameStarted', {
          gameId: game._id,
          startedAt: game.startedAt,
          totalQuestions: game.questions.length,
          skipThemeSelection: true // 테마 선택 건너뛰기
        });
        
        // 첫 번째 문제 자동 전송 (3초 후)
        setTimeout(async () => {
          try {
            if (game.questions.length > 0) {
              const firstQuestion = await Question.findById(game.questions[0]);
              
              if (firstQuestion) {
                game.currentQuestion = 0;
                await game.save();
                
                console.log('첫 번째 문제 자동 전송:', firstQuestion.prompt);
                
                io.to(`game:${gameId}`).emit('questionStarted', {
                  questionNumber: 1,
                  totalQuestions: game.questions.length,
                  question: firstQuestion.prompt,
                  options: firstQuestion.options,
                  timeLimit: 30, // 30초 제한시간
                  questionId: firstQuestion._id
                });
              }
            }
          } catch (error) {
            console.error('첫 번째 문제 전송 오류:', error);
          }
        }, 3000); // 3초 후 첫 문제 시작
        
      } catch (error) {
        console.error('Start game error:', error);
        socket.emit('error', { message: 'Failed to start game' });
      }
    });

    // End game (teacher only)
    socket.on('endGame', async ({ gameId }) => {
      try {
        if (!socket.user || !socket.gameId) {
          socket.emit('error', { message: 'Not authenticated or not in a game' });
          return;
        }
        
        const game = await Game.findById(gameId);
        
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        // Verify user is the game creator (개발 환경에서는 완화)
        if (socket.user.id !== game.createdBy.toString()) {
          console.log('endGame 인증 실패: 사용자가 게임 생성자가 아님');
          console.log('개발 환경에서 인증 체크 우회 중...');
          
          // 개발 환경에서는 경고만 출력하고 계속 진행
          if (process.env.NODE_ENV === 'production') {
            socket.emit('error', { message: 'Not authorized' });
            return;
          } else {
            console.log('개발 환경: endGame 인증 체크 우회됨');
          }
        }
        
        if (game.status !== GameStatus.ACTIVE) {
          socket.emit('error', { message: 'Game is not active' });
          return;
        }

        game.status = GameStatus.FINISHED;
        game.endedAt = new Date();
        await game.save();

        // Calculate final results
        const results = game.players
          .filter(p => p.isActive && p.isConnected)
          .sort((a, b) => b.score - a.score)
          .map((player, index) => ({
            playerId: player.id,
            playerName: player.name,
            finalScore: player.score,
            correctAnswers: player.correctAnswers || 0,
            totalQuestions: game.questions.length,
            rank: index + 1,
            characterId: player.characterId
          }));

        // Notify all players that game has ended
        io.to(`game:${gameId}`).emit('gameEnded', results);
        
      } catch (error) {
        console.error('End game error:', error);
        socket.emit('error', { message: 'Failed to end game' });
      }
    });

    // Submit answer from Unity
    socket.on('submitAnswer', async ({ gameCode, playerName, answer, questionId }) => {
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
        
        // Get the current question
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
          pointsEarned = (question as any).points || 100;
          // Find player and update score
          const playerIndex = game.players.findIndex(p => p.id === socket.playerId);
          if (playerIndex !== -1) {
            game.players[playerIndex].score += pointsEarned;
            // 정답 개수 증가
            if (typeof game.players[playerIndex].correctAnswers === 'number') {
              game.players[playerIndex].correctAnswers += 1;
            } else {
              game.players[playerIndex].correctAnswers = 1;
            }
            await game.save();
          }
        }
        
        // Send result to the player
        socket.emit('answerResult', {
          correct: isCorrect,
          pointsEarned,
          correctAnswer: (question as any).correctAnswer,
          playerName: socket.playerName
        });
        
        // Notify all players about the answer
        io.to(`game:${socket.gameId}`).emit('answerResult', {
          playerId: socket.playerId,
          playerName: socket.playerName,
          correct: isCorrect,
          pointsEarned,
          answer: answer
        });
        
        // Send updated scores to everyone
        io.to(`game:${socket.gameId}`).emit('scoreUpdate', {
          playerId: socket.playerId,
          newScore: game.players.find(p => p.id === socket.playerId)?.score || 0,
          players: game.players
            .filter(p => p.isActive && p.isConnected)
            .sort((a, b) => b.score - a.score)
            .map(p => ({
              id: p.id,
              name: p.name,
              score: p.score,
              characterId: p.characterId
            }))
        });
        
      } catch (error) {
        console.error('Submit answer error:', error);
        socket.emit('error', { message: 'Failed to submit answer' });
      }
    });

    // Game complete from Unity
    socket.on('gameComplete', async ({ gameCode, playerName, finalScore, correctAnswers, totalQuestions }) => {
      try {
        if (!socket.gameId || !socket.playerId) {
          socket.emit('error', { message: 'Not in a game' });
          return;
        }
        
        const game = await Game.findById(socket.gameId);
        
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        // Update player's final score and stats
        const playerIndex = game.players.findIndex(p => p.id === socket.playerId);
        
        if (playerIndex !== -1) {
          game.players[playerIndex].score = finalScore;
          // You might want to store additional stats like correctAnswers, totalQuestions
          await game.save();
        }
        
        // Notify all players about the completion
        io.to(`game:${socket.gameId}`).emit('playerGameComplete', {
          playerId: socket.playerId,
          playerName: playerName,
          finalScore: finalScore,
          correctAnswers: correctAnswers,
          totalQuestions: totalQuestions
        });
        
      } catch (error) {
        console.error('Game complete error:', error);
        socket.emit('error', { message: 'Failed to complete game' });
      }
    });

    // Send next question (teacher only)
    socket.on('nextQuestion', async () => {
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
          id: question._id,
          prompt: question.prompt,
          type: question.type,
          options: question.options,
          points: question.points,
          timeLimit: question.timeLimit
        };
        
        // Send question to all players in the game
        io.to(`game:${socket.gameId}`).emit('questionUpdate', questionForPlayers);
        
        // Increment the current question counter
        game.currentQuestion += 1;
        await game.save();
        
      } catch (error) {
        console.error('Next question error:', error);
        socket.emit('error', { message: 'Failed to send next question' });
      }
    });

    // Handle character update
    socket.on('updateCharacter', async (data: { gameCode: string; playerName: string; character: string }) => {
      try {
        console.log('캐릭터 업데이트 요청:', data);
        
        const game = await Game.findOne({ gameCode: data.gameCode });
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        // 플레이어 찾기
        const player = game.players.find(p => p.name === data.playerName && p.isActive);
        if (!player) {
          socket.emit('error', { message: 'Player not found' });
          return;
        }
        
        // 캐릭터 업데이트
        player.characterId = data.character;
        await game.save();
        
        // 다른 플레이어들에게 캐릭터 변경 알림
        io.to(`game:${game._id}`).emit('playerCharacterChanged', {
          playerId: player.id,
          characterId: data.character
        });
        
        console.log(`플레이어 ${data.playerName} 캐릭터 변경: ${data.character}`);
        
      } catch (error) {
        console.error('Update character error:', error);
        socket.emit('error', { message: 'Failed to update character' });
      }
    });

    // Handle explicit leave game
    socket.on('leaveGame', async (data: { gameCode: string; playerId: string }) => {
      try {
        console.log('명시적 게임 나가기:', data);
        
        const game = await Game.findOne({ gameCode: data.gameCode });
        if (game) {
          // 플레이어 제거 (대기 중일 때만)
          if (game.status === GameStatus.LOBBY) {
            game.players = game.players.filter(p => p.id !== data.playerId);
            await game.save();
            
            // 다른 플레이어들에게 알림
            io.to(`game:${game._id}`).emit('playerLeft', data.playerId);
            console.log(`플레이어 ${data.playerId} 명시적으로 게임에서 제거됨`);
          }
        }
        
        // 소켓 정보 정리
        socket.leave(`game:${game?._id}`);
        socket.gameId = undefined;
        socket.playerId = undefined;
        
      } catch (error) {
        console.error('Leave game error:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log('Socket disconnected:', socket.id);
      
      if (socket.gameId && socket.playerId) {
        try {
          const game = await Game.findById(socket.gameId);
          
          if (game) {
            console.log(`플레이어 ${socket.playerId} 연결 해제 - 게임에서 제거`);
            
            const playerIndex = game.players.findIndex(p => p.id === socket.playerId);
            if (playerIndex !== -1) {
              const player = game.players[playerIndex];
              
              if (game.status === GameStatus.LOBBY) {
                // 대기 중인 게임: 완전히 제거
                game.players = game.players.filter(p => p.id !== socket.playerId);
                console.log(`대기 중인 게임에서 플레이어 ${socket.playerId} 완전 제거`);
              } else {
                // 진행 중인 게임: 연결 상태만 변경, 게임 참여는 유지
                player.isConnected = false;
                player.lastActiveAt = new Date();
                console.log(`진행 중인 게임에서 플레이어 ${socket.playerId} 연결 해제 (게임 참여는 유지)`);
                
                // 30초 후에도 재연결하지 않으면 게임에서 제외
                setTimeout(async () => {
                  try {
                    const updatedGame = await Game.findById(game._id);
                    if (updatedGame) {
                      const stillOfflinePlayer = updatedGame.players.find(p => 
                        p.id === socket.playerId && !p.isConnected
                      );
                      if (stillOfflinePlayer) {
                        stillOfflinePlayer.isActive = false;
                        await updatedGame.save();
                        console.log(`플레이어 ${socket.playerId} 30초 후 자동 비활성화`);
                        
                        // 클라이언트들에게 플레이어 비활성화 알림
                        io.to(`game:${game._id}`).emit('playerDeactivated', {
                          playerId: socket.playerId,
                          reason: 'timeout'
                        });
                      }
                    }
                  } catch (error) {
                    console.error('플레이어 자동 비활성화 오류:', error);
                  }
                }, 30000); // 30초
              }
            }
            
            await game.save();
            
            // 모든 클라이언트에게 플레이어 퇴장 알림
            io.to(`game:${socket.gameId}`).emit('playerLeft', socket.playerId);
            
            // 게임 룸에서 소켓 제거
            socket.leave(`game:${socket.gameId}`);
          }
        } catch (error) {
          console.error('Disconnect handler error:', error);
        }
      }
      
      // 소켓 정보 정리
      socket.gameId = undefined;
      socket.playerId = undefined;
    });
  });
};