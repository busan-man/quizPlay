using UnityEngine;
using UnityEngine.SceneManagement;
using System.Collections;

[DefaultExecutionOrder(-10000)]
public class SceneTransitionManager : MonoBehaviour
{
    public static SceneTransitionManager Instance { get; private set; }
    
    [Header("Debug Settings")]
    public bool debugMode = true;
    
    private bool isTransitioning = false;
    private string lastLoadedScene = "";
    private int transitionCount = 0;
    private const int MAX_TRANSITIONS = 5; // 최대 전환 횟수 제한
    
    // Unity 시작 시 자동으로 실행
    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
    static void OnRuntimeMethodLoad()
    {
        if (Instance == null)
        {
            GameObject obj = new GameObject("SceneTransitionManager");
            Instance = obj.AddComponent<SceneTransitionManager>();
            DontDestroyOnLoad(obj);
        }
    }
    
    void Awake()
    {
        // Singleton pattern
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
            
            if (debugMode)
                Debug.Log("[SceneTransitionManager] 초기화됨");
        }
        else if (Instance != this)
        {
            if (debugMode)
                Debug.Log("[SceneTransitionManager] 중복 인스턴스 제거됨");
            Destroy(gameObject);
            return;
        }
        
        // 씬 전환 이벤트 구독
        SceneManager.sceneUnloaded += OnSceneUnloaded;
        SceneManager.sceneLoaded += OnSceneLoaded;
    }
    
    void OnDestroy()
    {
        // 이벤트 구독 해제
        SceneManager.sceneUnloaded -= OnSceneUnloaded;
        SceneManager.sceneLoaded -= OnSceneLoaded;
    }
    
    // 재발방지책 #57: 콘솔 로그 반복 출력 방지
    // 같은 씬이 반복 언로드되는 경우 로그 출력 제한
    private static string lastUnloadedScene = "";
    private static int unloadCount = 0;
    private static float lastUnloadTime = 0f;
    
    private void OnSceneUnloaded(Scene scene)
    {
        
        float currentTime = Time.time;
        
        if (scene.name == lastUnloadedScene && currentTime - lastUnloadTime < 1f)
        {
            unloadCount++;
            // 3번째부터는 로그 출력 제한
            if (unloadCount <= 2)
            {
                if (debugMode)
                {
                    Debug.Log($"[SceneTransitionManager] 씬 언로드: {scene.name} (반복 {unloadCount}회)");
                }
            }
            else if (unloadCount == 3)
            {
                Debug.LogWarning($"[SceneTransitionManager] 씬 언로드 반복 감지: {scene.name} - 이후 로그 출력 중단");
            }
        }
        else
        {
            unloadCount = 1;
            if (debugMode)
            {
                Debug.Log($"[SceneTransitionManager] 씬 언로드: {scene.name}");
            }
        }
        
        lastUnloadedScene = scene.name;
        lastUnloadTime = currentTime;
        
        // 무한루프 감지
        if (scene.name == lastLoadedScene)
        {
            transitionCount++;
            if (transitionCount <= 2)
            {
                if (debugMode)
                {
                    Debug.LogWarning($"[SceneTransitionManager] 같은 씬 재로드 감지: {scene.name} (횟수: {transitionCount})");
                }
            }
            // 무한루프 감지 (통합된 로직)
            else if (transitionCount >= MAX_TRANSITIONS)
            {
                Debug.LogError($"[SceneTransitionManager] 무한루프 감지! 씬 전환을 중단합니다: {scene.name} (횟수: {transitionCount})");
                StopAllCoroutines();
                isTransitioning = false;
                transitionCount = 0;
                return; // 무한루프 감지 시에만 return
            }
        }
        else
        {
            transitionCount = 0; // 다른 씬으로 전환 시 카운트 리셋
        }
    }
    
    private void OnSceneLoaded(Scene scene, LoadSceneMode mode)
    {
        if (debugMode)
        {
            Debug.Log($"[SceneTransitionManager] 씬 로드 완료: {scene.name}, 모드: {mode}");
        }
        
        lastLoadedScene = scene.name;
        isTransitioning = false;
        
        // 씬 로드 후 안정화 대기
        StartCoroutine(StabilizeAfterSceneLoad());
    }
    
    private IEnumerator StabilizeAfterSceneLoad()
    {
        yield return new WaitForSeconds(0.1f);
        
        // 싱글톤 객체들 상태 확인
        CheckSingletonStatus();
        
        if (debugMode)
        {
            Debug.Log($"[SceneTransitionManager] 씬 안정화 완료: {lastLoadedScene}");
        }
    }
    
               private void CheckSingletonStatus()
           {
               // 핵심 싱글톤 객체들 상태 확인
               var webComm = WebCommunicationController.Instance;
               var gameState = GameStateManager.Instance;
               var socketManager = FindFirstObjectByType<SocketManager>();
               var koreanFont = KoreanFontSetup.Instance;
               
               if (debugMode)
               {
                   Debug.Log($"[SceneTransitionManager] 싱글톤 상태 - WebComm: {webComm != null}, GameState: {gameState != null}, SocketManager: {socketManager != null}, KoreanFont: {koreanFont != null}");
               }
               
               // WebGL에서는 싱글톤 재생성이 위험하므로 경고만 출력
               if (Application.platform == RuntimePlatform.WebGLPlayer)
               {
                   if (webComm == null)
                       Debug.LogWarning("[SceneTransitionManager] WebGL - WebCommunicationController 누락 감지 (재생성 안함)");
                   if (gameState == null)
                       Debug.LogWarning("[SceneTransitionManager] WebGL - GameStateManager 누락 감지 (재생성 안함)");
                   if (socketManager == null)
                       Debug.LogWarning("[SceneTransitionManager] WebGL - SocketManager 누락 감지 (재생성 안함)");
                   if (koreanFont == null)
                       Debug.LogWarning("[SceneTransitionManager] WebGL - KoreanFontSetup 누락 감지 (재생성 안함)");
               }
               else
               {
                   // 에디터나 다른 플랫폼에서는 재생성 허용
                   if (webComm == null)
                   {
                       Debug.LogWarning("[SceneTransitionManager] WebCommunicationController 누락, 재생성 시도");
                       CreateSingleton<WebCommunicationController>("WebCommunicationController");
                   }
                   
                   if (gameState == null)
                   {
                       Debug.LogWarning("[SceneTransitionManager] GameStateManager 누락, 재생성 시도");
                       CreateSingleton<GameStateManager>("GameStateManager");
                   }
                   
                   if (socketManager == null)
                   {
                       Debug.LogWarning("[SceneTransitionManager] SocketManager 누락, 재생성 시도");
                       CreateSingleton<SocketManager>("SocketManager");
                   }
                   
                   if (koreanFont == null)
                   {
                       Debug.LogWarning("[SceneTransitionManager] KoreanFontSetup 누락, 재생성 시도");
                       CreateSingleton<KoreanFontSetup>("KoreanFontSetup");
                   }
               }
               
               // 한글 폰트 적용
               if (koreanFont != null)
               {
                   koreanFont.OnSceneLoaded();
               }
           }
    
    private void CreateSingleton<T>(string name) where T : MonoBehaviour
    {
        try
        {
            GameObject obj = new GameObject(name);
            T component = obj.AddComponent<T>();
            DontDestroyOnLoad(obj);
            
            if (debugMode)
            {
                Debug.Log($"[SceneTransitionManager] {name} 재생성 완료");
            }
        }
        catch (System.Exception e)
        {
            Debug.LogError($"[SceneTransitionManager] {name} 재생성 실패: {e.Message}");
        }
    }
    
    // 안전한 씬 전환 메서드
    public void SafeLoadScene(string sceneName)
    {
        if (isTransitioning)
        {
            if (debugMode)
            {
                Debug.LogWarning($"[SceneTransitionManager] 이미 전환 중이므로 {sceneName} 로드 무시");
            }
            return;
        }
        
        isTransitioning = true;
        transitionCount = 0;
        
        if (debugMode)
        {
            Debug.Log($"[SceneTransitionManager] 안전한 씬 전환 시작: {sceneName}");
        }
        
        SceneManager.LoadScene(sceneName);
    }
    
    // 역할별 씬 전환 메서드
    public void LoadSceneByRole(string role)
    {
        string targetScene = "";
        
        switch (role?.ToLower())
        {
            case "teacher":
                targetScene = "TeacherGameScene"; // 선생님 전용 게임 씬
                Debug.Log($"[SceneTransitionManager] 선생님 역할 - TeacherGameScene으로 이동");
                break;
            case "student":
                targetScene = "GameScene";
                Debug.Log($"[SceneTransitionManager] 학생 역할 - GameScene으로 이동");
                break;
            default:
                Debug.LogWarning($"[SceneTransitionManager] 알 수 없는 역할: {role}");
                return;
        }
        
        string currentScene = SceneManager.GetActiveScene().name;
        
        // 이미 올바른 씬에 있는지 확인
        if (currentScene == targetScene)
        {
            Debug.Log($"[SceneTransitionManager] 이미 {targetScene}에 있음, 전환 생략");
            return;
        }
        
        // 무한루프 방지
        if (transitionCount >= MAX_TRANSITIONS && lastLoadedScene == targetScene)
        {
            Debug.LogWarning($"[SceneTransitionManager] 무한루프 감지! 씬 전환을 중단합니다: {targetScene}");
            return;
        }
        
        SafeLoadScene(targetScene);
    }
    
    // 전환 상태 확인
    public bool IsTransitioning()
    {
        return isTransitioning;
    }
    
    // 전환 카운트 리셋
    public void ResetTransitionCount()
    {
        transitionCount = 0;
        if (debugMode)
        {
            Debug.Log("[SceneTransitionManager] 전환 카운트 리셋됨");
        }
    }
} 