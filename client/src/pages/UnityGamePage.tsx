import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';

interface GameState {
  gameCode: string;
  playerName?: string;
  characterId?: string;
  mode: 'student' | 'teacher';
  gameId?: string;
  gameSetup?: any;
}

interface Player {
  id: string;
  name: string;
  score: number;
  characterId?: string;
  isActive: boolean;
}

interface GameResult {
  playerId: string;
  playerName: string;
  finalScore: number;
  correctAnswers: number;
  totalQuestions: number;
  rank: number;
}

const UnityGamePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const unityRef = useRef<HTMLIFrameElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const resendIntervalRef = useRef<number | null>(null);
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [questionResults, setQuestionResults] = useState<any[]>([]);
  
  // Unity 준비 상태
  const [unityLoaded, setUnityLoaded] = useState(false);
  const [unityReady, setUnityReady] = useState(false);
  const [initSent, setInitSent] = useState(false);
  const [initializationComplete, setInitializationComplete] = useState(false);
  const [initAttempts, setInitAttempts] = useState(0);
  const messageQueue = useRef<any[]>([]);

  useEffect(() => {
    const state = location.state as GameState;
    if (!state) {
      navigate('/');
      return;
    }

    setGameState(state);
    initializeSocket(state);
  }, [location, navigate]);

  // Unity로 메시지 전송 (개선된 버전)
  const sendToUnity = (type: string, data: any = null) => {
    const message = {
      type,
      data: typeof data === 'string' ? data : JSON.stringify(data)
    };

    console.log('Unity로 메시지 전송 시도:', message);
    console.log('unityReady:', unityReady);
    console.log('unityRef.current:', !!unityRef.current);
    console.log('unityRef.current?.contentWindow:', !!unityRef.current?.contentWindow);

    if (unityReady && unityRef.current?.contentWindow) {
      try {
        unityRef.current.contentWindow.postMessage(message, '*');
        console.log('Unity로 메시지 전송 성공:', type);
      } catch (error) {
        console.error('Unity 메시지 전송 실패:', error);
        messageQueue.current.push(message);
      }
    } else {
      console.log('Unity가 준비되지 않음, 큐에 저장:', type);
      messageQueue.current.push(message);
    }
  };

  // Unity 초기화 메시지 전송
  const sendInitMessage = () => {
    console.log('sendInitMessage 호출됨');
    console.log('gameState:', gameState);
    console.log('initSent:', initSent);
    console.log('initializationComplete:', initializationComplete);
    console.log('initAttempts:', initAttempts);
    
    if (!gameState || initSent || initializationComplete || initAttempts >= 3) {
      console.log('초기화 메시지 전송 조건 불충족');
      return;
    }

    const initData = {
      role: gameState.mode,
      code: gameState.gameCode,
      nickname: gameState.playerName || 'Unknown',
      gameId: gameState.gameId
    };

    console.log('Unity 초기화 데이터:', initData);
    sendToUnity('init', initData);
    setInitSent(true);
    setInitAttempts(prev => prev + 1);
    console.log('초기화 메시지 전송 완료');

    // init-complete 수신까지 주기적 재전송 (최대 20회, 1.5s 간격)
    if (resendIntervalRef.current !== null) {
      window.clearInterval(resendIntervalRef.current);
      resendIntervalRef.current = null;
    }
    let attempts = 0;
    resendIntervalRef.current = window.setInterval(() => {
      if (initializationComplete) {
        if (resendIntervalRef.current !== null) {
          window.clearInterval(resendIntervalRef.current);
          resendIntervalRef.current = null;
        }
        return;
      }
      if (attempts >= 20) {
        console.warn('init 메시지 재전송 최대 횟수 도달');
        if (resendIntervalRef.current !== null) {
          window.clearInterval(resendIntervalRef.current);
          resendIntervalRef.current = null;
        }
        return;
      }
      attempts += 1;
      try {
        sendToUnity('init', initData);
        console.log('init 재전송', attempts);
      } catch (e) {
        console.warn('init 재전송 실패', e);
      }
    }, 1500);
  };

  // 큐에 있는 메시지들 전송
  const flushMessageQueue = () => {
    if (messageQueue.current.length > 0 && unityRef.current?.contentWindow) {
      console.log(`큐에 있는 ${messageQueue.current.length}개 메시지 전송`);
      
      messageQueue.current.forEach(message => {
        try {
          unityRef.current!.contentWindow!.postMessage(message, '*');
          console.log('큐 메시지 전송:', message.type);
        } catch (error) {
          console.error('큐 메시지 전송 실패:', error);
        }
      });
      
      messageQueue.current = [];
    }
  };

  // Unity 메시지 핸들러 (양식 통합: top-level type / nested message JSON 모두 처리)
  useEffect(() => {
    const handleUnityMessage = (event: MessageEvent) => {
      if (event.source !== unityRef.current?.contentWindow) return;

      try {
        // 1) top-level 타입 처리 (예: sceneTransitionComplete)
        const topLevelType = event.data?.type;
        if (event.data && event.data.source === 'unity') {
          if (topLevelType === 'sceneTransitionComplete') {
            console.log('Unity 씬 전환 완료 수신 → init 재전송');
            setInitSent(false);
            setTimeout(() => sendInitMessage(), 500);
          }

          // 2) nested message(JSON string) 처리 (예: unity-loaded, unity-ready, init-complete)
          const messageStr = event.data?.message;
          if (messageStr && typeof messageStr === 'string' && messageStr !== 'undefined' && messageStr !== 'null') {
            let parsed: any = null;
            try {
              parsed = JSON.parse(messageStr);
            } catch (e) {
              console.warn('Unity message JSON 파싱 실패, 무시:', messageStr);
            }
            if (parsed && parsed.type) {
              console.log('Unity → React 메시지:', parsed.type, parsed.data);
              if (parsed.type === 'unity-loaded' || parsed.type === 'unity-ready') {
                // 로드/준비 완료 → init 시도
                if (!initializationComplete) {
                  setTimeout(() => sendInitMessage(), 500);
                }
              } else if (parsed.type === 'init-complete') {
                console.log('Unity 초기화 확인(init-complete) 수신');
                setInitializationComplete(true);
                setInitSent(false);
                if (resendIntervalRef.current !== null) {
                  window.clearInterval(resendIntervalRef.current);
                  resendIntervalRef.current = null;
                }

                // 초기화 완료 후 즉시 게임 시작 메시지 전송
                if (gameState) {
                  console.log('게임 시작 메시지 전송');
                  const gameStartData = {
                    gameCode: gameState.gameCode,
                    playerName: gameState.playerName || 'Unknown',
                    isTeacher: gameState.mode === 'teacher',
                    characterId: gameState.characterId || '',
                    gameConfig: {
                      gameMode: 'time',
                      timeLimit: 5,
                      scoreLimit: 100
                    }
                  };
                  sendToUnity('gameStart', gameStartData);
                }
              }
            }
          }
        }

        // 3) 기존 top-level 이벤트도 호환 처리
        const { type, data } = event.data || {};
        switch (type) {
          case 'unity-loaded':
            console.log('Unity 로드 완료');
            setUnityLoaded(true);
            break;
          case 'unity-instance-ready':
            console.log('Unity 인스턴스 준비 완료');
            break;
          case 'unity-ready':
            console.log('Unity 준비 완료');
            setUnityReady(true);
            flushMessageQueue();
            if (!initSent && !initializationComplete) {
              console.log('초기화 메시지 전송 시도...');
              sendInitMessage();
            }
            break;
          case 'init-complete':
            console.log('Unity 초기화 완료');
            setInitializationComplete(true);
            setInitSent(false);
            if (gameState) {
              const gameStartData = {
                gameCode: gameState.gameCode,
                playerName: gameState.playerName || 'Unknown',
                isTeacher: gameState.mode === 'teacher',
                characterId: gameState.characterId || '',
                gameConfig: { gameMode: 'time', timeLimit: 5, scoreLimit: 100 }
              };
              sendToUnity('gameStart', gameStartData);
            }
            break;
          case 'submitAnswer':
            if (gameState?.mode === 'student' && socketRef.current) {
              socketRef.current.emit('submitAnswer', {
                gameCode: gameState.gameCode,
                playerName: gameState.playerName,
                answer: data?.answer,
                questionId: data?.questionId
              });
            }
            break;
          case 'gameComplete':
            if (gameState?.mode === 'student' && socketRef.current) {
              socketRef.current.emit('gameComplete', {
                gameCode: gameState.gameCode,
                playerName: gameState.playerName,
                finalScore: data?.finalScore,
                correctAnswers: data?.correctAnswers,
                totalQuestions: data?.totalQuestions
              });
            }
            break;
        }
      } catch (err) {
        console.error('handleUnityMessage 오류', err, '원본 이벤트:', event.data);
      }
    };

    window.addEventListener('message', handleUnityMessage);
    return () => window.removeEventListener('message', handleUnityMessage);
  }, [gameState, initSent, unityReady, initializationComplete]);

  // Unity가 준비되면 초기화 메시지 재전송 (안전장치) - 중복 방지
  useEffect(() => {
    if (unityReady && !initSent && !initializationComplete && gameState) {
      setTimeout(() => {
        if (!initSent && !initializationComplete) {
          console.log('Unity 준비됨, 초기화 메시지 전송');
          sendInitMessage();
        }
      }, 500);
    }
  }, [unityReady, initSent, initializationComplete, gameState]);

  // 언마운트 시 재전송 타이머 정리
  useEffect(() => {
    return () => {
      if (resendIntervalRef.current !== null) {
        window.clearInterval(resendIntervalRef.current);
        resendIntervalRef.current = null;
      }
    };
  }, []);

  const initializeSocket = (state: GameState) => {
    const socket = io('http://localhost:8080', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('소켓 연결됨');
      
      if (state.mode === 'student') {
        socket.emit('joinGame', {
          gameCode: state.gameCode,
          playerName: state.playerName,
          characterId: state.characterId
        });
      } else {
        socket.emit('hostGame', {
          gameId: state.gameId,
          gameCode: state.gameCode
        });
      }
    });

    socket.on('playerJoined', (player: Player) => {
      setPlayers(prev => [...prev, player]);
    });

    socket.on('playerLeft', (playerId: string) => {
      setPlayers(prev => prev.filter(p => p.id !== playerId));
    });

    socket.on('gameStarted', () => {
      setGameStarted(true);
      // Send the same GameStartData shape used elsewhere
      const gameStartData = {
        gameCode: state.gameCode,
        playerName: state.playerName || 'Unknown',
        isTeacher: state.mode === 'teacher',
        characterId: state.characterId || '',
        gameConfig: { gameMode: 'time', timeLimit: 5, scoreLimit: 100 }
      };
      sendToUnity('gameStart', gameStartData);
    });

    socket.on('questionUpdate', (question: any) => {
      setCurrentQuestion(question);
      sendToUnity('questionUpdate', question);
    });

    socket.on('answerResult', (result: any) => {
      setQuestionResults(prev => [...prev, result]);
      sendToUnity('answerResult', result);
    });

    socket.on('scoreUpdate', (scoreData: any) => {
      setPlayers(prev => 
        prev.map(p => 
          p.id === scoreData.playerId 
            ? { ...p, score: scoreData.newScore }
            : p
        )
      );
      sendToUnity('scoreUpdate', scoreData);
    });

    socket.on('gameEnded', (results: GameResult[]) => {
      setGameEnded(true);
      setGameResults(results);
      sendToUnity('gameEnd', { results });
    });

    socket.on('disconnect', () => {
      console.log('소켓 연결 해제됨');
    });

    return () => {
      socket.disconnect();
    };
  };

  const handleStartGame = () => {
    if (socketRef.current && gameState?.gameId) {
      socketRef.current.emit('startGame', { gameId: gameState.gameId });
    }
  };

  const handleEndGame = () => {
    if (socketRef.current && gameState?.gameId) {
      socketRef.current.emit('endGame', { gameId: gameState.gameId });
    }
  };

  const handleBackToLobby = () => {
    navigate('/teacher/dashboard');
  };

  const handleViewResults = () => {
    if (gameState?.mode === 'teacher') {
      navigate('/teacher/review', { state: { gameResults, gameId: gameState.gameId } });
    } else {
      navigate('/student/results', { state: { gameResults, playerName: gameState?.playerName } });
    }
  };

  if (!gameState) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* 상단 바 */}
      <div className="bg-gray-800 text-white p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">퀴즈 게임</h1>
            <div className="bg-blue-600 px-3 py-1 rounded">
              게임 코드: <span className="font-mono font-bold">{gameState.gameCode}</span>
            </div>
            {/* 디버그 정보 */}
            <div className="text-sm text-gray-300">
              Unity: {unityLoaded ? '로드됨' : '로딩중'} | 
              {unityReady ? '준비됨' : '대기중'} | 
              초기화: {initSent ? '완료' : '대기'}
            </div>
            {/* 디버그 버튼 */}
            <button
              onClick={() => {
                console.log('수동 초기화 버튼 클릭');
                setInitSent(false);
                setTimeout(() => sendInitMessage(), 100);
              }}
              className="bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded text-xs"
            >
              수동 초기화
            </button>
          </div>
          
          {gameState.mode === 'teacher' && (
            <div className="flex space-x-2">
              {!gameStarted && (
                <button
                  onClick={handleStartGame}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
                >
                  게임 시작
                </button>
              )}
              {gameStarted && !gameEnded && (
                <button
                  onClick={handleEndGame}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
                >
                  게임 종료
                </button>
              )}
              {gameEnded && (
                <button
                  onClick={handleViewResults}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
                >
                  결과 보기
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex h-screen">
        {/* Unity 게임 영역 */}
        <div className="flex-1 relative">
          <iframe
            ref={unityRef}
            src="/unity/index.html"
            className="w-full h-full border-0"
            title="Unity Game"
            onLoad={() => {
              console.log('Unity iframe 로드 완료');
            }}
          />
        </div>

        {/* 사이드바 (선생님 모드에서만 표시) */}
        {gameState.mode === 'teacher' && (
          <div className="w-80 bg-gray-800 text-white p-4 overflow-y-auto">
            {/* 플레이어 목록 */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">플레이어 목록</h2>
              <div className="space-y-2">
                {players
                  .sort((a, b) => b.score - a.score)
                  .map((player, index) => (
                    <div
                      key={player.id}
                      className="flex justify-between items-center p-2 bg-gray-700 rounded"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold">#{index + 1}</span>
                        <span>{player.name}</span>
                        {player.characterId && (
                          <span className="text-xs text-gray-400">
                            ({player.characterId})
                          </span>
                        )}
                      </div>
                      <span className="font-bold">{player.score}점</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* 현재 문제 */}
            {currentQuestion && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">현재 문제</h2>
                <div className="bg-gray-700 p-3 rounded">
                  <p className="text-sm mb-2">{currentQuestion.prompt}</p>
                  <div className="space-y-1">
                    {currentQuestion.options?.map((option: string, index: number) => (
                      <div key={index} className="text-xs text-gray-300">
                        {String.fromCharCode(65 + index)}. {option}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 최근 답변 결과 */}
            {questionResults.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">최근 답변</h2>
                <div className="space-y-2">
                  {questionResults.slice(-5).reverse().map((result, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded text-sm ${
                        result.correct ? 'bg-green-700' : 'bg-red-700'
                      }`}
                    >
                      <div className="flex justify-between">
                        <span>{result.playerName}</span>
                        <span>{result.correct ? '정답' : '오답'}</span>
                      </div>
                      <div className="text-xs text-gray-300 mt-1">
                        답변: {result.answer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 게임 결과 */}
            {gameEnded && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">최종 결과</h2>
                <div className="space-y-2">
                  {gameResults.map((result, index) => (
                    <div
                      key={result.playerId}
                      className="flex justify-between items-center p-2 bg-gray-700 rounded"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold">#{result.rank}</span>
                        <span>{result.playerName}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{result.finalScore}점</div>
                        <div className="text-xs text-gray-400">
                          {result.correctAnswers}/{result.totalQuestions}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UnityGamePage; 