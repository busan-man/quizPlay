// Unity WebGL과 웹 클라이언트 간의 통신 브리지
class UnityBridge {
    constructor() {
        this.unityInstance = null;
        this.messageQueue = [];
        this.isReady = false;
        
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
    
    // 웹에서 Unity로 메시지 전송
    sendMessageToUnity(type, data) {
        const message = {
            type: type,
            data: data
        };
        
        if (this.isReady && this.unityInstance) {
            // Unity의 ReceiveMessageFromWeb 메서드 호출
            this.unityInstance.SendMessage('WebCommunicationController', 'ReceiveMessageFromWeb', JSON.stringify(message));
        } else {
            // Unity가 준비되지 않았으면 큐에 저장
            this.messageQueue.push(message);
        }
    }
    
    // Unity에서 웹으로 메시지 전송 (Unity에서 호출)
    sendMessageToWeb(messageJson) {
        try {
            const message = JSON.parse(messageJson);
            
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
            console.error('메시지 전송 오류:', error);
        }
    }
    
    // 웹에서 받은 메시지 처리
    handleMessage(event) {
        if (event.data && event.data.source === 'web') {
            const { type, data } = event.data;
            this.sendMessageToUnity(type, data);
        }
    }
    
    // 대기 중인 메시지 처리
    processMessageQueue() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.sendMessageToUnity(message.type, message.data);
        }
    }
}

// 전역 Unity 브리지 인스턴스 생성
window.unityBridge = new UnityBridge();

// Unity WebGL 로더에서 호출할 함수들
window.setUnityInstance = function(instance) {
    window.unityBridge.setUnityInstance(instance);
};

window.sendMessageToWeb = function(message) {
    window.unityBridge.sendMessageToWeb(message);
}; 