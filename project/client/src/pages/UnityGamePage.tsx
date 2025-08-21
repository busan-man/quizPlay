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
  const [hasJoinedGame, setHasJoinedGame] = useState(false); // 중복 참가 방지
  
  // Unity 준비 상태
  const [unityLoaded, setUnityLoaded] = useState(false);
  const [unityReady, setUnityReady] = useState(false);
  const [initSent, setInitSent] = useState(false);
  const [initializationComplete, setInitializationComplete] = useState(false);
  const [initAttempts, setInitAttempts] = useState(0);
  const [unityPlayerListReady, setUnityPlayerListReady] = useState(false); // Unity 플레이어 목록 처리 준비 상태
  const messageQueue = useRef<any[]>([]);
  const lastCharacterChangeTime = useRef<number>(0); // 캐릭터 변경 쿨다운용

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
    
    if (!gameState || initAttempts >= 5) {
      console.log('초기화 메시지 전송 조건 불충족');
      return;
    }

    const initData = {
      role: gameState.mode,
      code: gameState.gameCode,
      nickname: gameState.playerName || 'Unknown',
      gameId: gameState.gameId,
      characterId: gameState.characterId || undefined
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
    const isTeacher = gameState?.mode === 'teacher';
    const shouldSend = messageQueue.current.length > 0 && (isTeacher || (unityReady && unityRef.current?.contentWindow));
    
    if (shouldSend) {
      console.log(`큐에 있는 ${messageQueue.current.length}개 메시지 전송 (교사 모드: ${isTeacher})`);
      
      const messagesToSend = [...messageQueue.current];
      messageQueue.current = []; // 먼저 큐 클리어
      
      messagesToSend.forEach((message, index) => {
        setTimeout(() => {
          try {
            if (message.type === 'playerJoined') {
              // 교사 모드이거나 플레이어 목록이 준비된 경우 전송
              if (isTeacher || unityPlayerListReady) {
                sendToUnity('playerJoined', message.data);
                console.log(`${isTeacher ? '교사 모드 강제' : '큐'} 메시지 전송 (playerJoined):`, message.data?.name || '');
              } else {
                // 아직 준비되지 않았다면 다시 큐에 추가
                messageQueue.current.push(message);
                console.log('Unity 플레이어 목록 준비 안됨 - 메시지 재대기:', message.data?.name || '');
              }
            } else {
              // 교사 모드이거나 Unity가 준비된 경우 전송
              if (isTeacher || unityRef.current?.contentWindow) {
                sendToUnity(message.type, message.data);
                console.log(`${isTeacher ? '교사 모드 강제' : '큐'} 메시지 전송:`, message.type);
              }
            }
          } catch (error) {
            console.error('큐 메시지 전송 실패:', error);
          }
        }, index * 100); // 각 메시지를 100ms 간격으로 전송
      });
    } else if (messageQueue.current.length > 0) {
      console.log(`Unity 준비 안됨 - 큐에 ${messageQueue.current.length}개 메시지 대기 중`);
      console.log(`Unity 상태: Ready=${unityReady}, PlayerListReady=${unityPlayerListReady}`);
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
                if (parsed.type === 'unity-ready') {
                  setUnityReady(true);
                  flushMessageQueue();
                }
                if (!initializationComplete) {
                  setTimeout(() => sendInitMessage(), 500);
                }
              } else if (parsed.type === 'init-complete') {
                console.log('Unity 초기화 확인(init-complete) 수신');
                setInitializationComplete(true);
                setInitSent(false);
                
                // Unity 상태를 즉시 Ready로 설정
                setUnityReady(true);
                setUnityPlayerListReady(true);
                console.log('Unity 상태를 Ready, PlayerListReady로 즉시 설정');
                
                // 강제로 Unity 상태 확인 및 디버깅
                setTimeout(() => {
                  console.log('=== Unity 상태 재확인 (1초 후) ===');
                  console.log('unityReady 실제 상태:', unityReady);
                  console.log('unityPlayerListReady 실제 상태:', unityPlayerListReady);
                  console.log('initializationComplete 실제 상태:', initializationComplete);
                  
                  // 만약 여전히 false라면 강제로 true 설정
                  if (!unityReady || !unityPlayerListReady) {
                    console.log('🔧 Unity 상태가 여전히 false - 강제로 true 설정');
                    setUnityReady(true);
                    setUnityPlayerListReady(true);
                  }
                }, 1000);
                
                // 추가 안전장치: 2초 후에도 한 번 더 확인
                setTimeout(() => {
                  console.log('=== Unity 상태 최종 확인 (2초 후) ===');
                  setUnityReady(true);
                  setUnityPlayerListReady(true);
                  flushMessageQueue(); // 큐에 쌓인 메시지들 다시 플러시
                  console.log('Unity 상태 강제 설정 및 메시지 큐 재플러시 완료');
                }, 2000);
                
                if (resendIntervalRef.current !== null) {
                  window.clearInterval(resendIntervalRef.current);
                  resendIntervalRef.current = null;
                }

                // 메시지 큐 즉시 플러시
                flushMessageQueue();
                console.log('Unity 초기화 완료 후 메시지 큐 즉시 플러시');

                // 현재 플레이어 목록이 있다면 Unity에 즉시 전송
                setTimeout(() => {
                  if (players.length > 0) {
                    console.log('Unity 초기화 완료 - 기존 플레이어 목록 즉시 전송:', players.length + '명');
                    players.forEach((playerItem, index) => {
                      setTimeout(() => {
                        // players 배열의 각 항목이 문자열인지 객체인지 확인
                        const playerName = typeof playerItem === 'string' ? 
                          playerItem.split('(')[0] : // 'name(id)' 형식에서 이름만 추출
                          playerItem.name || playerItem.id;
                        
                        const playerData = {
                          playerName: playerName,
                          playerCount: players.length
                        };
                        sendToUnity('playerJoined', playerData);
                        console.log('기존 플레이어 Unity 전송:', playerName);
                      }, index * 50); // 50ms 간격으로 전송
                    });
                  }
                }, 100);

                // 교사 모드 처리 (불필요한 메시지 제거)
                if (gameState?.mode === 'teacher') {
                  console.log('교사 모드 - 초기화 완료');
                  
                  // 정기적으로 플레이어 목록 상태 전송
                  const sendPlayerListInterval = setInterval(() => {
                    if (players.length > 0) {
                      const playerNames = players.map(playerItem => {
                        return typeof playerItem === 'string' ? 
                          playerItem.split('(')[0] : 
                          playerItem.name || playerItem.id;
                      });
                      
                      const statusData = {
                        players: playerNames,
                        playerCount: players.length
                      };
                      sendToUnity('updatePlayerList', statusData);
                      console.log('정기 플레이어 목록 업데이트:', playerNames);
                    }
                  }, 2000); // 2초마다 전송
                  
                  // 컴포넌트 정리 시 interval 제거
                  setTimeout(() => clearInterval(sendPlayerListInterval), 30000); // 30초 후 중단
                }

                // 초기화 완료 후 자동 게임 시작 제거 - 교사가 버튼을 클릭해야만 시작
                console.log('Unity 초기화 완료 - 게임 시작은 수동으로만 가능');
              } else if (parsed.type === 'create-room') {
                console.log('=== create-room 메시지 수신 ===');
                console.log('gameState?.mode:', gameState?.mode);
                console.log('socketRef.current:', !!socketRef.current);
                console.log('gameState.gameId:', gameState?.gameId);
                console.log('gameState.gameCode:', gameState?.gameCode);
                
                if (gameState?.mode === 'teacher' && socketRef.current) {
                  console.log('교사 hostGame 요청 전송:', {
                    gameId: gameState.gameId,
                    gameCode: gameState.gameCode
                  });
                  
                  // 게임 호스팅 시 플레이어 목록 초기화
                  setPlayers([]);
                  console.log('게임 호스팅: 플레이어 목록 초기화됨');
                  
                  socketRef.current.emit('hostGame', {
                    gameId: gameState.gameId,
                    gameCode: gameState.gameCode
                  });
                } else {
                  console.log('hostGame 요청 실패 - 조건 불충족');
                }
              } else if (parsed.type === 'join-room') {
                if (gameState?.mode === 'student' && socketRef.current) {
                  // Unity에서 받은 캐릭터 정보 사용 (JSON 파싱)
                  let characterId;
                  try {
                    const joinData = typeof parsed.data === 'string' ? JSON.parse(parsed.data) : parsed.data;
                    characterId = joinData?.character || gameState.characterId || Math.floor(Math.random() * 4).toString();
                  } catch (e) {
                    characterId = gameState.characterId || Math.floor(Math.random() * 4).toString();
                  }
                  
                  console.log('=== join-room 메시지 처리 시작 ===');
                  console.log('gameState:', gameState);
                  console.log('characterId:', characterId);
                  console.log('소켓 상태:', !!socketRef.current);
                  console.log('hasJoinedGame:', hasJoinedGame);
                  
                                     // 소켓이 연결되지 않았다면 참가 불가
                   if (!socketRef.current?.connected) {
                     console.log('소켓이 연결되지 않음 - 참가 요청 중단');
                     return;
                   }
                   
                   // 이미 같은 게임에 참가했고 캐릭터도 동일한 경우만 중복 방지
                   if (hasJoinedGame && characterId === gameState?.characterId && gameState?.gameCode === parsed.data.gameCode) {
                     console.log('동일한 게임, 동일한 캐릭터로 이미 참가함 - 중복 요청 방지');
                     return;
                   }
                   
                   // 다른 상황은 모두 허용 (게임 변경, 캐릭터 변경 등)
                   if (hasJoinedGame) {
                     console.log('게임 또는 캐릭터 변경으로 재참가 허용:', {
                       oldCharacter: gameState?.characterId,
                       newCharacter: characterId,
                       oldGame: gameState?.gameCode,
                       newGame: parsed.data.gameCode
                     });
                   }
                  
                  console.log('join-room 메시지 처리 - 소켓으로 전송:', {
                    gameCode: gameState.gameCode,
                    playerName: gameState.playerName,
                    character: characterId
                  });
                  
                  setHasJoinedGame(true); // 참가 시도 플래그 설정
                  console.log('hasJoinedGame 플래그를 true로 설정함');
                  socketRef.current.emit('joinGame', {
                    gameCode: gameState.gameCode,
                    playerName: gameState.playerName,
                    character: characterId.toString() // 문자열로 통일
                  });
                  
                  // 5초 후에도 gameJoined를 받지 못하면 플래그 리셋 (3초 → 5초로 증가)
                  setTimeout(() => {
                    if (hasJoinedGame && players.length === 0) {
                      console.log('게임 참가 응답 없음 - 플래그 리셋');
                      setHasJoinedGame(false);
                    }
                  }, 5000);
                }
              } else if (parsed.type === 'character-changed') {
                // Unity에서 캐릭터 변경 메시지 수신
                let newCharacterId;
                try {
                  const charData = typeof parsed.data === 'string' ? JSON.parse(parsed.data) : parsed.data;
                  newCharacterId = charData?.characterId || charData?.character;
                } catch (e) {
                  newCharacterId = parsed.data?.characterId || parsed.data?.character;
                }
                
                if (newCharacterId !== undefined) {
                  console.log('캐릭터 변경 수신:', newCharacterId);
                  setGameState(prev => prev ? ({
                    ...prev,
                    characterId: newCharacterId.toString()
                  }) : null);
                  
                  // 캐릭터 변경 시 서버에 알림 (이미 참가한 경우에만, 쿨다운 적용)
                  if (socketRef.current && gameState?.gameCode && hasJoinedGame) {
                    const now = Date.now();
                    const timeSinceLastChange = now - lastCharacterChangeTime.current;
                    
                    // 1초 쿨다운 적용
                    if (timeSinceLastChange < 1000) {
                      console.log(`캐릭터 변경 쿨다운 중 (${1000 - timeSinceLastChange}ms 남음)`);
                      return;
                    }
                    
                    lastCharacterChangeTime.current = now;
                    const characterData = {
                      gameCode: gameState.gameCode,
                      playerName: gameState.playerName,
                      character: newCharacterId.toString() // 문자열로 통일
                    };
                    socketRef.current.emit('updateCharacter', characterData);
                    console.log('캐릭터 변경 서버 전송:', characterData);
                  }
                }
              } else if (parsed.type === 'startGame') {
                // Unity에서 게임 시작 요청 수신
                console.log('게임 시작 요청 수신');
                if (socketRef.current && gameState?.gameId) {
                  console.log('서버로 startGame 요청 전송:', { gameId: gameState.gameId });
                  socketRef.current.emit('startGame', { gameId: gameState.gameId });
                } else {
                  console.log('소켓 또는 gameId가 없음:', { socket: !!socketRef.current, gameId: gameState?.gameId });
                }
              } else if (parsed.type === 'start-game') {
                if (gameState?.mode === 'teacher' && socketRef.current && gameState.gameId) {
                  socketRef.current.emit('startGame', { gameId: gameState.gameId });
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
            
            // Unity가 완전히 준비되었으므로 즉시 상태 설정
            setUnityReady(true);
            setUnityPlayerListReady(true);
            console.log('Unity 상태를 Ready, PlayerListReady로 즉시 변경');
            
            // 메시지 큐 즉시 플러시 후 여러 번 시도
            flushMessageQueue();
            console.log('Unity 초기화 완료 후 메시지 큐 즉시 플러시');
            
            setTimeout(() => {
              flushMessageQueue();
              console.log('Unity 초기화 완료 후 메시지 큐 플러시 실행 (1차)');
            }, 100);
            
            setTimeout(() => {
              flushMessageQueue();
              console.log('Unity 초기화 완료 후 메시지 큐 플러시 실행 (2차)');
            }, 500);
            
            setTimeout(() => {
              flushMessageQueue();
              console.log('Unity 초기화 완료 후 메시지 큐 플러시 실행 (3차)');
              
              // 현재 플레이어 목록도 Unity에 전송
              if (players.length > 0) {
                console.log('현재 플레이어 목록을 Unity에 재전송:', players.length + '명');
                players.forEach((playerDisplayName, index) => {
                  setTimeout(() => {
                    const message = {
                      type: 'playerJoined',
                      data: JSON.stringify({
                        playerName: playerDisplayName,
                        playerCount: players.length
                      })
                    };
                    sendToUnity(message);
                    console.log('플레이어 재전송:', playerDisplayName);
                  }, index * 100);
                });
              }
            }, 1000);
            
            console.log('Unity 초기화 완료 - 수동 게임 시작 대기 중');
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
          case 'create-room':
            console.log('=== handleUnityMessage create-room ===');
            console.log('gameState?.mode:', gameState?.mode);
            console.log('socketRef.current:', !!socketRef.current);
            console.log('gameState.gameId:', gameState?.gameId);
            console.log('gameState.gameCode:', gameState?.gameCode);
            
            if (gameState?.mode === 'teacher' && socketRef.current) {
              console.log('handleUnityMessage에서 hostGame 전송:', {
                gameId: gameState.gameId,
                gameCode: gameState.gameCode
              });
              socketRef.current.emit('hostGame', {
                gameId: gameState.gameId,
                gameCode: gameState.gameCode
              });
            } else {
              console.log('handleUnityMessage hostGame 실패 - 조건 불충족');
            }
            break;
          case 'join-room':
            if (gameState?.mode === 'student' && socketRef.current) {
              socketRef.current.emit('joinGame', {
                gameCode: gameState.gameCode,
                playerName: gameState.playerName,
                characterId: gameState.characterId
              });
            }
            break;
          case 'start-game':
            if (gameState?.mode === 'teacher' && socketRef.current && gameState.gameId) {
              socketRef.current.emit('startGame', { gameId: gameState.gameId });
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
    
    // 강제 동기화 로직 제거 - 중복 플레이어 전송 방지
    // Unity가 준비되면 현재 플레이어 목록 강제 동기화
    // if (unityReady && players.length > 0) {
    //   console.log('Unity 준비됨, 현재 플레이어 목록 강제 동기화:', players.length, '명');
    //   players.forEach((player: Player) => {
    //     try {
    //       const playerData = {
    //         id: player.id,
    //         name: player.name,
    //         characterId: player.characterId || ''
    //       };
    //       sendToUnity('playerJoined', playerData);
    //       console.log('강제 동기화 - playerJoined 전송:', playerData);
    //     } catch (error) {
    //       console.error('강제 동기화 실패:', error);
    //     }
    //   });
    // }
  }, [unityReady, initSent, initializationComplete, gameState]);
  
  // Unity 준비 상태 강제 설정 (5초 후)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!unityReady) {
        console.log('Unity 준비 상태 강제 설정 (5초 타임아웃)');
        setUnityReady(true);
        flushMessageQueue();
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [unityReady]);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      // 재전송 타이머 정리
      if (resendIntervalRef.current !== null) {
        window.clearInterval(resendIntervalRef.current);
        resendIntervalRef.current = null;
      }
      
      // 소켓 연결 정리
      if (socketRef.current) {
        console.log('컴포넌트 언마운트 - 소켓 연결 정리');
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      // 메시지 큐 정리
      messageQueue.current = [];
    };
  }, []);

  const initializeSocket = (state: GameState) => {
    // 이전 소켓 연결이 있다면 정리
    if (socketRef.current) {
      console.log('이전 소켓 연결 정리 중...');
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const token = localStorage.getItem('token');
    console.log('🔐 인증 토큰 확인:', token ? '토큰 존재' : '토큰 없음');
    
    // 토큰이 없을 경우 게스트 JWT 토큰 생성
    if (!token) {
      // 간단한 JWT 형식의 게스트 토큰 생성 (실제 JWT는 아니지만 서버에서 파싱 가능)
      const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const guestPayload = {
        id: guestId,
        role: state.mode,
        gameCode: state.gameCode,
        playerName: state.playerName,
        isGuest: true,
        iat: Math.floor(Date.now() / 1000)
      };
      
      // Base64 인코딩된 간단한 토큰 (JWT처럼 보이게)
      const header = btoa(JSON.stringify({ typ: 'JWT', alg: 'none' }));
      const payload = btoa(JSON.stringify(guestPayload));
      const guestToken = `${header}.${payload}.guest-signature`;
      
      localStorage.setItem('token', guestToken);
      console.log('🔑 게스트 JWT 토큰 생성됨:', guestId);
    }
    
    const socket = io('http://localhost:8080', {
      auth: {
        token: localStorage.getItem('token'),
        role: state.mode, // 역할 정보도 함께 전송
        gameCode: state.gameCode, // 게임 코드도 함께 전송
        playerName: state.playerName
      },
      forceNew: true, // 새로운 연결 강제
      timeout: 5000,
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ 소켓 연결됨 - ID:', socket.id);
      console.log('🔐 사용된 인증 정보:', {
        token: localStorage.getItem('token')?.substring(0, 20) + '...',
        role: state.mode,
        gameCode: state.gameCode,
        playerName: state.playerName
      });
      
      if (state.mode === 'teacher') {
        console.log('🎓 선생님 모드 - hostGame 요청 전송');
        socket.emit('hostGame', {
          gameId: state.gameId,
          gameCode: state.gameCode
        });
      } else {
        console.log('👨‍🎓 학생 모드 - Unity 캐릭터 선택 대기');
        // 학생은 Unity에서 'join-room'을 보낼 때까지 대기 (캐릭터 선택 포함 가능)
      }
    });

    // 소켓 오류 처리
    socket.on('error', (error: any) => {
      console.error('=== 소켓 오류 수신 ===', error);
      
      // 인증 실패인 경우 토큰 재생성
      if (error?.message === 'Not authenticated') {
        console.log('🔄 메인 소켓 - 인증 실패 감지');
        localStorage.removeItem('token');
        return;
      }
      
      // 중복 참가 오류인 경우 플래그만 리셋 (재연결 시도 제거)
      if (error.message === 'Already joined a game' || error.message === 'Already connected to this game') {
        console.log('중복 참가 오류 - hasJoinedGame 플래그 리셋 (재연결 안함)');
        setHasJoinedGame(false);
        
        // 소켓은 유지하고 플래그만 리셋
        console.log('현재 소켓 연결 상태 유지 - 다음 참가 시도 대기');
      }
    });

    // 소켓 연결 해제 처리
    socket.on('disconnect', () => {
      console.log('소켓 연결 해제됨');
      setHasJoinedGame(false); // 연결 해제 시 참가 상태 리셋
    });

    // Host 초기 상태 동기화
    socket.on('gameHosted', (payload: any) => {
      try {
        const { gameStatus, currentPlayers } = payload || {};
        if (Array.isArray(currentPlayers)) {
          setPlayers(currentPlayers);
          // Unity 학생 목록 초기 동기화 제거 - 중복 방지
          // currentPlayers.forEach((p: any) => {
          //   try {
          //     if (unityReady) {
          //       // characterId가 없으면 빈 문자열로 전달
          //       const playerData = {
          //         id: p.id,
          //         name: p.name,
          //         characterId: p.characterId || ''
          //       };
          //       sendToUnity('playerJoined', playerData);
          //       console.log('Unity로 초기 playerJoined 전송:', playerData);
          //     } else {
          //       console.log('Unity가 준비되지 않아 초기 playerJoined 큐에 저장');
          //       messageQueue.current.push({ type: 'playerJoined', data: p });
          //     }
          //   } catch (error) {
          //     console.error('초기 playerJoined 전송 실패:', error);
          //   }
          // });
        }
        if (gameStatus === 'active') {
          setGameStarted(true);
          // 자동 게임 시작 제거 - 버튼 클릭에서만 시작
          console.log('게임이 이미 활성 상태입니다. 수동 시작 대기 중...');
        }
      } catch (e) {
        console.warn('gameHosted 처리 오류', e);
      }
    });

    // 학생 초기 상태 동기화
    socket.on('gameJoined', (payload: any) => {
      console.log('=== gameJoined 이벤트 수신 ===');
      console.log('gameJoined 데이터:', payload);
      
      try {
        const { currentPlayers, playerId } = payload || {};
        
        // 성공적으로 게임에 참가했음을 확인
        if (playerId) {
          console.log('게임 참가 성공, 플레이어 ID:', playerId);
          // hasJoinedGame은 이미 true로 설정되어 있음
        }
        
        if (Array.isArray(currentPlayers)) {
          setPlayers(currentPlayers);
          console.log('현재 플레이어 목록 업데이트:', currentPlayers.length, '명');
          
          // Unity 학생 목록 초기 동기화 제거 - 중복 방지
          // currentPlayers.forEach((p: any) => {
          //   try {
          //     if (unityReady) {
          //       // characterId가 없으면 빈 문자열로 전달
          //       const playerData = {
          //         id: p.id,
          //         name: p.name,
          //         characterId: p.characterId || ''
          //       };
          //       sendToUnity('playerJoined', playerData);
          //       console.log('Unity로 초기 playerJoined 전송:', playerData);
          //     } else {
          //       console.log('Unity가 준비되지 않아 초기 playerJoined 큐에 저장');
          //       messageQueue.current.push({ type: 'playerJoined', data: p });
          //     }
          //   } catch (error) {
          //     console.error('초기 playerJoined 전송 실패:', error);
          //   }
          // });
        }
      } catch (e) {
        console.warn('gameJoined 처리 오류', e);
      }
    });

    socket.on('playerJoined', (player: Player) => {
      console.log('=== 서버에서 playerJoined 이벤트 수신 ===');
      console.log('새로운 플레이어:', player);
      console.log('현재 플레이어 목록:', players);
      console.log('현재 모드:', state.mode);
      console.log('소켓 ID:', socket.id);
      
      // 중복 참가 방지 및 플레이어 추가를 하나의 상태 업데이트로 처리
      let wasAdded = false;
      setPlayers(prev => {
        // ID 또는 이름 기반 중복 체크 (동일한 이름으로 여러 캐릭터 생성 방지)
        const isDuplicateId = prev.some(p => p.id === player.id);
        const isDuplicateName = prev.some(p => p.name === player.name);
        
        if (isDuplicateId) {
          console.log(`중복 참가 방지: playerId ${player.id}는 이미 등록됨`);
          return prev;
        }
        
        if (isDuplicateName) {
          console.log(`중복 이름 방지: playerName "${player.name}"은 이미 사용 중 - 기존 플레이어 업데이트`);
          // 동일한 이름의 기존 플레이어를 새 정보로 업데이트
          return prev.map(p => p.name === player.name ? { ...player } : p);
        }
        console.log(`새 플레이어 추가: ${player.name} (${player.id})`);
        wasAdded = true;
        const newList = [...prev, player];
        console.log('업데이트된 플레이어 목록:', newList.map(p => `${p.name}(${p.id})`));
        
        // 교사 모드일 때는 즉시 Unity로 전송 (최우선 처리)
        const isTeacherMode = gameState?.mode === 'teacher' || state.mode === 'teacher';
        
        if (isTeacherMode) {
          console.log('🏫 교사 모드 최우선 처리 - 즉시 Unity 전송');
          const fullPlayerData = {
            id: player.id,
            name: player.name,
            playerName: player.name,
            characterId: player.characterId || '1',
            score: player.score || 0,
            isActive: player.isActive || true,
            isConnected: player.isConnected || true,
            playerCount: newList.length
          };
          
          // 즉시 전송
          sendToUnity('playerJoined', fullPlayerData);
          sendToUnity('updatePlayerList', {
            players: newList.map(p => p.name),
            playerCount: newList.length,
            playerData: newList
          });
          
          console.log('🎯 교사 모드 즉시 전송 완료:', player.name);
          
          // 재시도 로직도 유지
          let retryCount = 0;
          const retryInterval = setInterval(() => {
            if (retryCount < 3) {
              sendToUnity('playerJoined', fullPlayerData);
              sendToUnity('updatePlayerList', {
                players: newList.map(p => p.name),
                playerCount: newList.length,
                playerData: newList
              });
              retryCount++;
              console.log(`교사 모드 재시도 ${retryCount}/3:`, player.name);
            } else {
              clearInterval(retryInterval);
              console.log('교사 모드 재시도 완료');
            }
          }, 2000);
          
          setTimeout(() => {
            clearInterval(retryInterval);
          }, 15000);
        }
        
        // Unity에 즉시 전송 (상태 업데이트와 함께)
        setTimeout(() => {
          try {
            console.log('🔍 playerJoined 전송 로직 시작');
            console.log('현재 gameState:', gameState);
            console.log('gameState?.mode:', gameState?.mode);
            console.log('state.mode:', state.mode);
            console.log('교사 모드 조건 체크:', gameState?.mode === 'teacher');
            
            // 교사 모드일 때는 Unity 상태와 관계없이 즉시 전송 (학생 목록 표시용)
            if (gameState?.mode === 'teacher' || state.mode === 'teacher') {
              // 플레이어 데이터 다양한 형식으로 준비
              const fullPlayerData = {
                id: player.id,
                name: player.name,
                playerName: player.name,
                characterId: player.characterId || '1',
                score: player.score || 0,
                isActive: player.isActive || true,
                isConnected: player.isConnected || true,
                playerCount: newList.length
              };
              
              console.log('✅ 교사 모드 확인됨 - Unity 상태 무시하고 강제 전송');
              console.log('🎯 교사 모드 - Unity 상태 무시하고 강제 전송');
              console.log('현재 Unity 상태 - Ready:', unityReady, 'PlayerListReady:', unityPlayerListReady);
              console.log('전송할 플레이어 데이터:', fullPlayerData);
              
              // 학생 목록 표시를 위해 여러 메시지 타입 전송
              sendToUnity('playerJoined', fullPlayerData);
              
              // 추가로 플레이어 목록 업데이트 메시지도 전송
              sendToUnity('updatePlayerList', {
                players: newList.map(p => p.name),
                playerCount: newList.length,
                playerData: newList
              });
              
              console.log('교사 모드 - 학생 목록 표시용 메시지 전송 완료:', player.name);
              
              // 3회만 재시도 (과도한 메시지 전송 방지)
              let retryCount = 0;
              const retryInterval = setInterval(() => {
                if (retryCount < 3) {
                  sendToUnity('playerJoined', fullPlayerData);
                  sendToUnity('updatePlayerList', {
                    players: newList.map(p => p.name),
                    playerCount: newList.length,
                    playerData: newList
                  });
                  retryCount++;
                  console.log(`교사 모드 - 학생 목록 재시도 ${retryCount}/3:`, player.name);
                } else {
                  clearInterval(retryInterval);
                  console.log('교사 모드 - 학생 목록 전송 재시도 완료');
                }
              }, 2000);
              
              // 15초 후 재시도 중단 (더 오래)
              setTimeout(() => {
                clearInterval(retryInterval);
                console.log('교사 모드 - 재시도 중단');
              }, 15000);
            } else {
              // 교사 모드가 아닌 경우에만 Unity 상태 체크
              if (gameState?.mode !== 'teacher' && state.mode !== 'teacher' && (!unityReady || !unityPlayerListReady || !unityRef.current?.contentWindow)) {
                console.log(`Unity 상태 확인 - Ready: ${unityReady}, PlayerListReady: ${unityPlayerListReady}`);
                console.log('Unity가 준비되지 않아 playerJoined 큐에 저장');
                messageQueue.current.push({ type: 'playerJoined', data: player });
              } else {
                // 교사 모드이거나 Unity가 준비된 경우 즉시 전송
                const playerData = {
                  id: player.id,
                  name: player.name,
                  characterId: player.characterId || ''
                };
                sendToUnity('playerJoined', playerData);
                console.log(`${gameState?.mode === 'teacher' ? '교사 모드 강제' : 'Unity 준비됨'} - playerJoined 전송:`, playerData);
              }
            }
          } catch (error) {
            console.error('playerJoined 전송 실패:', error);
          }
        }, 50); // 상태 업데이트 후 50ms 뒤 실행
        
        return newList;
      });
    });

    socket.on('playerLeft', (playerId: string) => {
      setPlayers(prev => prev.filter(p => p.id !== playerId));
      // Unity 학생 목록 제거 브리지
      try {
        // 교사 모드이거나 Unity가 준비된 경우 즉시 전송
        if (gameState?.mode === 'teacher' || unityReady) {
          sendToUnity('playerLeft', { id: playerId, playerId });
          console.log(`${gameState?.mode === 'teacher' ? '교사 모드 강제' : 'Unity 준비됨'} - playerLeft 전송:`, playerId);
        } else {
          console.log('Unity가 준비되지 않아 playerLeft 큐에 저장');
          messageQueue.current.push({ type: 'playerLeft', data: { id: playerId, playerId } });
        }
      } catch (error) {
        console.error('playerLeft 전송 실패:', error);
      }
    });

    socket.on('gameStarted', (payload: any) => {
      console.log('=== gameStarted 이벤트 수신 ===');
      console.log('gameStarted 데이터:', payload);
      
      setGameStarted(true);
      
      // 게임 시작 시 hasJoinedGame 플래그 리셋 (새 게임 준비)
      setHasJoinedGame(false);
      console.log('게임 시작 - hasJoinedGame 플래그 리셋됨');
      
      // Unity에 게임 시작 알림 전송
      if (unityReady && unityRef.current?.contentWindow) {
        try {
          // 테마 선택 건너뛰기 플래그 추가
          const gameStartData = {
            ...payload,
            skipThemeSelection: true,
            autoStartQuestions: true
          };
          
          // gameStart와 startGame 둘 다 전송 (Unity 호환성)
          sendToUnity('gameStart', gameStartData);
          sendToUnity('startGame', gameStartData);
          console.log('Unity에 게임 시작 알림 전송 완료 (테마 선택 건너뛰기)');
        } catch (error) {
          console.error('Unity 게임 시작 알림 전송 실패:', error);
        }
      } else {
        console.log('Unity가 준비되지 않아 게임 시작 알림 큐에 저장');
        const gameStartData = {
          ...payload,
          skipThemeSelection: true,
          autoStartQuestions: true
        };
        messageQueue.current.push({ type: 'gameStart', data: gameStartData });
        messageQueue.current.push({ type: 'startGame', data: gameStartData });
      }
    });

    socket.on('questionStarted', (questionData: any) => {
      console.log('=== questionStarted 이벤트 수신 ===');
      console.log('문제 데이터:', questionData);
      
      setCurrentQuestion(questionData);
      
      // Unity에 문제 시작 알림 전송
      if (unityReady && unityRef.current?.contentWindow) {
        try {
          sendToUnity('questionStarted', questionData);
          sendToUnity('showQuestion', questionData); // 호환성을 위해 둘 다 전송
          console.log('Unity에 문제 시작 알림 전송 완료');
        } catch (error) {
          console.error('Unity 문제 시작 알림 전송 실패:', error);
        }
      } else {
        console.log('Unity가 준비되지 않아 문제 시작 알림 큐에 저장');
        messageQueue.current.push({ type: 'questionStarted', data: questionData });
        messageQueue.current.push({ type: 'showQuestion', data: questionData });
      }
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

    socket.on('error', (error: any) => {
      console.log('=== 서버에서 error 이벤트 수신 ===');
      console.log('에러 내용:', error);
      
      // 인증 실패인 경우 토큰 재생성 후 재연결
      if (error?.message === 'Not authenticated') {
        console.log('🔄 인증 실패 - 토큰 재생성 후 재연결 시도');
        localStorage.removeItem('token');
        
        // 3초 후 재연결 시도
        setTimeout(() => {
          console.log('🔄 인증 실패로 인한 재연결 시도');
          handleSocketConnection(state);
        }, 3000);
        return;
      }
      
      // 참가 실패 시 플래그 리셋 - 단, 게임을 찾을 수 없는 경우나 실제 오류만 처리
      if (error.message?.includes('Game not found') || 
          error.message?.includes('Game has already ended') ||
          error.message?.includes('Failed to join game')) {
        console.log('게임 참가 실패로 인한 hasJoinedGame 플래그 리셋:', error.message);
        setHasJoinedGame(false);
      }
      
      // 'Already joined' 에러는 실제로는 성공적인 상황일 수 있으므로 플래그 유지
      if (error.message?.includes('Already joined')) {
        console.log('이미 참가한 게임 - 플래그 유지');
      }
    });

    socket.on('playerReconnected', (player: Player) => {
      console.log('=== 플레이어 재연결 ===');
      console.log('재연결된 플레이어:', player);
      
      // 플레이어 목록 업데이트
      setPlayers(prev => {
        const updated = prev.map(p => 
          p.id === player.id 
            ? { ...p, ...player, isActive: true } 
            : p
        );
        
        // 새 플레이어인 경우 추가
        if (!updated.find(p => p.id === player.id)) {
          updated.push({ ...player, score: 0, isActive: true });
        }
        
        return updated;
      });
      
      // Unity에 재연결 알림
      sendToUnity('playerReconnected', player);
    });

    socket.on('playerDeactivated', (data: { playerId: string, reason: string }) => {
      console.log('=== 플레이어 비활성화 ===');
      console.log('비활성화된 플레이어:', data);
      
      // 플레이어를 비활성 상태로 변경 (완전 제거하지 않음)
      setPlayers(prev => 
        prev.map(p => 
          p.id === data.playerId 
            ? { ...p, isActive: false }
            : p
        )
      );
      
      // Unity에 비활성화 알림
      sendToUnity('playerDeactivated', data);
    });

    socket.on('disconnect', () => {
      console.log('소켓 연결 해제됨');
      setHasJoinedGame(false); // 연결 해제 시 플래그 리셋
    });

    // 페이지 언로드 시 명시적으로 게임에서 나가기
    const handleBeforeUnload = () => {
      if (socket.connected && gameState?.gameCode) {
        socket.emit('leaveGame', { 
          gameCode: gameState.gameCode,
          playerId: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleBeforeUnload);
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

  // const handleBackToLobby = () => {
  //   navigate('/teacher/dashboard');
  // };

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
    <div className="min-h-screen bg-gray-900 relative">
      {/* 모바일 감지 */}
      {typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) && (
        <style>{`
          .unity-mobile-container {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100vw;
            height: 100vh;
            z-index: 10;
          }
          .unity-mobile-iframe {
            width: 100vw !important;
            height: 100vh !important;
            border: none !important;
          }
        `}</style>
      )}
      
      {/* 상단 바: 양쪽 모두 숨김(요청에 따라 Unity만 표시) */}
      {false && (
      <div className="bg-gray-800 text-white p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">퀴즈 게임</h1>
            <div className="bg-blue-600 px-3 py-1 rounded">
              게임 코드: <span className="font-mono font-bold">{gameState?.gameCode}</span>
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
          
          {gameState?.mode === 'teacher' && (
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
      )}

      <div className="flex h-screen">
        {/* Unity 게임 영역 */}
        <div className={`flex-1 relative ${
          typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) 
            ? 'unity-mobile-container' 
            : ''
        }`}>
          <iframe
            ref={unityRef}
            src="/unity/index.html"
            className={`w-full h-full border-0 ${
              typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) 
                ? 'unity-mobile-iframe' 
                : ''
            }`}
            title="Unity Game"
            allow="accelerometer; gyroscope; microphone; camera"
            onLoad={() => {
              console.log('Unity iframe 로드 완료');
            }}
          />
        </div>

        {/* 사이드바 숨김: Unity 전용 화면 */}
        {false && (
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
                  {gameResults.map((result) => (
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