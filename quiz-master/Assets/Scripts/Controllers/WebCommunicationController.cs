using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

public class WebCommunicationController : MonoBehaviour
{
    public static WebCommunicationController Instance { get; private set; }
    
    [Header("Game References")]
    public QuestionController questionController;
    public GameStateManager gameStateManager;
    
    [Header("Communication Settings")]
    public bool debugMode = true;
    
    private GameStartData currentGameData;
    private bool isGameStarted = false;
    private bool isTeacher = false;
    private List<QuestionData> currentQuestions = new List<QuestionData>();
    private List<AnswerSubmission> playerAnswers = new List<AnswerSubmission>();
    private float gameStartTime;
    private int currentQuestionIndex = 0;
    
    // Events
    public static event Action<GameStartData> OnGameStart;
    public static event Action<QuestionData> OnQuestionReceived;
    public static event Action<Dictionary<string, int>> OnScoreUpdate;
    public static event Action OnGameEnd;
    
    void Awake()
    {
        // 더 강력한 싱글톤 체크 (씬 전환 시 중복 방지)
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
            
            if (debugMode)
            {
                Debug.Log("WebCommunicationController 싱글톤 초기화됨");
            }
        }
        else if (Instance != this)
        {
            if (debugMode)
            {
                Debug.Log("WebCommunicationController 중복 인스턴스 제거됨");
            }
            Destroy(gameObject);
            return; // 중복 인스턴스는 여기서 종료
        }
        
