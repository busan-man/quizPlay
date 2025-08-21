# Unity-React 통신 충돌 문제 분석

## 🔍 문제 개요

Unity WebGL과 React 간의 통신에서 **두 가지 핵심 문제가 서로 충돌**하고 있습니다:

1. **통신 관련 문제**: React에서 Unity로 역할 정보 전송 실패
2. **Unity WebGL 함수 오류**: "null function or function signature mismatch" 오류

## 📋 현재 상황

### 문제 1: 통신 실패
- **증상**: Unity가 React로부터 역할 정보를 받지 못함
- **로그**: `역할 정보 수신 시간 초과, 기본값으로 진행`
- **영향**: 게임에서 잘못된 역할로 실행됨

### 문제 2: Unity WebGL 함수 오류
- **증상**: `RuntimeError: null function or function signature mismatch`
- **원인**: Unity WebGL에서 JavaScript 함수 호출 시 함수가 등록되지 않음
- **영향**: Unity 게임이 완전히 작동하지 않음

## 🔄 충돌 패턴

### 패턴 1: 통신 문제 해결 시 → #69 오류 발생
```
✅ React ↔ Unity 통신 복원
❌ Unity WebGL 함수 등록 실패 → "null function" 오류
```

### 패턴 2: #69 오류 해결 시 → 통신 문제 발생
```
✅ Unity WebGL 함수 등록 성공
❌ React ↔ Unity 통신 실패 → 역할 정보 수신 실패
```

## 🛠️ 적용된 해결책들

### 재발방지책 #69: Unity WebGL 함수 오류 해결
```javascript
// Unity 측: 씬 전환 시 JavaScript 함수 재등록
function NotifySceneTransitionComplete() {
    // 씬 전환 완료 알림을 React로 전송
    SendMessageToWeb("sceneTransitionComplete");
}

// React 측: 씬 전환 완료 메시지 수신 시 함수 재등록
if (event.data.type === 'sceneTransitionComplete') {
    // JavaScript 함수 재등록
    RegisterUnityFunctions();
}
```

### 재발방지책 #74: 무한 루프 방지
```typescript
// React 측: 무한 루프 방지를 위해 sceneTransitionComplete 처리 차단
// if (event.data.type === 'sceneTransitionComplete') {
//   console.log('Unity 씬 전환 완료 감지, 초기화 메시지 전송');
//   setTimeout(sendInitMessage, 500);
// }
```

## 💥 충돌 지점

### 핵심 충돌:
1. **#69**: `sceneTransitionComplete` 메시지로 함수 재등록 트리거 필요
2. **#74**: `sceneTransitionComplete` 메시지 처리 차단으로 인한 통신 실패

### 현재 코드 상태:
```typescript
// UnityPage.tsx - 현재 상태
const handleUnityMessage = (event: MessageEvent) => {
  if (event.data && event.data.source === 'unity') {
    try {
      const messageStr = event.data.message;
      const unityMessage = JSON.parse(messageStr);
      
      // 재발방지책 #74: unity-loaded 타입만 처리 (무한 루프 방지)
      if (unityMessage.type === 'unity-loaded') {
        console.log('Unity 로딩 완료, 초기화 메시지 전송');
        setTimeout(sendInitMessage, 500);
      }
      
      // 재발방지책 #74: sceneTransitionComplete는 처리하지 않음 (무한 루프 방지)
      // if (event.data && event.data.source === 'unity' && event.data.type === 'sceneTransitionComplete') {
      //   console.log('Unity 씬 전환 완료 감지, 초기화 메시지 전송');
      //   setTimeout(sendInitMessage, 500);
      // }
    } catch (error) {
      console.error('Unity 메시지 파싱 오류:', error);
    }
  }
  
  // 기존 형식도 지원 (backward compatibility)
  const { type } = event.data || {};
  if (type === 'unity-ready') {
    console.log('Unity 준비됨, 초기화 메시지 전송');
    setTimeout(sendInitMessage, 500);
  }
};
```

## 📊 로그 분석

### 현재 로그 패턴:
```
UnityPage.tsx:67 Unity → React 메시지 수신: {source: 'unity', type: 'sceneTransitionComplete', timestamp: 1754574364348}
UnityPage.tsx:75 Unity에서 빈 메시지 수신: undefined
```

### Unity 측 로그:
```
1ca48827-d02b-4f2d-aa35-02a7bde05bce:9 역할 정보 수신 대기 중... (60.1초 경과)
1ca48827-d02b-4f2d-aa35-02a7bde05bce:9 역할 정보 수신 시간 초과, 기본값으로 진행
```

## 🎯 해결 방향

### 통합 해결책 필요:
1. **`sceneTransitionComplete` 처리 복원** (통신 복원)
2. **중복 전송 방지 메커니즘 강화** (무한 루프 방지)
3. **타이밍 조정** (함수 재등록과 통신의 순서 조정)

### 예상 해결책 구조:
```typescript
// 재발방지책 #75: 통신과 함수 재등록의 통합 해결
const handleUnityMessage = (event: MessageEvent) => {
  if (event.data && event.data.source === 'unity') {
    
    // 1. sceneTransitionComplete 처리 (재발방지책 #69 복원)
    if (event.data.type === 'sceneTransitionComplete') {
      console.log('Unity 씬 전환 완료 감지');
      
      // 2. 중복 방지 체크 (재발방지책 #74 유지)
      if (!initMessageSentRef.current) {
        console.log('초기화 메시지 전송');
        setTimeout(sendInitMessage, 500);
      } else {
        console.log('이미 초기화 메시지 전송됨, 건너뜀');
      }
    }
    
    // 3. 기존 메시지 타입들 처리
    try {
      const messageStr = event.data.message;
      const unityMessage = JSON.parse(messageStr);
      
      if (unityMessage.type === 'unity-loaded') {
        console.log('Unity 로딩 완료, 초기화 메시지 전송');
        setTimeout(sendInitMessage, 500);
      }
    } catch (error) {
      console.error('Unity 메시지 파싱 오류:', error);
    }
  }
};
```

## 📝 요청사항

이 문제를 해결하기 위해 다음 정보가 필요합니다:

1. **Unity 측 JavaScript 함수 등록 코드** (재발방지책 #69 관련)
2. **React 측 메시지 처리 로직** (재발방지책 #74 관련)
3. **현재 적용된 모든 재발방지책 목록**
4. **Unity WebGL 빌드 설정**
5. **브라우저 콘솔의 전체 오류 로그**

## 🔧 테스트 시나리오

### 시나리오 1: 통신 우선
- `sceneTransitionComplete` 처리 복원
- 중복 전송 방지 메커니즘 추가
- Unity WebGL 함수 오류 모니터링

### 시나리오 2: 함수 등록 우선
- Unity WebGL 함수 등록 로직 강화
- 통신 실패 시 대체 메커니즘 구현
- 역할 정보 수신 실패 모니터링

### 시나리오 3: 통합 해결
- 두 문제를 동시에 해결하는 새로운 메커니즘 구현
- 타이밍 조정으로 순서 보장
- 안전장치 다중화

## 📞 문의사항

1. **Unity WebGL 빌드 시 Development Build 사용 여부**
2. **브라우저 호환성 문제 가능성**
3. **네트워크 지연이나 타이밍 이슈**
4. **기존 재발방지책들의 우선순위**

---

**작성일**: 2024년 1월  
**버전**: 1.0  
**상태**: 분석 완료, 해결책 대기 중
