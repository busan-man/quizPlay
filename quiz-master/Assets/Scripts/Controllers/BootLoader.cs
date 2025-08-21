using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public class BootLoader : MonoBehaviour
{
    [Header("Settings")]
    public bool debugMode = true;
    public float initializationDelay = 1f;
    public float maxWaitTime = 30f; // 최대 대기 시간을 30초로 증가
    
    // 정적 참조 추가
    public static BootLoader Instance { get; private set; }
    
    // 재발방지책 #19: 씬 전환 완료 감지 시스템 개선
    private bool isTransitioning = false;
    
    private bool isInitialized = false;
    private bool roleReceived = false;

    // 씬 완료 알림 디바운스/중복 방지 상태
    private string currentSceneName = null;
    private string lastNotifiedScene = null;
    private bool notifyInFlight = false;
    private Coroutine notifyCoroutine = null;
    
    void Awake()
    {
        // 재발방지책 #15: 모든 씬 매니저 통합 안정화
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);  // 씬 전환 시에도 파괴되지 않도록
        }
        else
        {
            // 이미 인스턴스가 있으면 이 객체 파괴
            Destroy(gameObject);
            return;
        }
        
        // 재발방지책 #19: 씬 전환 완료 감지 시스템 개선
        SceneManager.sceneLoaded += OnSceneLoaded;
        SceneManager.sceneUnloaded += OnSceneUnloaded;
        
        // 초기화 시작
        StartCoroutine(InitializeSystem());
    }

    void OnDestroy()
    {
        // 이벤트 구독 해제 및 코루틴 정리
        SceneManager.sceneLoaded -= OnSceneLoaded;
        SceneManager.sceneUnloaded -= OnSceneUnloaded;
        if (notifyCoroutine != null)
        {
            StopCoroutine(notifyCoroutine);
            notifyCoroutine = null;
        }
    }
    
    IEnumerator InitializeSystem()
    {
        if (debugMode)
        {
            Debug.Log("시스템 초기화 시작...");
        }
        
        // 초기화 지연 (로딩 화면 표시용)
        yield return new WaitForSeconds(initializationDelay);
        
        // 1. SocketManager 프리팹 인스턴스화 (먼저 생성)
        InitializeSocketManager();
        
        if (debugMode)
        {
            Debug.Log("SocketManager 초기화 완료");
        }
        
        // 한 프레임 기다려 SocketManager 등록 완료 보장
        yield return null;
        
        // 2. PostMessage 리스너 초기화 (SocketManager 생성 후)
        InitializePostMessageListener();
        
        if (debugMode)
        {
            Debug.Log("PostMessage 리스너 초기화 완료");
        }
        
        // 3. GameStateManager 프리팹 인스턴스화 (필요한 경우)
        InitializeGameStateManager();
        
        if (debugMode)
        {
            Debug.Log("GameStateManager 초기화 완료");
        }
        
        // 4. Unity 로딩 완료 신호 전송 (웹에 알림)
        SendUnityLoadedSignal();
        // 안정적 핸드셰이크를 위한 준비 완료 신호 추가 전송
        StartCoroutine(SendReadySignalDelayed());
        
        // 5. 역할 정보 수신 대기 (Unity 로딩 완료 후)
        yield return StartCoroutine(WaitForRoleInformation());
        
        // 6. 초기화 완료 후 적절한 씬으로 이동 (이미 초기화된 경우 재로드 방지)
        yield return new WaitForSeconds(0.5f);
        if (!isInitialized)
        {
            LoadInitialScene();
        }
    }
    
    // 재발방지책 #34: 역할 정보 수신 시간 초과 방지
    IEnumerator WaitForRoleInformation()
    {
        float waitTime = 0f;
        float maxWaitTime = 60f; // 30초 → 60초로 증가 (재발방지책 #34)
        
        if (debugMode)
        {
            Debug.Log("역할 정보 수신 대기 중...");
        }
        
        // 역할 정보가 수신될 때까지 대기 (재발방지책 #34 적용)
        while (!roleReceived && waitTime < maxWaitTime)
        {
            // SocketManager가 존재하고 역할이 설정되었는지 확인
            if (SocketManager.Instance != null && !string.IsNullOrEmpty(SocketManager.Instance.CurrentRole))
            {
                roleReceived = true;
                if (debugMode)
                {
                    Debug.Log($"역할 정보 수신됨: {SocketManager.Instance.CurrentRole}");
                }
                break;
            }
            
            // 더 자주 체크 (0.1초마다)
            waitTime += 0.1f;
            yield return new WaitForSeconds(0.1f);
            
            // 주기적으로 상태 로그 출력 (재발방지책 #34)
            if (waitTime % 5f < 0.1f)
            {
                Debug.Log($"역할 정보 수신 대기 중... ({waitTime:F1}초 경과)");
                if (SocketManager.Instance != null)
                {
                    Debug.Log($"현재 SocketManager.CurrentRole: '{SocketManager.Instance.CurrentRole}'");
                    Debug.Log($"SocketManager.Instance null 여부: {SocketManager.Instance == null}");
                    Debug.Log($"roleReceived 플래그: {roleReceived}");
                }
                else
                {
                    Debug.LogWarning("SocketManager.Instance가 null입니다!");
                }
            }
        }
        
        if (!roleReceived)
        {
            Debug.LogWarning("역할 정보 수신 시간 초과, 기본값으로 진행");
            // 기본값 설정 (에디터 모드에서 테스트용)
            if (SocketManager.Instance != null)
            {
                SocketManager.Instance.SetDefaultRole("student");
                // 기본값 설정 후에도 roleReceived를 true로 설정
                roleReceived = true;
                if (debugMode)
                {
                    Debug.Log("기본값 'student'로 설정됨");
                }
            }
            else
            {
                Debug.LogError("SocketManager.Instance가 null이어서 기본값 설정 불가");
            }
        }
    }
    
    // SocketManager에서 역할이 설정될 때 호출되는 메서드
    public void OnRoleSet()
    {
        if (!roleReceived)
        {
            roleReceived = true;
            if (debugMode)
            {
                Debug.Log("역할 정보가 설정되어 roleReceived를 true로 변경");
            }
        }
        
        // 이미 초기화가 끝난 뒤에는 같은 씬 재로드를 피한다
        if (isInitialized)
        {
            if (debugMode)
            {
                Debug.Log("이미 초기화 완료됨 - 같은 씬 재로드 방지");
            }
            return;
        }
    }
    
    // roleReceived 플래그를 직접 설정하는 메서드 (타이밍 경쟁 조건 방지용)
    public void SetRoleReceived(bool value)
    {
        roleReceived = value;
        if (debugMode)
        {
            Debug.Log($"roleReceived 플래그를 {value}로 설정");
        }
    }
    
    // roleReceived 플래그를 확인하는 메서드
    public bool IsRoleReceived()
    {
        return roleReceived;
    }
    
    void InitializePostMessageListener()
    {
        // WebGL에서 JavaScript와의 통신을 위한 리스너 초기화
        if (Application.platform == RuntimePlatform.WebGLPlayer)
        {
            // 재발방지책 #30: 호출 타이밍 지연 적용
            StartCoroutine(DelayedInitPostMessageListener());
        }
        else
        {
            // 에디터나 다른 플랫폼에서는 디버그 모드로 시뮬레이션
            if (debugMode)
            {
                Debug.Log("에디터 모드: PostMessage 리스너 시뮬레이션");
                StartCoroutine(SimulateWebMessages());
            }
        }
    }
    
    // 재발방지책 #30: 호출 타이밍 지연 시스템
    IEnumerator DelayedInitPostMessageListener()
    {
        // 한 프레임 대기
        yield return null;
        
        // 추가 지연 시간 (0.1초)
        yield return new WaitForSeconds(0.1f);
        
        try
        {
            // JavaScript 함수 호출 (안전한 버전)
            InitPostMessageListener();
            if (debugMode)
            {
                Debug.Log("PostMessage 리스너 초기화 성공 (지연 호출)");
            }
        }
        catch (System.Exception e)
        {
            Debug.LogError($"PostMessage 리스너 초기화 실패: {e.Message}");
            // 실패해도 계속 진행
        }
    }
    
    void InitializeSocketManager()
    {
        // SocketManager가 이미 존재하는지 확인
        if (SocketManager.Instance != null)
        {
            if (debugMode)
            {
                Debug.Log("SocketManager가 이미 존재합니다.");
            }
            return;
        }
        
        // Resources 폴더에서 SocketManager 프리팹 로드 시도
        GameObject socketManagerPrefab = Resources.Load<GameObject>("SocketManager");
        
        // 프리팹에서 SocketManager 인스턴스화
        if (socketManagerPrefab != null)
        {
            GameObject socketManagerObj = Instantiate(socketManagerPrefab);
            socketManagerObj.name = "SocketManager";
            
            if (debugMode)
            {
                Debug.Log("SocketManager 프리팹에서 인스턴스화됨");
            }
        }
        else
        {
            // 프리팹이 없으면 빈 GameObject에 컴포넌트 추가
            GameObject socketManagerObj = new GameObject("SocketManager");
            socketManagerObj.AddComponent<SocketManager>();
            
            if (debugMode)
            {
                Debug.Log("SocketManager 컴포넌트를 새 GameObject에 추가함");
            }
        }
    }
    
    void InitializeGameStateManager()
    {
        // GameStateManager가 이미 존재하는지 확인
        if (GameStateManager.Instance != null)
        {
            if (debugMode)
            {
                Debug.Log("GameStateManager가 이미 존재합니다.");
            }
            return;
        }
        
        // Resources 폴더에서 GameStateManager 프리팹 로드 시도
        GameObject gameStateManagerPrefab = Resources.Load<GameObject>("GameStateManager");
        
        // 프리팹이 할당되어 있으면 사용
        if (gameStateManagerPrefab != null)
        {
            try
            {
                GameObject gameStateManagerObj = Instantiate(gameStateManagerPrefab);
                gameStateManagerObj.name = "GameStateManager";
                
                if (debugMode)
                {
                    Debug.Log("GameStateManager 프리팹에서 인스턴스화됨 (Resources 로드)");
                }
            }
            catch (System.Exception e)
            {
                if (debugMode)
                {
                    Debug.LogWarning($"프리팹 인스턴스화 실패: {e.Message}");
                }
                CreateGameStateManagerFromScratch();
            }
        }
        else
        {
            // 프리팹이 없으면 새로 생성
            CreateGameStateManagerFromScratch();
        }
    }
    
    void CreateGameStateManagerFromScratch()
    {
        // 빈 GameObject에 GameStateManager 컴포넌트 추가
        GameObject gameStateManagerObj = new GameObject("GameStateManager");
        gameStateManagerObj.AddComponent<GameStateManager>();
        
        // DontDestroyOnLoad 설정 (GameStateManager가 씬 전환 시에도 유지되도록)
        DontDestroyOnLoad(gameStateManagerObj);
        
        if (debugMode)
        {
            Debug.Log("GameStateManager 컴포넌트를 새 GameObject에 추가함");
        }
    }
    
        void SendUnityLoadedSignal()
    {
        // Unity 로딩 완료 신호를 JavaScript로 전송
        if (Application.platform == RuntimePlatform.WebGLPlayer)
        {
            try
            {
                // unity-loaded 신호 전송
                if (SocketManager.Instance != null)
                {
                    SocketManager.Instance.SendMessageToWeb("unity-loaded", "");
                }
                if (debugMode)
                {
                    Debug.Log("Unity 로딩 완료 신호 전송");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"JavaScript 메시지 전송 실패: {e.Message}");
                // 실패해도 계속 진행
            }
        }
    }
    
    void LoadInitialScene()
    {
        // 역할 정보가 설정되면 씬 로드
        LoadSceneBasedOnRole();
        
        // 초기화 완료 플래그 설정
        isInitialized = true;
    }
    
    IEnumerator SendReadySignalDelayed()
    {
        yield return new WaitForSeconds(1f);
        
        if (Application.platform == RuntimePlatform.WebGLPlayer)
        {
            try
            {
                if (SocketManager.Instance != null)
                {
                    SocketManager.Instance.SendMessageToWeb("unity-ready", "");
                }
                if (debugMode)
                {
                    Debug.Log("Unity 준비 완료 신호 전송 (지연)");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"지연된 JavaScript 메시지 전송 실패: {e.Message}");
            }
        }
    }
    
    void LoadSceneBasedOnRole()
    {
        if (SocketManager.Instance != null)
        {
            string role = SocketManager.Instance.CurrentRole;
            
            if (debugMode)
            {
                Debug.Log($"=== 씬 로드 결정 ===");
                Debug.Log($"SocketManager.Instance.CurrentRole: '{role}'");
                Debug.Log($"SocketManager.Instance.IsTeacher(): {SocketManager.Instance.IsTeacher()}");
                Debug.Log($"roleReceived 플래그: {roleReceived}");
            }
            
            if (role == "teacher")
            {
                if (debugMode)
                {
                    Debug.Log("선생님 역할 감지 - TeacherLobbyScene으로 이동");
                }
                // 현재 씬이 동일하면 재로드하지 않음
                if (SceneManager.GetActiveScene().name != "TeacherLobbyScene")
                {
                    SceneManager.LoadScene("TeacherLobbyScene");
                }
            }
            else
            {
                if (debugMode)
                {
                    Debug.Log("학생 역할 감지 - StudentLobbyScene으로 이동");
                }
                if (SceneManager.GetActiveScene().name != "StudentLobbyScene")
                {
                    SceneManager.LoadScene("StudentLobbyScene");
                }
            }
        }
        else
        {
            // 기본적으로 학생 로비로 이동
            if (debugMode)
            {
                Debug.Log("SocketManager 정보 없음, 기본적으로 StudentLobbyScene으로 이동");
            }
            if (SceneManager.GetActiveScene().name != "StudentLobbyScene")
            {
                SceneManager.LoadScene("StudentLobbyScene");
            }
        }
    }
    
    // 재발 방지책: 씬 전환 완료 후 JavaScript 함수 재등록 알림
    IEnumerator NotifySceneTransitionCompleteDelayed()
    {
        // 재발방지책 #30: 호출 타이밍 지연 시스템
        yield return null;  // 한 프레임 대기
        yield return new WaitForSeconds(0.1f);  // 0.1초 추가 대기
        
        // 재발 방지책 #17: 씬 전환 완료 대기 시간 증가 (2초 → 5초)
        yield return new WaitForSeconds(5f);
        
        // 재발방지책 #12: 씬 전환 완료 감지 시스템 실패 방지
        if (this == null || !this.gameObject || !this.gameObject.activeInHierarchy)
        {
            Debug.LogWarning("BootLoader가 null이거나 비활성화됨 - 씬 전환 완료 알림 건너뜀");
            yield break;
        }
        
        // 재발방지책 #16: 씬 전환 중 null 참조 방지
        if (BootLoader.Instance == null)
        {
            Debug.LogWarning("BootLoader.Instance가 null임 - 씬 전환 완료 알림 건너뜀");
            yield break;
        }
        
        if (debugMode)
        {
            Debug.Log("씬 전환 완료 - JavaScript 함수 재등록 알림 전송 (5초 대기 후)");
        }
        
        // JavaScript에 씬 전환 완료 알림 (안전한 래퍼 함수 사용)
        NotifySceneTransitionComplete();

        // 디바운스 상태 갱신
        lastNotifiedScene = currentSceneName;
        notifyInFlight = false;
        notifyCoroutine = null;
    }
    
    // 재발 방지책: 씬 전환 완료 이벤트 처리
    public void OnSceneTransitionComplete()
    {
        if (debugMode)
        {
            Debug.Log("씬 전환 완료 이벤트 수신 - JavaScript 함수 재등록 완료");
        }
        
        // 씬 전환 완료 후 추가 작업이 필요한 경우 여기에 구현
    }
    
    // 재발 방지책: 씬 전환 완료 감지 (SceneManager.sceneLoaded 이벤트)
    void OnSceneLoaded(Scene scene, LoadSceneMode mode)
    {
        if (debugMode)
        {
            Debug.Log($"씬 로드 완료 감지: {scene.name}, 모드: {mode}");
        }
        
        // 현재 씬 이름 갱신 (디바운스에 사용)
        currentSceneName = scene.name;

        // 재발방지책 #19: 씬 전환 완료 감지 시스템 개선
        isTransitioning = false;
        
        // 재발방지책 #12: 씬 전환 완료 감지 시스템 실패 방지 (강화된 버전)
        if (this == null)
        {
            Debug.LogWarning("BootLoader this가 null임 - 씬 전환 완료 처리 건너뜀");
            return;
        }
        
        if (!this.gameObject)
        {
            Debug.LogWarning("BootLoader gameObject가 null임 - 씬 전환 완료 처리 건너뜀");
            return;
        }
        
        if (!this.gameObject.activeInHierarchy)
        {
            Debug.LogWarning("BootLoader가 비활성화됨 - 씬 전환 완료 처리 건너뜀");
            return;
        }
        
        // 재발방지책 #16: 씬 전환 중 null 참조 방지 (강화된 버전)
        if (BootLoader.Instance == null)
        {
            Debug.LogWarning("BootLoader.Instance가 null임 - 씬 전환 완료 처리 건너뜀");
            return;
        }
        
        if (BootLoader.Instance != this)
        {
            Debug.LogWarning("BootLoader.Instance가 현재 인스턴스와 다름 - 씬 전환 완료 처리 건너뜀");
            return;
        }
        
        // 안전한 초기화
        StartCoroutine(SafeInitializeAfterSceneLoad());
    }
    
    // 재발방지책 #19: 안전한 초기화 메서드
    private IEnumerator SafeInitializeAfterSceneLoad()
    {
        yield return new WaitForSeconds(1.0f);
        
        if (!isTransitioning)
        {
            // 씬 전환이 완전히 완료된 후 처리 (디바운스/중복 방지)
            if (notifyCoroutine != null)
            {
                StopCoroutine(notifyCoroutine);
                notifyCoroutine = null;
            }
            if (!notifyInFlight && (lastNotifiedScene == null || lastNotifiedScene != currentSceneName))
            {
                notifyInFlight = true;
                notifyCoroutine = StartCoroutine(NotifySceneTransitionCompleteDelayed());
            }
        }
    }
    
    // 재발 방지책: 씬 전환 완료 감지 (SceneManager.sceneUnloaded 이벤트)
    void OnSceneUnloaded(Scene scene)
    {
        if (debugMode)
        {
            Debug.Log($"씬 언로드 감지: {scene.name}");
        }

        // 재발방지책 #56: 씬 언로드 시 무한루프 방지
        // 씬 언로드 시 초기화 상태를 초기화하여 다시 시작할 수 있도록
        // 하지만 이미 초기화가 완료된 경우에는 재초기화하지 않음
        if (!isInitialized)
        {
            isTransitioning = false;
            
            // 역할 정보가 설정되지 않은 경우에만 재초기화
            if (!roleReceived)
            {
                if (debugMode)
                {
                    Debug.Log("역할 정보가 설정되지 않아 초기화 재시작");
                }
                StartCoroutine(InitializeSystem());
            }
            else
            {
                if (debugMode)
                {
                    Debug.Log("역할 정보가 이미 설정되어 재초기화 건너뜀");
                }
            }
        }
        else
        {
            if (debugMode)
            {
                Debug.Log("이미 초기화 완료되어 재초기화 건너뜀");
            }
        }

        // 디바운스 상태 정리
        notifyInFlight = false;
        if (notifyCoroutine != null)
        {
            StopCoroutine(notifyCoroutine);
            notifyCoroutine = null;
        }
    }
    
    // 재발방지책 #69: WebGL에서 JavaScript로 메시지 전송 (근본적 해결)
    // 재발방지책 #69: WebGL에서 JavaScript 함수 호출 (근본적 해결)
    [System.Runtime.InteropServices.DllImport("__Internal")]
    private static extern void InitPostMessageListenerInternal(IntPtr empty);
    
    // 재발방지책 #69: 씬 전환 완료 감지 (근본적 해결)
    [System.Runtime.InteropServices.DllImport("__Internal")]
    private static extern void NotifySceneTransitionCompleteInternal(IntPtr empty);
    
    // 재발방지책 #69: 강제 JavaScript 함수 재등록 (근본적 해결)
    
    
    // 재발방지책 #69: 메모리 관리 함수들 (근본적 해결)
    // C-string 메모리는 C# 측에서 직접 관리
    
    // 재발방지책 #70: 안전한 래퍼 함수들 (빈 문자열 처리 개선)
    
    
    public void InitPostMessageListener()
    {
        if (Application.platform != RuntimePlatform.WebGLPlayer)
        {
            Debug.LogWarning("WebGL이 아닌 플랫폼에서 InitPostMessageListener 호출됨");
            return;
        }
        
        Debug.Log("InitPostMessageListener 호출");
        
        IntPtr emptyPtr = CStringAllocator.StringToIntPtr("");
        try
        {
            InitPostMessageListenerInternal(emptyPtr);
        }
        catch (System.Exception e)
        {
            Debug.LogError($"InitPostMessageListener 오류: {e.Message}");
        }
        finally
        {
            CStringAllocator.FreeIntPtr(emptyPtr);
        }
    }
    
    public void NotifySceneTransitionComplete()
    {
        if (Application.platform != RuntimePlatform.WebGLPlayer)
        {
            Debug.LogWarning("WebGL이 아닌 플랫폼에서 NotifySceneTransitionComplete 호출됨");
            return;
        }
        
        Debug.Log("NotifySceneTransitionComplete 호출");
        
        IntPtr emptyPtr = CStringAllocator.StringToIntPtr("");
        try
        {
            NotifySceneTransitionCompleteInternal(emptyPtr);
        }
        catch (System.Exception e)
        {
            Debug.LogError($"NotifySceneTransitionComplete 오류: {e.Message}");
        }
        finally
        {
            CStringAllocator.FreeIntPtr(emptyPtr);
        }
    }
    
    
    
    // 에디터 모드에서 웹 메시지 시뮬레이션
    IEnumerator SimulateWebMessages()
    {
        yield return new WaitForSeconds(2f);
        
        if (debugMode)
        {
            Debug.Log("에디터 모드: 시뮬레이션 메시지 전송");
        }
        
        // 테스트용 초기화 메시지 시뮬레이션 (선생님 모드)
        string testMessage = "{\"type\":\"init\",\"data\":\"{\\\"role\\\":\\\"teacher\\\",\\\"code\\\":\\\"TEST456\\\",\\\"nickname\\\":\\\"테스트선생님\\\"}\"}";
        
        if (SocketManager.Instance != null)
        {
            SocketManager.Instance.OnBrowserMessage(testMessage);
        }
    }
    
    // 디버그용 메서드
    [ContextMenu("테스트 - 학생 모드로 초기화")]
    void TestStudentMode()
    {
        if (SocketManager.Instance != null)
        {
            // 테스트용 학생 데이터 설정
            var testData = new Dictionary<string, string>
            {
                ["role"] = "student",
                ["code"] = "TEST123",
                ["nickname"] = "테스트학생"
            };
            
            string jsonData = JsonUtility.ToJson(testData);
            SocketManager.Instance.OnBrowserMessage("{\"type\":\"init\",\"data\":\"" + jsonData + "\"}");
        }
    }
    
    [ContextMenu("테스트 - 선생님 모드로 초기화")]
    void TestTeacherMode()
    {
        if (SocketManager.Instance != null)
        {
            // 테스트용 선생님 데이터 설정
            var testData = new Dictionary<string, string>
            {
                ["role"] = "teacher",
                ["code"] = "TEST456",
                ["nickname"] = "테스트선생님"
            };
            
            string jsonData = JsonUtility.ToJson(testData);
            SocketManager.Instance.OnBrowserMessage("{\"type\":\"init\",\"data\":\"" + jsonData + "\"}");
        }
    }
    
    [ContextMenu("테스트 - 씬 이동")]
    void TestSceneLoad()
    {
        LoadInitialScene();
    }
} 