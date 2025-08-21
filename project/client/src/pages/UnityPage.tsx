import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

interface UnityGameData {
  role: 'student' | 'teacher';
  code: string;
  nickname?: string;
  gameId?: string;
}

const UnityPage: React.FC = () => {
  const unityRef = useRef<HTMLIFrameElement>(null);
  const [searchParams] = useSearchParams();
  const initMessageSentRef = useRef(false); // 재발방지책 #75: 중복 전송 방지
  const initAckedRef = useRef(false); // Unity의 init-complete 수신 여부
  const resendIntervalRef = useRef<number | null>(null); // 재전송 타이머
  const resendAttemptsRef = useRef(0); // 재전송 횟수

  useEffect(() => {
    // URL 파라미터에서 게임 데이터 추출
    const role = searchParams.get('role') as 'student' | 'teacher';
    const code = searchParams.get('code');
    const nickname = searchParams.get('nickname');
    const gameId = searchParams.get('gameId');

    if (!role || !code) {
      console.error('필수 파라미터가 누락되었습니다:', { role, code });
      return;
    }

    const gameData: UnityGameData = {
      role,
      code,
      nickname: nickname || 'Unknown',
      gameId: gameId || undefined
    };

    console.log('Unity 게임 데이터:', gameData);

    // Unity가 로드되면 초기화 메시지 전송
    const sendInitMessage = (force?: boolean) => {
      // 재발방지책 #75/#78: 씬 전환 후 강제 재전송 허용
      if (!force && (initMessageSentRef.current || initAckedRef.current)) {
        console.log('초기화 메시지가 이미 전송됨, 중복 전송 방지');
        return;
      }

      if (unityRef.current?.contentWindow) {
        const message = {
          type: 'init',
          data: JSON.stringify(gameData)
        };

        console.log('Unity로 초기화 메시지 전송:', message, force ? '(force)' : '');
        unityRef.current.contentWindow.postMessage(message, '*');
        initMessageSentRef.current = true; // 전송 완료 표시

        // 재발방지책 #75: 안전망 - init-complete 수신까지 주기적으로 재전송 (최대 20회)
        if (resendIntervalRef.current !== null) {
          window.clearInterval(resendIntervalRef.current);
          resendIntervalRef.current = null;
        }
        initAckedRef.current = false;
        resendAttemptsRef.current = 0;
        resendIntervalRef.current = window.setInterval(() => {
          if (initAckedRef.current) {
            if (resendIntervalRef.current !== null) {
              window.clearInterval(resendIntervalRef.current);
              resendIntervalRef.current = null;
            }
            return;
          }
          if (resendAttemptsRef.current >= 20) {
            console.warn('init 메시지 재전송 최대 횟수 도달');
            if (resendIntervalRef.current !== null) {
              window.clearInterval(resendIntervalRef.current);
              resendIntervalRef.current = null;
            }
            return;
          }
          resendAttemptsRef.current += 1;
          try {
            unityRef.current?.contentWindow?.postMessage(message, '*');
            console.log('init 재전송', resendAttemptsRef.current);
          } catch (e) {
            console.warn('init 재전송 실패', e);
          }
        }, 1500);
      }
    };

    // 재발방지책 #75: Unity iframe 로드 완료 시 안전한 초기화 메시지 전송
    const handleIframeLoad = () => {
      console.log('Unity iframe 로드 완료, 초기화 메시지 전송');
      initAckedRef.current = false;
      setTimeout(sendInitMessage, 2000); // Unity 초기화 대기 시간 증가
    };

    // Unity 준비 상태 확인
    const handleUnityMessage = (event: MessageEvent) => {
      if (event.source !== unityRef.current?.contentWindow) return;

      console.log('Unity → React 메시지 수신:', event.data);

      // 재발방지책 #75: 통합 메시지 처리
        if (event.data && event.data.source === 'unity') {
          // 1) 씬 전환 완료 시 초기화 트리거 (이미 init-complete면 스킵)
          if (event.data.type === 'sceneTransitionComplete') {
            console.log('Unity 씬 전환 완료 감지');
            if (initAckedRef.current) {
              // 이미 초기화 확인됨 → 재전송 불필요
              return;
            }
            // 리스너 준비 타이밍 이슈 대응 - 강제 재전송
            initMessageSentRef.current = false;
            initAckedRef.current = false;
            setTimeout(() => sendInitMessage(true), 500);
          }

        // 2) 기존 로딩 완료 메시지도 처리
        try {
          const messageStr = event.data.message;
          if (!messageStr || messageStr === 'undefined' || messageStr === 'null') {
            console.warn('Unity에서 빈 메시지 수신:', messageStr);
            return;
          }
          
          const unityMessage = JSON.parse(messageStr);
          console.log('Unity 메시지 파싱됨:', unityMessage);
          
          if (unityMessage.type === 'unity-loaded') {
            console.log('Unity 로딩 완료, 초기화 메시지 전송');
            setTimeout(() => sendInitMessage(true), 500);
            return;
          }
          if (unityMessage.type === 'init-complete') {
            console.log('Unity 초기화 확인(init-complete) 수신');
            initAckedRef.current = true;
            if (resendIntervalRef.current !== null) {
              window.clearInterval(resendIntervalRef.current);
              resendIntervalRef.current = null;
            }
            return;
          }
        } catch (error) {
          console.error('Unity 메시지 파싱 오류:', error, '원본 데이터:', event.data);
        }
      }
      
      // 기존 형식도 지원 (backward compatibility)
      const { type } = event.data || {};
      if (type === 'unity-ready') {
        console.log('Unity 준비됨, 초기화 메시지 전송');
        setTimeout(() => sendInitMessage(true), 500);
      }
    };

    window.addEventListener('message', handleUnityMessage);

    // 재발방지책 #75: iframe 로드 이벤트 리스너 등록
    const iframeElement = unityRef.current;
    if (iframeElement) {
      iframeElement.addEventListener('load', handleIframeLoad);
    }

    return () => {
      window.removeEventListener('message', handleUnityMessage);
      if (iframeElement) {
        iframeElement.removeEventListener('load', handleIframeLoad);
      }
      // 재발방지책 #75: 컴포넌트 언마운트 시 플래그 리셋
      initMessageSentRef.current = false;
      initAckedRef.current = false;
      if (resendIntervalRef.current !== null) {
        window.clearInterval(resendIntervalRef.current);
        resendIntervalRef.current = null;
      }
    };
  }, [searchParams]);

  return (
    <div className="w-full h-screen bg-black">
      <iframe
        ref={unityRef}
        src="/unity/index.html"
        className="w-full h-full border-0"
        title="Unity Game"
      />
    </div>
  );
};

export default UnityPage; 