        // 씬 전환 이벤트 구독
        UnityEngine.SceneManagement.SceneManager.sceneUnloaded += OnSceneUnloaded;
        UnityEngine.SceneManagement.SceneManager.sceneLoaded += OnSceneLoaded;
    }
    
    void OnDestroy()
    {
        // 이벤트 구독 해제
        UnityEngine.SceneManagement.SceneManager.sceneUnloaded -= OnSceneUnloaded;
        UnityEngine.SceneManagement.SceneManager.sceneLoaded -= OnSceneLoaded;
    }
    
    private void OnSceneUnloaded(UnityEngine.SceneManagement.Scene scene)
    {
        if (debugMode)
        {
            Debug.Log($"씬 언로드 감지: {scene.name}");
        }
        
        // 씬 언로드 시 게임 상태 리셋 방지 (DontDestroyOnLoad로 유지)
        // isGameStarted는 유지하여 무한루프 방지
    }
    
    private void OnSceneLoaded(UnityEngine.SceneManagement.Scene scene, UnityEngine.SceneManagement.LoadSceneMode mode)
    {
        if (debugMode)
        {
            Debug.Log($"씬 로드 완료 감지: {scene.name}, 모드: {mode}");
        }
        
        // 씬 로드 후 필요한 참조 재설정
        StartCoroutine(ReconnectReferencesAfterSceneLoad());
    }
    
    private IEnumerator ReconnectReferencesAfterSceneLoad()
    {
        yield return new WaitForEndOfFrame();
        
        // 참조 재설정
        if (questionController == null)
        {
            questionController = FindFirstObjectByType<QuestionController>();
        }
        
        if (gameStateManager == null)
        {
            gameStateManager = FindFirstObjectByType<GameStateManager>();
        }
        
        if (debugMode)
        {
            Debug.Log($"참조 재설정 완료 - QuestionController: {questionController != null}, GameStateManager: {gameStateManager != null}");
        }
    }
    

    
    void Start()
    {
        // 웹에서 메시지를 받기 위한 리스너 등록
        StartCoroutine(CheckForWebMessages());
        
        if (debugMode)
        {
            Debug.Log("WebCommunicationController 초기화됨");
        }
    }
    
    void Update()
    {
        // ESC 키로 게임 종료 (디버그용)
        if (Input.GetKeyDown(KeyCode.Escape))
        {
            SendMessageToWeb("gameExit", "");
        }
    }
    
    // 웹에서 메시지 수신을 위한 코루틴
    IEnumerator CheckForWebMessages()
    {
        while (true)
        {
            // 웹에서 전송된 메시지가 있는지 확인
            if (Application.platform == RuntimePlatform.WebGLPlayer)
            {
                // WebGL에서는 외부 JavaScript 함수를 통해 메시지를 받음
                // 이 부분은 JavaScript 브리지와 연동되어야 함
            }
            
            yield return new WaitForSeconds(0.1f);
        }
    }
    
    // 웹에서 Unity로 메시지를 받는 메서드 (JavaScript에서 호출)
    public void ReceiveMessageFromWeb(string messageJson)
    {
        try
        {
            WebMessage message = JsonUtility.FromJson<WebMessage>(messageJson);
            
            if (debugMode)
            {
                Debug.Log($"웹에서 메시지 수신: {message.type}");
            }
            
            switch (message.type)
            {
                case "init":
                    HandleInit(message.data);
                    break;
                case "gameStart":
                    HandleGameStart(message.data);
                    break;
                case "questionUpdate":
                    HandleQuestionUpdate(message.data);
                    break;
                case "scoreUpdate":
                    HandleScoreUpdate(message.data);
                    break;
                case "gameEnd":
                    HandleGameEnd(message.data);
                    break;
                case "nextQuestion":
                    HandleNextQuestion();
                    break;
                default:
                    Debug.LogWarning($"알 수 없는 메시지 타입: {message.type}");
                    break;
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"메시지 처리 오류: {e.Message}");
        }
    }
    
    // 초기화 처리
    private void HandleInit(string data)
    {
        try
        {
            Debug.Log($"HandleInit 호출됨 - 데이터: {data}");
            
            InitData initData = JsonUtility.FromJson<InitData>(data);
            
            if (debugMode)
            {
                Debug.Log($"Unity 초기화: 역할={initData.role}, 코드={initData.code}, 닉네임={initData.nickname}");
            }
            
            // 씬 전환 매니저 상태 확인
            if (SceneTransitionManager.Instance != null && SceneTransitionManager.Instance.IsTransitioning())
            {
                if (debugMode)
                {
                    Debug.LogWarning("씬 전환 중이므로 초기화 처리 지연");
                }
                StartCoroutine(DelayedHandleInit(initData));
                return;
            }
            
            // SocketManager에 역할 정보 설정 (재발방지책 #52 해결)
            if (SocketManager.Instance != null)
            {
                // 역할 정보 설정 전 상태 확인
                if (debugMode)
                {
                    Debug.Log($"SocketManager 역할 설정 전 - 현재 역할: '{SocketManager.Instance.CurrentRole}'");
                }
                
                SocketManager.Instance.CurrentRole = initData.role;
                SocketManager.Instance.CurrentCode = initData.code;
                SocketManager.Instance.CurrentNickname = initData.nickname;
                
                // 역할 정보 설정 후 상태 확인
                if (debugMode)
                {
                    Debug.Log($"SocketManager 역할 설정 완료: {initData.role}");
                    Debug.Log($"SocketManager 역할 설정 후 확인: '{SocketManager.Instance.CurrentRole}'");
                }
                
                // BootLoader에 역할 설정 알림
                if (BootLoader.Instance != null)
                {
                    BootLoader.Instance.SetRoleReceived(true);
                    BootLoader.Instance.OnRoleSet();
                    if (debugMode)
                    {
                        Debug.Log($"BootLoader에 역할 설정 알림 전송됨 - 역할: {initData.role}");
                    }
                }
                else
                {
                    Debug.LogError("BootLoader.Instance가 null입니다!");
                }
            }
            else
            {
                Debug.LogError("SocketManager.Instance가 null입니다! SocketManager 초기화를 확인하세요.");
                
                // SocketManager가 null인 경우 재시도 로직
                StartCoroutine(RetrySocketManagerInitialization(initData));
                return;
            }
            
            // 게임 상태 매니저에 초기화 데이터 전달
            if (gameStateManager != null)
            {
                gameStateManager.InitializeGame(initData);
            }
            
            // 초기화 완료 신호를 웹으로 전송 (지연 처리)
            StartCoroutine(SendInitCompleteDelayed());
            
            Debug.Log("Unity 초기화 처리 완료");
        }
        catch (Exception e)
        {
            Debug.LogError($"초기화 처리 오류: {e.Message}");
        }
    }
    
    // 씬 전환 중일 때 지연된 초기화 처리
    private IEnumerator DelayedHandleInit(InitData initData)
    {
        // 씬 전환이 완료될 때까지 대기
        while (SceneTransitionManager.Instance != null && SceneTransitionManager.Instance.IsTransitioning())
        {
            yield return new WaitForSeconds(0.1f);
        }
        
        if (debugMode)
        {
            Debug.Log("씬 전환 완료, 초기화 처리 재시도");
        }
        
        // SocketManager에 역할 정보 설정 (재발방지책 #52 해결)
        if (SocketManager.Instance != null)
        {
            // 역할 정보 설정 전 상태 확인
            if (debugMode)
            {
                Debug.Log($"DelayedHandleInit - SocketManager 역할 설정 전 - 현재 역할: '{SocketManager.Instance.CurrentRole}'");
            }
            
            SocketManager.Instance.CurrentRole = initData.role;
            SocketManager.Instance.CurrentCode = initData.code;
            SocketManager.Instance.CurrentNickname = initData.nickname;
            
            // 역할 정보 설정 후 상태 확인
            if (debugMode)
            {
                Debug.Log($"DelayedHandleInit - SocketManager 역할 설정 완료: {initData.role}");
                Debug.Log($"DelayedHandleInit - SocketManager 역할 설정 후 확인: '{SocketManager.Instance.CurrentRole}'");
            }
            
            // BootLoader에 역할 설정 알림
            if (BootLoader.Instance != null)
            {
                BootLoader.Instance.SetRoleReceived(true);
                BootLoader.Instance.OnRoleSet();
                if (debugMode)
                {
                    Debug.Log($"DelayedHandleInit - BootLoader에 역할 설정 알림 전송됨 - 역할: {initData.role}");
                }
            }
            else
            {
                Debug.LogError("DelayedHandleInit - BootLoader.Instance가 null입니다!");
            }
        }
        else
        {
            Debug.LogError("DelayedHandleInit - SocketManager.Instance가 null입니다! SocketManager 초기화를 확인하세요.");
            
            // SocketManager가 null인 경우 재시도 로직
            StartCoroutine(RetrySocketManagerInitialization(initData));
        }
        
        // 게임 상태 매니저에 초기화 데이터 전달
        if (gameStateManager != null)
        {
            gameStateManager.InitializeGame(initData);
        }
        
        // 초기화 완료 신호를 웹으로 전송 (지연 처리)
        StartCoroutine(SendInitCompleteDelayed());
        
        if (debugMode)
        {
            Debug.Log("DelayedHandleInit - Unity 초기화 처리 완료");
        }
    }
    
    // SocketManager가 null인 경우 재시도하는 코루틴
    private IEnumerator RetrySocketManagerInitialization(InitData initData)
    {
        float retryTime = 0f;
        float maxRetryTime = 10f; // 최대 10초 재시도
        
        while (SocketManager.Instance == null && retryTime < maxRetryTime)
        {
            retryTime += 0.1f;
            yield return new WaitForSeconds(0.1f);
            
            if (debugMode && retryTime % 1f < 0.1f)
            {
                Debug.Log($"SocketManager 재시도 중... ({retryTime:F1}초 경과)");
            }
        }
        
        if (SocketManager.Instance != null)
        {
            if (debugMode)
            {
                Debug.Log("SocketManager 재시도 성공, 역할 정보 설정 재시도");
            }
            
            // SocketManager가 준비되었으므로 역할 정보 설정
            SocketManager.Instance.CurrentRole = initData.role;
            SocketManager.Instance.CurrentCode = initData.code;
            SocketManager.Instance.CurrentNickname = initData.nickname;
            
            if (debugMode)
            {
                Debug.Log($"SocketManager 역할 설정 완료 (재시도): {initData.role}");
            }
            
            // BootLoader에 역할 설정 알림
            if (BootLoader.Instance != null)
            {
                BootLoader.Instance.SetRoleReceived(true);
                BootLoader.Instance.OnRoleSet();
                if (debugMode)
                {
                    Debug.Log($"BootLoader에 역할 설정 알림 전송됨 (재시도) - 역할: {initData.role}");
                }
            }
        }
        else
        {
            Debug.LogError($"SocketManager 초기화 실패 ({maxRetryTime}초 경과)");
        }
    }
    
    // 초기화 완료 신호 지연 전송 (무한루프 방지)
    private IEnumerator SendInitCompleteDelayed()
    {
        yield return new WaitForSeconds(0.5f); // 0.5초 지연
        
        Debug.Log("init-complete 메시지 전송");
        SendMessageToWeb("init-complete", "");
        
        // 초기화 완료 상태 설정 (무한루프 방지)
        isGameStarted = false; // 초기화 완료 후 게임 시작 대기 상태로 설정
    }
    
    // 게임 시작 처리
    private void HandleGameStart(string data)
    {
        try
        {
            currentGameData = JsonUtility.FromJson<GameStartData>(data);
            isGameStarted = true;
            isTeacher = currentGameData.isTeacher;
            gameStartTime = Time.time;
            currentQuestionIndex = 0;
            playerAnswers.Clear();
            
            // SocketManager의 CurrentRole도 업데이트 (BootLoader 대기 해제용)
            if (SocketManager.Instance != null)
            {
                SocketManager.Instance.SetDefaultRole(currentGameData.isTeacher ? "teacher" : "student");
            }
            
            if (debugMode)
            {
                Debug.Log($"게임 시작: {currentGameData.gameCode}, 플레이어: {currentGameData.playerName}, 역할: {(currentGameData.isTeacher ? "teacher" : "student")}");
            }
            
            // 게임 시작 이벤트 발생
            OnGameStart?.Invoke(currentGameData);
            
            // 게임 상태 매니저에 게임 시작 알림
            if (gameStateManager != null)
            {
                gameStateManager.StartGame(currentGameData);
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"게임 시작 처리 오류: {e.Message}");
        }
    }
    
    // 질문 업데이트 처리
    private void HandleQuestionUpdate(string data)
    {
        try
        {
            QuestionData questionData = JsonUtility.FromJson<QuestionData>(data);
            currentQuestions.Add(questionData);
            
            if (debugMode)
            {
                Debug.Log($"질문 수신: {questionData.question}");
            }
            
            // 질문 컨트롤러에 질문 전달
            if (questionController != null)
            {
                questionController.SetQuestion(questionData);
            }
            
            // 질문 수신 이벤트 발생
            OnQuestionReceived?.Invoke(questionData);
        }
        catch (Exception e)
        {
            Debug.LogError($"질문 업데이트 처리 오류: {e.Message}");
        }
    }
    
    // 점수 업데이트 처리
    private void HandleScoreUpdate(string data)
    {
        try
        {
            Dictionary<string, int> scores = JsonHelper.JsonToIntDictionary(data);
            
            if (debugMode)
            {
                Debug.Log($"점수 업데이트: {string.Join(", ", scores.Select(kvp => $"{kvp.Key}:{kvp.Value}"))}");
            }
            
            // 점수 업데이트 이벤트 발생
            OnScoreUpdate?.Invoke(scores);
        }
        catch (Exception e)
        {
            Debug.LogError($"점수 업데이트 처리 오류: {e.Message}");
        }
    }
    
    // 게임 종료 처리
    private void HandleGameEnd(string data)
    {
        try
        {
            isGameStarted = false;
            
            if (debugMode)
            {
                Debug.Log("게임 종료");
            }
            
            // 게임 종료 이벤트 발생
            OnGameEnd?.Invoke();
            
            // 게임 결과 전송
            SendGameResults();
        }
        catch (Exception e)
        {
            Debug.LogError($"게임 종료 처리 오류: {e.Message}");
        }
    }
    
    // 다음 질문 처리
    private void HandleNextQuestion()
    {
        currentQuestionIndex++;
        
        if (debugMode)
        {
            Debug.Log($"다음 질문으로 이동: {currentQuestionIndex}");
        }
        
        // 다음 질문이 있으면 표시
        if (currentQuestionIndex < currentQuestions.Count)
        {
            QuestionData nextQuestion = currentQuestions[currentQuestionIndex];
            if (questionController != null)
            {
                questionController.SetQuestion(nextQuestion);
            }
        }
    }
    
    // 답변 제출
    public void SubmitAnswer(string questionId, string selectedAnswer, bool isCorrect, int points, float timeSpent)
    {
        AnswerSubmission answer = new AnswerSubmission
        {
            questionId = questionId,
            selectedAnswer = selectedAnswer,
            isCorrect = isCorrect,
            points = points,
            timeSpent = timeSpent
        };
        
        playerAnswers.Add(answer);
        
        // 웹으로 답변 제출
        SendMessageToWeb("submitAnswer", JsonUtility.ToJson(answer));
        
        if (debugMode)
        {
            Debug.Log($"답변 제출: {selectedAnswer}, 정답: {isCorrect}, 점수: {points}");
        }
    }
    
    // 게임 완료
    public void CompleteGame()
    {
        if (!isGameStarted) return;
        
        GameResult result = new GameResult
        {
            playerId = currentGameData?.playerName ?? "Unknown",
            playerName = currentGameData?.playerName ?? "Unknown",
            finalScore = CalculateFinalScore(),
            correctAnswers = playerAnswers.FindAll(a => a.isCorrect).Count,
            totalQuestions = playerAnswers.Count,
            totalTime = Time.time - gameStartTime,
            answers = new List<AnswerSubmission>(playerAnswers)
        };
        
        // 웹으로 게임 완료 전송
        SendMessageToWeb("gameComplete", JsonUtility.ToJson(result));
        
        if (debugMode)
        {
            Debug.Log($"게임 완료: 최종 점수 {result.finalScore}");
        }
    }
    
    // 최종 점수 계산
    private int CalculateFinalScore()
    {
        int totalScore = 0;
        foreach (var answer in playerAnswers)
        {
            totalScore += answer.points;
        }
        return totalScore;
    }
    
    // 게임 결과 전송
    private void SendGameResults()
    {
        if (playerAnswers.Count == 0) return;
        
        GameResult result = new GameResult
        {
            playerId = currentGameData?.playerName ?? "Unknown",
            playerName = currentGameData?.playerName ?? "Unknown",
            finalScore = CalculateFinalScore(),
            correctAnswers = playerAnswers.FindAll(a => a.isCorrect).Count,
            totalQuestions = playerAnswers.Count,
            totalTime = Time.time - gameStartTime,
            answers = new List<AnswerSubmission>(playerAnswers)
        };
        
        SendMessageToWeb("gameResults", JsonUtility.ToJson(result));
    }
    
    // 웹으로 메시지 전송: 단일 창구(SocketManager) 위임
    public void SendMessageToWeb(string type, string data)
    {
        if (SocketManager.Instance != null)
        {
            SocketManager.Instance.SendMessageToWeb(type, data);
        }
        else
        {
            Debug.LogWarning("SocketManager.Instance 가 null 입니다. 메시지를 전송할 수 없습니다.");
        }
    }
    
    // JS DllImport 제거: SocketManager를 통해 일원화
    
    // 현재 게임 데이터 반환
    public GameStartData GetCurrentGameData()
    {
        return currentGameData;
    }
    
    // 게임 시작 여부 확인
    public bool IsGameStarted()
    {
        return isGameStarted;
    }
    
    // 선생님 여부 확인
    public bool IsTeacher()
    {
        return isTeacher;
    }
    
    // 현재 질문 인덱스 반환
    public int GetCurrentQuestionIndex()
    {
        return currentQuestionIndex;
    }
    
    // 플레이어 답변 목록 반환
    public List<AnswerSubmission> GetPlayerAnswers()
    {
        return new List<AnswerSubmission>(playerAnswers);
    }
} 