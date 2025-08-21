// Unity WebGL과 웹 클라이언트 간의 통신 브리지
class UnityBridge {
    constructor() {
        this.unityInstance = null;
        this.messageQueue = [];
        this.isReady = false;
        this.retryCount = 0;
        this.maxRetries = 10;
        
        // 메시지 수신을 위한 이벤트 리스너 등록
        window.addEventListener('message', this.handleMessage.bind(this));
        
        console.log('Unity Bridge 초기화됨');
    }
    
    // Unity 인스턴스 설정
    setUnityInstance(instance) {
        this.unityInstance = instance;
        this.isReady = true;
        
        // 대기 중인 메시지들 처리
        this.processMessageQueue();
        
        console.log('Unity 인스턴스 설정됨');
    }
    
    // 웹에서 Unity로 메시지 전송 (안전한 버전)
    sendMessageToUnity(type, data) {
        const message = {
            type: type,
            data: data
        };
        
        if (this.isReady && this.unityInstance && this.unityInstance.SendMessage) {
            try {
                // Unity의 ReceiveMessageFromWeb 메서드 호출
                this.unityInstance.SendMessage('WebCommunicationController', 'ReceiveMessageFromWeb', JSON.stringify(message));
                console.log('Unity로 메시지 전송 성공:', type);
                return true;
            } catch (error) {
                console.error('Unity로 메시지 전송 실패:', error);
                // 실패한 메시지를 큐에 다시 저장
                this.messageQueue.push(message);
                return false;
            }
        } else {
            // Unity가 준비되지 않았으면 큐에 저장
            this.messageQueue.push(message);
            console.log('Unity가 준비되지 않음, 메시지를 큐에 저장:', type);
            return false;
        }
    }
    
    // Unity에서 웹으로 메시지 전송 (Unity에서 호출) - 안전한 버전
    sendMessageToWeb(messageJson) {
        try {
            if (!messageJson) {
                console.warn('sendMessageToWeb: messageJson이 null 또는 undefined');
                return;
            }
            
            const message = typeof messageJson === 'string' ? JSON.parse(messageJson) : messageJson;
            
            // 부모 창으로 메시지 전송
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({
                    source: 'unity',
                    type: message.type,
                    data: message.data
                }, '*');
            }
            
            console.log('Unity에서 웹으로 메시지 전송:', message.type);
        } catch (error) {
            console.error('메시지 전송 오류:', error, '원본 메시지:', messageJson);
        }
    }
    
    // 웹에서 받은 메시지 처리
    handleMessage(event) {
        try {
            if (event.data && event.data.source === 'web') {
                const { type, data } = event.data;
                this.sendMessageToUnity(type, data);
            }
        } catch (error) {
            console.error('메시지 처리 오류:', error);
        }
    }
    
    // 대기 중인 메시지 처리 (재시도 로직 포함)
    processMessageQueue() {
        if (this.messageQueue.length === 0) return;
        
        console.log(`큐에 있는 메시지 처리 시작: ${this.messageQueue.length}개`);
        
        const remainingMessages = [];
        
        this.messageQueue.forEach(message => {
            if (!this.sendMessageToUnity(message.type, message.data)) {
                remainingMessages.push(message);
            }
        });
        
        this.messageQueue = remainingMessages;
        
        // 남은 메시지가 있으면 재시도
        if (this.messageQueue.length > 0 && this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(`메시지 재시도 ${this.retryCount}/${this.maxRetries}`);
            setTimeout(() => this.processMessageQueue(), 1000);
        } else if (this.messageQueue.length > 0) {
            console.warn(`메시지 처리 실패: ${this.messageQueue.length}개 메시지가 남음`);
        }
    }
    
    // Unity 인스턴스 상태 확인
    isUnityReady() {
        return this.isReady && this.unityInstance && this.unityInstance.SendMessage;
    }
    
    // 디버깅용 메서드
    debug() {
        console.log('Unity Bridge 상태:');
        console.log('- isReady:', this.isReady);
        console.log('- unityInstance:', !!this.unityInstance);
        console.log('- SendMessage 함수:', typeof this.unityInstance?.SendMessage);
        console.log('- 큐에 있는 메시지:', this.messageQueue.length);
        console.log('- 재시도 횟수:', this.retryCount);
    }
}

// 전역 Unity 브리지 인스턴스 생성
window.unityBridge = new UnityBridge();

// Unity WebGL 로더에서 호출할 함수들 (안전한 버전)
window.setUnityInstance = function(instance) {
    console.log('setUnityInstance 호출됨');
    if (window.unityBridge) {
        window.unityBridge.setUnityInstance(instance);
    }
    // 전역에도 설정
    window.unityInstance = instance;
    if (instance && instance.Module) {
        window.Module = instance.Module;
    }
};

window.sendMessageToWeb = function(message) {
    console.log('sendMessageToWeb 호출됨:', message);
    if (window.unityBridge) {
        window.unityBridge.sendMessageToWeb(message);
    }
};

// Unity에서 직접 호출할 수 있는 함수들 (PostMessage.jslib와 호환)
window.SendMessageToWeb = function(message) {
    console.log('SendMessageToWeb 호출됨:', message);
    if (window.unityBridge) {
        window.unityBridge.sendMessageToWeb(message);
    }
};

// 디버깅용 전역 함수
window.debugUnityBridge = function() {
    if (window.unityBridge) {
        window.unityBridge.debug();
    } else {
        console.log('Unity Bridge가 초기화되지 않음');
    }
}; 