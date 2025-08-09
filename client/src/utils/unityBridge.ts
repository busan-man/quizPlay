// Unity 게임과 웹페이지 간의 통신을 관리하는 브리지

export interface UnityMessage {
  type: string;
  data: any;
}

export interface GameState {
  gameCode: string;
  playerName?: string;
  characterId?: string;
  mode: 'student' | 'teacher';
  gameId?: string;
}

export interface Question {
  id: string;
  prompt: string;
  type: string;
  options?: string[];
  points: number;
  timeLimit?: number;
}

export interface AnswerResult {
  correct: boolean;
  pointsEarned: number;
  correctAnswer: string;
  playerName: string;
}

export interface ScoreUpdate {
  playerId: string;
  newScore: number;
  players: Array<{
    id: string;
    name: string;
    score: number;
    characterId?: string;
  }>;
}

export interface GameResult {
  playerId: string;
  playerName: string;
  finalScore: number;
  correctAnswers: number;
  totalQuestions: number;
  rank: number;
  characterId?: string;
}

class UnityBridge {
  private unityInstance: any = null;
  private messageQueue: UnityMessage[] = [];
  private isUnityReady = false;
  private listeners: Map<string, Function[]> = new Map();

  // Unity 인스턴스 설정
  setUnityInstance(instance: any) {
    this.unityInstance = instance;
    this.isUnityReady = true;
    this.processMessageQueue();
  }

  // Unity 준비 상태 확인
  isUnityGameReady(): boolean {
    return this.isUnityReady && this.unityInstance !== null;
  }

  // 메시지 큐 처리
  private processMessageQueue() {
    if (!this.isUnityReady) return;

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendToUnity(message.type, message.data);
      }
    }
  }

  // Unity로 메시지 전송
  sendToUnity(type: string, data: any) {
    const message: UnityMessage = { type, data };

    if (!this.isUnityReady) {
      this.messageQueue.push(message);
      return;
    }

    try {
      // Unity의 SendMessage 함수 호출
      if (this.unityInstance && this.unityInstance.SendMessage) {
        this.unityInstance.SendMessage('GameManager', 'ReceiveWebMessage', JSON.stringify(message));
      }
    } catch (error) {
      console.error('Unity 메시지 전송 실패:', error);
    }
  }

  // 웹에서 Unity로의 메시지 전송 (iframe postMessage 사용)
  sendToUnityIframe(type: string, data: any) {
    const message: UnityMessage = { type, data };
    
    // iframe으로 메시지 전송
    const iframe = document.querySelector('iframe[src*="unity"]') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(message, '*');
    }
  }

  // Unity에서 웹으로의 메시지 수신
  onUnityMessage(callback: (message: UnityMessage) => void) {
    const handler = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'object') {
        callback(event.data);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }

  // 이벤트 리스너 등록
  addEventListener(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  // 이벤트 리스너 제거
  removeEventListener(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // 이벤트 발생
  emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // 게임 시작 신호 전송
  sendGameStart(gameState: GameState) {
    this.sendToUnity('gameStart', { gameState });
  }

  // 새 문제 전송
  sendNewQuestion(question: Question) {
    this.sendToUnity('newQuestion', question);
  }

  // 답변 결과 전송
  sendAnswerResult(result: AnswerResult) {
    this.sendToUnity('answerResult', result);
  }

  // 점수 업데이트 전송
  sendScoreUpdate(scoreData: ScoreUpdate) {
    this.sendToUnity('scoreUpdate', scoreData);
  }

  // 게임 종료 신호 전송
  sendGameEnd(results: GameResult[]) {
    this.sendToUnity('gameEnd', { results });
  }

  // Unity에서 답변 제출 수신
  onAnswerSubmitted(callback: (data: { answer: string; questionId: string }) => void) {
    this.addEventListener('answerSubmitted', callback);
  }

  // Unity에서 게임 완료 수신
  onGameComplete(callback: (data: { 
    finalScore: number; 
    correctAnswers: number; 
    totalQuestions: number 
  }) => void) {
    this.addEventListener('gameComplete', callback);
  }

  // Unity에서 게임 준비 완료 수신
  onUnityReady(callback: () => void) {
    this.addEventListener('unityReady', callback);
  }

  // Unity에서 에러 수신
  onUnityError(callback: (error: string) => void) {
    this.addEventListener('unityError', callback);
  }

  // Unity 게임 로드 상태 확인
  checkUnityLoadStatus(): Promise<boolean> {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 50; // 5초 대기
      
      const checkInterval = setInterval(() => {
        attempts++;
        
        if (this.isUnityGameReady()) {
          clearInterval(checkInterval);
          resolve(true);
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          resolve(false);
        }
      }, 100);
    });
  }

  // Unity 게임 초기화
  async initializeUnity(gameState: GameState): Promise<boolean> {
    try {
      // Unity 게임 로드 대기
      const isLoaded = await this.checkUnityLoadStatus();
      
      if (!isLoaded) {
        console.error('Unity 게임 로드 실패');
        return false;
      }

      // 게임 상태 전송
      this.sendGameStart(gameState);
      
      // Unity 준비 완료 신호 대기
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          this.removeEventListener('unityReady', onReady);
          resolve(false);
        }, 5000);

        const onReady = () => {
          clearTimeout(timeout);
          this.removeEventListener('unityReady', onReady);
          resolve(true);
        };

        this.onUnityReady(onReady);
      });
    } catch (error) {
      console.error('Unity 초기화 실패:', error);
      return false;
    }
  }

  // Unity 게임 정리
  cleanup() {
    this.unityInstance = null;
    this.isUnityReady = false;
    this.messageQueue = [];
    this.listeners.clear();
  }
}

// 싱글톤 인스턴스 생성
export const unityBridge = new UnityBridge();

export default unityBridge; 