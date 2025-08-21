# Quiz Master Unity WebGL Project

## 🎮 프로젝트 개요
Unity WebGL 기반 교육용 퀴즈 플랫폼

## 🛡️ Unity WebGL 재발방지책 가이드

이 프로젝트는 Unity WebGL에서 자주 발생하는 문제들을 해결하기 위한 **33개의 재발방지책**을 포함합니다.

### **📋 재발방지책 목록**
- **#1-19**: 통합 재발 방지 시스템
- **#20-25**: 기존 재발 방지책 (ES5 호환성, DllImport 등)
- **#26-33**: 고급 재발 방지책 (스트리핑 방지, 호출 타이밍 등)

### **🚨 주요 해결 문제들**
1. `null function or function signature mismatch`
2. `ReferenceError: UNITY_WEBGL is not defined`
3. `SyntaxError: Unexpected identifier`

### **📖 상세 가이드**
자세한 내용은 [`재발방지책_가이드.md`](./재발방지책_가이드.md) 파일을 참조하세요.

## 🚀 시작하기

### **필수 설정**
1. Unity 2022.3 LTS 이상
2. WebGL Build Support 설치
3. 재발방지책 가이드 확인

### **빌드 전 체크리스트**
- [ ] 모든 DllImport 함수가 IntPtr 사용
- [ ] jslib 파일에서 전처리기 지시문 제거
- [ ] link.xml 파일 생성
- [ ] Player Settings → Managed Stripping Level → Low

## 📁 프로젝트 구조
```
quiz-master/
├── Assets/
│   ├── Plugins/WebGL/PostMessage.jslib  # JavaScript 브리지
│   ├── Scripts/Controllers/             # C# 컨트롤러
│   └── ...
├── 재발방지책_가이드.md                  # 완전한 가이드
└── README.md                           # 이 파일
```

## 🔧 기술 스택
- **Unity**: 2022.3 LTS
- **WebGL**: Emscripten 기반
- **JavaScript**: ES5 호환
- **C#**: .NET Standard 2.1

## 📞 지원
문제가 발생하면 재발방지책 가이드를 먼저 확인하세요!

---

**버전**: 1.0  
**마지막 업데이트**: 2025-08-05
