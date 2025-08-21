// 재발방지책 #69: Unity WebGL "null function or function signature mismatch" 오류 근본적 해결
mergeInto(LibraryManager.library, {
    // 기본 메시지 전송 함수 (가장 안전한 버전)
    SendMessageToWeb: function(messagePtr) {
        try {
            if (!messagePtr) {
                console.warn('SendMessageToWeb: messagePtr이 null');
                return;
            }
            
            var messageStr = UTF8ToString(messagePtr);
            if (!messageStr) {
                console.warn('SendMessageToWeb: messageStr이 null');
                return;
            }
            
            console.log('Unity → 웹: 메시지 전송:', messageStr);
            
            // 부모 창으로 메시지 전송 (런타임에서만 실행)
            if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
                try {
                    var parsedMessage = JSON.parse(messageStr);
                    window.parent.postMessage({
                        source: 'unity',
                        message: messageStr,
                        timestamp: Date.now()
                    }, '*');
                } catch (parseError) {
                    console.warn('메시지 파싱 실패, 원본 전송:', messageStr);
                    window.parent.postMessage({
                        source: 'unity',
                        message: messageStr,
                        timestamp: Date.now()
                    }, '*');
                }
            }
        } catch (error) {
            console.error('SendMessageToWeb 오류:', error);
        }
    },
    
    
    
    // 재발방지책 #69: C# DllImport와 완전히 일치하는 시그니처 (근본적 해결)
    
    // BootLoader.cs에서 사용하는 함수들 - IntPtr 매개변수 (정확한 시그니처)
    SendMessageToWebGLInternal: function(messagePtr) {
        try {
            if (!messagePtr) {
                console.warn('SendMessageToWebGLInternal: messagePtr이 null');
                return;
            }
            
            var messageStr = UTF8ToString(messagePtr);
            console.log('Unity → WebGL: 메시지 전송:', messageStr);
            
            // 부모 창으로 메시지 전송
            if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
                window.parent.postMessage({
                    source: 'unity',
                    message: messageStr,
                    timestamp: Date.now()
                }, '*');
            }
        } catch (error) {
            console.error('SendMessageToWebGLInternal 오류:', error);
        }
    },
    
    InitPostMessageListenerInternal: function(emptyPtr) {
        console.log('=== 재발방지책 #69 (근본적 해결): InitPostMessageListenerInternal 호출됨 ===');
        try {
            // 런타임에서만 window 객체 접근
            if (typeof window === 'undefined') {
                console.warn('window 객체가 정의되지 않음 (컴파일 타임)');
                return;
            }
            
            // 기존 리스너 제거 (중복 방지)
            if (window.unityMessageListener) {
                window.removeEventListener('message', window.unityMessageListener);
                console.log('기존 메시지 리스너 제거됨');
            }
            
            // 이미 초기화되었는지 확인
            if (window.__unityPMReady) {
                console.log('PostMessage 리스너가 이미 초기화됨');
                return;
            }
            window.__unityPMReady = true;
            
            // 메시지 큐 초기화
            if (!window.__messageQueue) {
                window.__messageQueue = [];
            }
            
            // 안전한 메시지 리스너 등록
            window.unityMessageListener = function(e) {
                try {
                    if (!e.data || !e.data.type) {
                        return;
                    }
                    
                    console.log('메시지 수신:', e.data.type);
                    
                    // Unity 인스턴스 확인
                    var target = window.unityInstance || window.Module;
                    if (!target || !target.SendMessage || typeof target.SendMessage !== 'function') {
                        console.warn('Unity 인스턴스가 준비되지 않음 - 메시지를 큐에 저장');
                        if (!window.__messageQueue) { window.__messageQueue = []; }
                        window.__messageQueue.push(e.data);
                        return;
                    }
                    
                    // 메시지 전달
                    var messageData = typeof e.data.data === 'string' ? e.data.data : JSON.stringify(e.data.data || '');
                    var fullMessage = JSON.stringify({
                        type: e.data.type,
                        data: messageData
                    });
                    
                    // 안전한 함수 호출: 모든 메시지를 SocketManager로 라우팅 (초기 생성이 보장됨)
                    try {
                        target.SendMessage('SocketManager', 'OnBrowserMessage', fullMessage);
                        console.log('메시지 전달 성공');
                    } catch (error) {
                        console.error('메시지 전달 실패, 큐에 재저장:', error);
                        if (!window.__messageQueue) { window.__messageQueue = []; }
                        window.__messageQueue.push(e.data);
                    }
                } catch (error) {
                    console.error('메시지 리스너 오류:', error);
                }
            };
            
            // 메시지 큐 처리 함수 및 준비 확인 함수 등록
            window.processUnityMessageQueue = function() {
                try {
                    if (!window.__messageQueue || window.__messageQueue.length === 0) { return; }
                    var target = window.unityInstance || window.Module;
                    if (!target || !target.SendMessage || typeof target.SendMessage !== 'function') { return; }
                    var remaining = [];
                    for (var i = 0; i < window.__messageQueue.length; i++) {
                        var msg = window.__messageQueue[i];
                        try {
                            var dataStr = typeof msg.data === 'string' ? msg.data : JSON.stringify(msg.data || '');
                            var fullMsg = JSON.stringify({ type: msg.type, data: dataStr });
                            // 단일 라우트: SocketManager
                            target.SendMessage('SocketManager', 'OnBrowserMessage', fullMsg);
                        } catch (err) {
                            console.error('큐 메시지 처리 실패:', err);
                            remaining.push(msg);
                        }
                    }
                    window.__messageQueue = remaining;
                } catch (errOuter) {
                    console.error('processUnityMessageQueue 오류:', errOuter);
                }
            };
            
            window.checkUnityReady = function() {
                try {
                    var target = window.unityInstance || window.Module;
                    if (target && target.SendMessage && typeof target.SendMessage === 'function') {
                        window.processUnityMessageQueue();
                    }
                } catch (err) {
                    console.error('checkUnityReady 오류:', err);
                }
            };

            // 리스너 등록
            window.addEventListener('message', window.unityMessageListener);
            console.log('메시지 리스너 등록 완료');

            // 주기적으로 준비 상태를 확인하여 큐 비우기 (타이밍 경쟁 조건 완화)
            if (!window.__unityQueueFlusher) {
                window.__unityQueueFlusher = setInterval(function() {
                    if (typeof window.checkUnityReady === 'function') {
                        window.checkUnityReady();
                    }
                }, 250);
            }
            
        } catch (error) {
            console.error('InitPostMessageListenerInternal 오류:', error);
        }
    },
    
    NotifySceneTransitionCompleteInternal: function(emptyPtr) {
        console.log('=== 재발방지책 #69 (근본적 해결): 씬 전환 완료 알림 ===');
        try {
            if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
                window.parent.postMessage({
                    source: 'unity',
                    type: 'sceneTransitionComplete',
                    timestamp: Date.now()
                }, '*');
            }
        } catch (error) {
            console.error('NotifySceneTransitionCompleteInternal 오류:', error);
        }
    },
    
    
    
    // SocketManager.cs에서 사용하는 함수들 - IntPtr 매개변수 (정확한 시그니처)
    SendMessageToWebInternal: function(messagePtr) {
        try {
            if (!messagePtr) {
                console.warn('SendMessageToWebInternal: messagePtr이 null');
                return;
            }
            
            var messageStr = UTF8ToString(messagePtr);
            console.log('Unity → Web (Internal): 메시지 전송:', messageStr);
            
            // 부모 창으로 메시지 전송
            if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
                window.parent.postMessage({
                    source: 'unity',
                    message: messageStr,
                    timestamp: Date.now()
                }, '*');
            }
        } catch (error) {
            console.error('SendMessageToWebInternal 오류:', error);
        }
    },
    
    
    
    // 메모리 관리 함수들 (재발방지책 #22 개선) - C# 시그니처와 완전 일치
    
    
    // 메모리 누수 방지 및 정리 함수
    cleanupUnityResources: function() {
        try {
            // 런타임에서만 window 객체 접근
            if (typeof window === 'undefined') {
                return;
            }
            
            // Unity 인스턴스 정리
            if (window.unityInstance) {
                try {
                    window.unityInstance.Quit();
                } catch (error) {
                    console.warn('Unity 정리 중 오류:', error);
                }
                window.unityInstance = null;
            }
            
            // 메시지 리스너 정리
            if (window.unityMessageListener) {
                window.removeEventListener('message', window.unityMessageListener);
                window.unityMessageListener = null;
            }
            
            // 메시지 큐 정리
            if (window.__messageQueue) {
                window.__messageQueue.length = 0;
            }
            
            // 전역 변수 정리
            window.__unityPMReady = false;
            
            console.log('Unity 리소스 정리 완료');
        } catch (error) {
            console.error('cleanupUnityResources 오류:', error);
        }
    },
    
    // 페이지 언로드 시 자동 정리 (런타임에서만 실행)
    onBeforeUnload: function() {
        if (typeof window !== 'undefined' && window.cleanupUnityResources) {
            window.cleanupUnityResources();
        }
    }
});

// 재발방지책 #66: 컴파일 타임에 실행되지 않도록 조건부 등록
if (typeof window !== 'undefined') {
    // 페이지 언로드 시 자동 정리 등록 (런타임에서만)
    window.addEventListener('beforeunload', function() {
        if (window.cleanupUnityResources) {
            window.cleanupUnityResources();
        }
    });
} 