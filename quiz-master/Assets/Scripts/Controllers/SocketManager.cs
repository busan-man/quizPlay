using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

public class SocketManager : MonoBehaviour
{
    public static SocketManager Instance { get; private set; }
    
    [Header("Communication Settings")]
    public bool debugMode = true;
    public string serverUrl = "ws://localhost:8080";
    
    [Header("Game References")]
    public QuestionController questionController;
    public GameStateManager gameStateManager;
    
    // 공개 프로퍼티 (요구사항에 맞춤)
    public string CurrentRole { get; set; }
    public string CurrentCode { get; set; }
    public string CurrentNickname { get; set; }
    
    private GameStartData currentGameData;
    private bool isGameStarted = false;
    private bool isTeacher = false;
    private bool hasPerformedSceneTransition = false; // 씬 전환 중복 방지 플래그
    private List<QuestionData> currentQuestions = new List<QuestionData>();
    private List<AnswerSubmission> playerAnswers = new List<AnswerSubmission>();
    private float gameStartTime;
    private int currentQuestionIndex = 0;

        // 로비 이벤트 큐(씬 로드 전 학생 참가/퇴장 이벤트 유실 방지)
        private readonly List<PlayerJoinedPayload> pendingPlayerJoins = new List<PlayerJoinedPayload>();
        private readonly List<string> pendingPlayerLeaves = new List<string>();
    
    // Events (기존 WebCommunicationController 이벤트들 유지)
    public static event Action<GameStartData> OnGameStart;
    public static event Action<QuestionData> OnQuestionReceived;
    public static event Action<Dictionary<string, int>> OnScoreUpdate;
    public static event Action OnGameEnd;
    
    // Socket.IO 이벤트들
    public static event Action OnStart;
    public static event Action OnQuestion;
    public static event Action OnScoreboard;
    public static event Action OnGameEnded;
    
    void Awake()
    {
        // 더 강력한 싱글톤 체크 (씬 전환 시 중복 방지)
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
            
            if (debugMode)
            {
                Debug.Log("SocketManager 싱글톤 초기화됨");
            }
        }
        else if (Instance != this)
        {
            if (debugMode)
            {
                Debug.Log("SocketManager 중복 인스턴스 제거됨");
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
            Debug.Log($"SocketManager - 씬 언로드 감지: {scene.name}");
        }
        
        // 씬 언로드 시 게임 상태 유지 (DontDestroyOnLoad로 유지)
        // isGameStarted는 유지하여 무한루프 방지
    }
    
    private void OnSceneLoaded(UnityEngine.SceneManagement.Scene scene, UnityEngine.SceneManagement.LoadSceneMode mode)
    {
        if (debugMode)
        {
            Debug.Log($"SocketManager - 씬 로드 완료 감지: {scene.name}, 모드: {mode}");
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
            Debug.Log($"SocketManager - 참조 재설정 완료 - QuestionController: {questionController != null}, GameStateManager: {gameStateManager != null}");
        }

        // TeacherLobby가 로드되었을 수 있으니 로비 큐 플러시 시도 (지연 처리)
        StartCoroutine(DelayedFlushLobbyQueues());
    }

    // 로비 큐 플러시를 지연 처리하여 LobbyManager가 완전히 초기화될 때까지 대기
    private IEnumerator DelayedFlushLobbyQueues()
    {
        // 더 빠른 대기 시간으로 반응성 향상
        for (int attempts = 0; attempts < 15; attempts++)
        {
            yield return new WaitForSeconds(0.2f); // 0.5초 → 0.2초로 단축
            
            // 역할에 따라 적절한 로비 매니저 찾기
            if (CurrentRole == "teacher")
            {
                var teacherLobby = FindFirstObjectByType<TeacherLobbyManager>();
                if (teacherLobby != null && teacherLobby.IsInitialized)
                {
                    Debug.Log($"TeacherLobbyManager 발견됨 및 초기화 완료 (시도 {attempts + 1}/15) - 큐 플러시 실행");
                    TryFlushLobbyQueues();
                    yield break; // 성공하면 종료
                }
                else if (teacherLobby != null && !teacherLobby.IsInitialized)
                {
                    Debug.Log($"TeacherLobbyManager 발견됨 하지만 아직 초기화 중 (시도 {attempts + 1}/15) - 대기 중");
                }
                else if (debugMode && attempts % 5 == 0) // 5번마다 한 번씩만 로그 출력
                {
                    Debug.Log($"TeacherLobbyManager 검색 시도 {attempts + 1}/15 - 아직 찾지 못함");
                }
            }
            else if (CurrentRole == "student")
            {
                var studentLobby = FindFirstObjectByType<StudentLobbyManager>();
                if (studentLobby != null)
                {
                    Debug.Log($"StudentLobbyManager 발견됨 (시도 {attempts + 1}/15) - 큐 플러시 실행");
                    TryFlushLobbyQueues();
                    yield break; // 성공하면 종료
                }
                
                if (debugMode && attempts % 5 == 0) // 5번마다 한 번씩만 로그 출력
                {
                    Debug.Log($"StudentLobbyManager 검색 시도 {attempts + 1}/15 - 아직 찾지 못함");
                }
            }
        }
        
        Debug.LogWarning($"{CurrentRole}LobbyManager를 15번 시도해도 찾지 못함 - 큐 플러시 포기");
    }
    

    
    void Start()
    {
        // 웹에서 메시지를 받기 위한 리스너 등록
        StartCoroutine(CheckForWebMessages());
        
        if (debugMode)
        {
            Debug.Log("SocketManager 초기화됨");
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
    public void OnBrowserMessage(string messageJson)
    {
        Debug.Log($"=== OnBrowserMessage 호출됨 ===");
        Debug.Log($"GameObject 이름: {gameObject.name}");
        Debug.Log($"메시지 JSON: {messageJson}");
        Debug.Log($"메시지 길이: {messageJson?.Length ?? 0}");
        Debug.Log($"현재 시간: {Time.time}");
        Debug.Log($"현재 역할: {CurrentRole}");
        Debug.Log($"현재 게임 코드: {CurrentCode}");
        Debug.Log($"현재 닉네임: {CurrentNickname}");
        
        if (string.IsNullOrEmpty(messageJson))
        {
            Debug.LogError("메시지 JSON이 비어있음");
            return;
        }
        
        // 새로운 게임 시작 시에만 씬 전환 플래그 리셋 (init 메시지 재전송으로 인한 오작동 방지)
        if (messageJson.Contains("\"type\":\"init\""))
        {
            // init 메시지가 새로운 게임 시작인지 확인 (역할이 바뀌었거나 처음 초기화인 경우)
            bool roleReceived = BootLoader.Instance != null && BootLoader.Instance.IsRoleReceived();
            bool isNewGameInit = !roleReceived || messageJson.Contains("\"role\":\"teacher\"") != (CurrentRole == "teacher");
            if (isNewGameInit)
            {
                hasPerformedSceneTransition = false;
                Debug.Log("새 게임 init 메시지로 인한 씬 전환 플래그 리셋");
            }
            else
            {
                Debug.Log("기존 게임 init 재전송 - 씬 전환 플래그 유지");
            }
        }
        
        try
        {
            // JSON 파싱 전에 로그 출력
            Debug.Log($"JSON 파싱 시도: {messageJson}");
            
            SocketMessage message = JsonUtility.FromJson<SocketMessage>(messageJson);
            
            if (message == null)
            {
                Debug.LogError("메시지 파싱 실패 - null 반환");
                // 직접 파싱 시도
                if (messageJson.Contains("\"type\"") && messageJson.Contains("\"data\""))
                {
                    Debug.Log("수동 파싱 시도");
                    // 간단한 수동 파싱
                    var typeStart = messageJson.IndexOf("\"type\":\"") + 8;
                    var typeEnd = messageJson.IndexOf("\"", typeStart);
                    var type = messageJson.Substring(typeStart, typeEnd - typeStart);
                    
                    var dataStart = messageJson.IndexOf("\"data\":\"") + 8;
                    var dataEnd = messageJson.LastIndexOf("\"");
                    var data = messageJson.Substring(dataStart, dataEnd - dataStart);
                    
                    message = new SocketMessage { type = type, data = data };
                    Debug.Log($"수동 파싱 결과: type={type}, data={data}");
                }
            }
            
            if (message != null)
            {
                Debug.Log($"메시지 타입: {message.type}");
                Debug.Log($"메시지 데이터: {message.data}");
                
                if (debugMode)
                {
                    Debug.Log($"웹에서 메시지 수신: {message.type}, 데이터: {message.data}");
                }
                
                // 메시지 타입별 처리
                switch (message.type)
                {
                    case "init":
                        Debug.Log("초기화 메시지 처리 시작");
                        HandleInit(message.data);
                        break;
                    case "playerJoined":
                        Debug.Log("플레이어 참가 메시지 처리");
                        HandlePlayerJoined(message.data);
                        break;
                    case "playerLeft":
                        Debug.Log("플레이어 퇴장 메시지 처리");
                        HandlePlayerLeft(message.data);
                        break;
                    case "gameStart":
                        Debug.Log("=== gameStart 메시지 수신됨 ===");
                        Debug.Log($"gameStart 데이터: {message.data}");
                        Debug.Log($"현재 역할: {CurrentRole}");
                        Debug.Log($"현재 씬: {UnityEngine.SceneManagement.SceneManager.GetActiveScene().name}");
                        HandleGameStart(message.data);
                        // 게임 시작 시 씬 전환도 함께 처리
                        HandleStartGame(message.data);
                        Debug.Log("=== gameStart 메시지 처리 완료 ===");
                        break;
                    case "questionUpdate":
                        Debug.Log("질문 업데이트 메시지 처리");
                        HandleQuestionUpdate(message.data);
                        break;
                    case "scoreUpdate":
                        Debug.Log("점수 업데이트 메시지 처리");
                        HandleScoreUpdate(message.data);
                        break;
                    case "gameEnd":
                        Debug.Log("게임 종료 메시지 처리");
                        HandleGameEnd(message.data);
                        break;
                    case "nextQuestion":
                        Debug.Log("다음 문제 메시지 처리");
                        HandleNextQuestion();
                        break;
                    case "start":
                        Debug.Log("시작 메시지 처리");
                        HandleStart();
                        break;
                    case "question":
                        Debug.Log("질문 메시지 처리");
                        HandleQuestion(message.data);
                        break;
                    case "scoreboard":
                        Debug.Log("점수판 메시지 처리");
                        HandleScoreboard(message.data);
                        break;
                    case "game-ended":
                        Debug.Log("게임 종료됨 메시지 처리");
                        HandleGameEnded();
                        break;
                    case "join-room":
                        Debug.Log("방 참가 메시지 처리");
                        HandleJoinRoom(message.data);
                        break;
                    case "create-room":
                        Debug.Log("방 생성 메시지 처리");
                        HandleCreateRoom(message.data);
                        break;
                    case "start-game":
                        Debug.Log("게임 시작 메시지 처리");
                        HandleStartGame(message.data);
                        break;
                    case "startGame":
                        Debug.Log("=== startGame 메시지 수신됨 ===");
                        Debug.Log($"startGame 데이터: {message.data}");
                        Debug.Log($"현재 역할: {CurrentRole}");
                        Debug.Log($"현재 게임 코드: {CurrentCode}");
                        Debug.Log($"현재 씬: {UnityEngine.SceneManagement.SceneManager.GetActiveScene().name}");
                        HandleStartGame(message.data);
                        Debug.Log("=== startGame 메시지 처리 완료 ===");
                        break;
                    case "next-question":
                        Debug.Log("다음 문제 메시지 처리");
                        HandleNextQuestion();
                        break;
                    case "answer":
                        Debug.Log("답변 메시지 처리");
                        HandleAnswer(message.data);
                        break;
                    case "forceEndGame":
                        Debug.Log("강제 게임 종료 메시지 처리");
                        HandleForceEndGame(message.data);
                        break;
                    case "updatePlayerList":
                        Debug.Log("플레이어 목록 업데이트 메시지 처리");
                        HandleUpdatePlayerList(message.data);
                        break;
                    case "questionStarted":
                        Debug.Log("문제 시작 메시지 처리");
                        HandleQuestionStarted(message.data);
                        break;
                    case "showQuestion":
                        Debug.Log("문제 표시 메시지 처리");
                        HandleShowQuestion(message.data);
                        break;
                    case "newPlayerJoined":
                        Debug.Log("새 플레이어 참가 메시지 처리 (playerJoined와 동일하게 처리)");
                        HandlePlayerJoined(message.data);
                        break;
                    case "updateGameState":
                        Debug.Log("게임 상태 업데이트 메시지 처리");
                        HandleUpdateGameState(message.data);
                        break;
                    case "refreshUI":
                        Debug.Log("UI 새로고침 메시지 처리");
                        HandleRefreshUI(message.data);
                        break;
                    default:
                        Debug.LogWarning($"알 수 없는 메시지 타입: {message.type}");
                        break;
                }
            }
            else
            {
                Debug.LogError("메시지 파싱 완전 실패");
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"메시지 처리 오류: {e.Message}");
            Debug.LogError($"스택 트레이스: {e.StackTrace}");
        }
    }
    
    // 초기화 처리 (요구사항에 맞춤)
    private void HandleInit(string data)
    {
        Debug.Log($"=== HandleInit 호출됨 ===");
        Debug.Log($"받은 데이터: {data}");
        Debug.Log($"데이터 길이: {data?.Length ?? 0}");
        
        try
        {
            var initData = JsonHelper.JsonToDictionary(data);
            
            // 씬 전환 매니저 상태 확인
            if (SceneTransitionManager.Instance != null && SceneTransitionManager.Instance.IsTransitioning())
            {
                if (debugMode)
                {
                    Debug.LogWarning("씬 전환 중이므로 초기화 처리 지연");
                }
                StartCoroutine(DelayedHandleInit(data));
                return;
            }
            
            // 즉시 roleReceived 플래그를 true로 설정 (타이밍 경쟁 조건 방지)
            if (BootLoader.Instance != null)
            {
                BootLoader.Instance.SetRoleReceived(true);
                if (debugMode)
                {
                    Debug.Log("roleReceived 플래그를 즉시 true로 설정");
                }
            }
            
            CurrentRole = initData["role"];
            CurrentCode = initData["code"];
            CurrentNickname = initData["nickname"];
            isTeacher = CurrentRole == "teacher";
            
            if (debugMode)
            {
                Debug.Log($"초기화: 역할={CurrentRole}, 코드={CurrentCode}, 닉네임={CurrentNickname}");
            }
            
            // BootLoader에 역할 설정 알림 (정적 참조 사용)
            if (BootLoader.Instance != null)
            {
                BootLoader.Instance.SetRoleReceived(true);
                BootLoader.Instance.OnRoleSet();
                if (debugMode)
                {
                    Debug.Log($"BootLoader에 역할 설정 알림 전송됨 - 역할: {CurrentRole}");
                }
            }
            else
            {
                if (debugMode)
                {
                    Debug.LogWarning("BootLoader.Instance가 null - 역할 설정 알림 전송 실패");
                }
            }
            
            // 학생인 경우 랜덤 캐릭터로 자동 참가
            if (CurrentRole == "student" && !string.IsNullOrEmpty(CurrentCode))
            {
                int randomCharacter = UnityEngine.Random.Range(1, 5); // 1-4번 캐릭터
                Debug.Log($"학생 자동 참가 준비: 랜덤 캐릭터 {randomCharacter} 선택");
                StartCoroutine(AutoJoinWithCharacter(randomCharacter));
            }
            
            // 초기화 완료 신호를 웹으로 전송 (지연 처리)
            StartCoroutine(SendInitCompleteDelayed());
            
            Debug.Log("SocketManager 초기화 처리 완료");
        }
        catch (Exception e)
        {
            Debug.LogError($"초기화 처리 오류: {e.Message}");
        }
    }
    
    // 씬 전환 중일 때 지연된 초기화 처리
    private IEnumerator DelayedHandleInit(string data)
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
        
        // 재귀 호출로 초기화 처리
        HandleInit(data);
    }
    
    // 초기화 완료 신호 지연 전송
    private IEnumerator SendInitCompleteDelayed()
    {
        yield return new WaitForSeconds(0.5f); // 0.5초 지연
        
        Debug.Log("SocketManager: init-complete 메시지 전송");
        SendMessageToWeb("init-complete", "");
    }
    
    // 학생 자동 참가 (랜덤 캐릭터)
    private IEnumerator AutoJoinWithCharacter(int character)
    {
        yield return new WaitForSeconds(1f); // 1초 대기
        
        if (CurrentRole == "student" && !string.IsNullOrEmpty(CurrentCode))
        {
            Debug.Log($"학생 자동 참가 실행: 캐릭터 {character}");
            SendJoin(character);
        }
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
            
            // CurrentRole 업데이트 (BootLoader 대기 해제용)
            CurrentRole = currentGameData.isTeacher ? "teacher" : "student";
            
            if (debugMode)
            {
                Debug.Log($"게임 시작: {currentGameData.gameCode}, 플레이어: {currentGameData.playerName}, 역할: {CurrentRole}");
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
    
    // Socket.IO 이벤트 처리들
    private void HandleStart()
    {
        if (debugMode)
        {
            Debug.Log("게임 시작 이벤트 수신");
        }
        
        OnStart?.Invoke();
    }
    
    private void HandleQuestion(string data)
    {
        try
        {
            QuestionData questionData = JsonUtility.FromJson<QuestionData>(data);
            OnQuestion?.Invoke();
            
            if (questionController != null)
            {
                questionController.SetQuestion(questionData);
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"질문 처리 오류: {e.Message}");
        }
    }
    
    private void HandleScoreboard(string data)
    {
        try
        {
            Dictionary<string, int> scores = JsonHelper.JsonToIntDictionary(data);
            
            OnScoreboard?.Invoke();
            
            if (gameStateManager != null)
            {
                // 게임 상태 매니저에 점수 업데이트 전달
                // gameStateManager.UpdateScores(scores);
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"점수판 처리 오류: {e.Message}");
        }
    }
    
    private void HandleGameEnded()
    {
        if (debugMode)
        {
            Debug.Log("게임 종료 이벤트 수신");
        }
        
        OnGameEnded?.Invoke();
    }
    
    // 방 참가 처리
    private void HandleJoinRoom(string data)
    {
        try
        {
            if (debugMode)
            {
                Debug.Log($"방 참가 요청: {data}");
            }
            
            // JSON 파싱하여 캐릭터 정보 추출
            var joinData = JsonUtility.FromJson<JoinRoomData>(data);
            if (joinData != null)
            {
                Debug.Log($"방 참가 데이터 파싱 성공: gameCode={joinData.gameCode}, nickname={joinData.nickname}, character={joinData.character}");
                
                // 캐릭터 정보 저장
                CurrentNickname = joinData.nickname;
                CurrentCode = joinData.gameCode;
                CurrentRole = "student";
                
                // 캐릭터 ID를 문자열로 변환하여 저장
                string characterId = joinData.character.ToString();
                Debug.Log($"캐릭터 ID 저장: {characterId}");
                
                // 방 참가 이벤트 발생 (캐릭터 정보 포함)
                OnStart?.Invoke();
            }
            else
            {
                Debug.LogError("방 참가 데이터 파싱 실패");
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"방 참가 처리 오류: {e.Message}");
        }
    }
    
    // 방 생성 처리
    private void HandleCreateRoom(string data)
    {
        try
        {
            if (debugMode)
            {
                Debug.Log($"방 생성 요청: {data}");
            }
            
            // 방 생성 이벤트 발생
            OnStart?.Invoke();
        }
        catch (Exception e)
        {
            Debug.LogError($"방 생성 처리 오류: {e.Message}");
        }
    }
    
    // 게임 시작 처리 (새로운 메서드)
    private void HandleStartGame(string data)
    {
        try
        {
            Debug.Log($"=== HandleStartGame 호출됨 ===");
            Debug.Log($"받은 데이터: {data}");
            Debug.Log($"현재 역할: {CurrentRole}");
            Debug.Log($"현재 게임 코드: {CurrentCode}");
            Debug.Log($"현재 닉네임: {CurrentNickname}");
            Debug.Log($"현재 씬: {UnityEngine.SceneManagement.SceneManager.GetActiveScene().name}");
            
            if (debugMode)
            {
                Debug.Log($"게임 시작 요청: {data}");
            }
            
            // 게임 시작 이벤트 발생
            OnStart?.Invoke();
            Debug.Log("OnStart 이벤트 발생 완료");
            
            // 데이터가 있는 경우 파싱, 없으면 기본값 사용
            if (!string.IsNullOrEmpty(data) && data != "\"\"" && data != "{}")
            {
                try
                {
                    currentGameData = JsonUtility.FromJson<GameStartData>(data);
                    isTeacher = currentGameData.isTeacher;
                    CurrentRole = currentGameData.isTeacher ? "teacher" : "student";
                    Debug.Log($"게임 데이터 파싱 성공: {currentGameData.gameCode}, 플레이어: {currentGameData.playerName}, 역할: {CurrentRole}");
                }
                catch (Exception parseEx)
                {
                    Debug.LogWarning($"게임 데이터 파싱 실패, 현재 역할 사용: {parseEx.Message}");
                    isTeacher = CurrentRole == "teacher";
                }
            }
            else
            {
                Debug.Log("게임 데이터가 비어있음, 현재 역할 사용");
                isTeacher = CurrentRole == "teacher";
            }
            
            isGameStarted = true;
            gameStartTime = Time.time;
            currentQuestionIndex = 0;
            playerAnswers.Clear();
            
            // 게임 시작 이벤트 발생
            OnGameStart?.Invoke(currentGameData);
            Debug.Log("OnGameStart 이벤트 발생 완료");
            
            if (gameStateManager != null)
            {
                gameStateManager.StartGame(currentGameData);
            }
            
            // 역할별 씬 전환 (새로운 로직)
            Debug.Log($"역할별 씬 전환 시작: CurrentRole={CurrentRole}, isTeacher={isTeacher}");
            
            var sceneManager = SceneTransitionManager.Instance;
            if (sceneManager != null)
            {
                // 역할에 따라 적절한 씬으로 전환
                sceneManager.LoadSceneByRole(CurrentRole);
                Debug.Log($"SceneTransitionManager를 통한 역할별 씬 전환 완료: {CurrentRole}");
            }
            else
            {
                Debug.LogError("SceneTransitionManager를 찾을 수 없음!");
                
                // 폴백: 기존 로직 사용
                if (!hasPerformedSceneTransition)
                {
                    hasPerformedSceneTransition = true;
                    
                    if (!isTeacher && CurrentRole != "teacher")
                    {
                        Debug.Log("학생으로 확인됨, 게임 씬으로 전환 시작 (폴백)");
                        StartCoroutine(PerformSceneTransition());
                    }
                    else
                    {
                        Debug.Log("선생님으로 확인됨, 로비 씬으로 전환 시작 (폴백)");
                        StartCoroutine(PerformTeacherLobbyTransition());
                    }
                }
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"게임 시작 처리 오류: {e.Message}");
            Debug.LogError($"스택 트레이스: {e.StackTrace}");
        }
    }

    // 씬 전환을 별도 코루틴으로 처리하여 안정성 향상 (학생용)
    private IEnumerator PerformSceneTransition()
    {
        yield return new WaitForSeconds(0.1f); // 짧은 대기로 안정성 확보
        
        string targetScene = "GameScene";
        string roleText = "학생";
        string currentScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene().name;
        
        Debug.Log($"=== {roleText} 게임 씬 전환 시작 ===");
        Debug.Log($"현재 씬: {currentScene}");
        Debug.Log($"목표 씬: {targetScene}");
        Debug.Log($"현재 역할: {CurrentRole}");
        Debug.Log($"isTeacher: {isTeacher}");
        
        // 선생님인 경우 학생용 씬 전환 방지
        if (CurrentRole == "teacher" || isTeacher)
        {
            Debug.LogWarning("선생님은 학생용 게임 씬으로 전환할 수 없음 - 전환 중단");
            yield break;
        }
        
        if (currentScene == targetScene)
        {
            Debug.Log($"이미 {targetScene}에 있음, 전환 생략");
            yield break;
        }
        
        // StudentLobbyManager가 있는지 확인하고 직접 호출
        var studentLobby = FindFirstObjectByType<StudentLobbyManager>();
        if (studentLobby != null)
        {
            Debug.Log("StudentLobbyManager가 감지됨 - OnGameStart 직접 호출");
            // StudentLobbyManager의 OnGameStart 메서드를 직접 호출
            studentLobby.OnGameStart();
            yield break; // StudentLobbyManager가 처리하도록 함
        }
        
        // StudentLobbyManager가 없으면 직접 씬 전환
        try
        {
            Debug.Log($"{roleText} 게임 씬으로 전환 시도: {targetScene}");
            UnityEngine.SceneManagement.SceneManager.LoadScene(targetScene);
            Debug.Log($"{roleText} 게임 씬 전환 성공: {targetScene}");
        }
        catch (Exception e)
        {
            Debug.LogError($"{roleText} 게임 씬 전환 실패: {e.Message}");
            Debug.LogError($"스택 트레이스: {e.StackTrace}");
        }
    }
    
    // 선생님용 로비 씬 전환
    private IEnumerator PerformTeacherLobbyTransition()
    {
        yield return new WaitForSeconds(0.1f);
        
        string targetScene = "TeacherLobbyScene";
        string currentScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene().name;
        
        // 이미 목표 씬에 있으면 씬 전환하지 않고 UI만 업데이트
        if (currentScene == targetScene)
        {
            Debug.Log($"이미 {targetScene}에 있음, 씬 전환 생략하고 UI 업데이트");
            
            // TeacherLobbyManager 찾아서 호스팅 UI로 전환
            yield return new WaitForSeconds(1f); // UI 안정화 대기
            var lobbyManager = FindFirstObjectByType<TeacherLobbyManager>();
            if (lobbyManager != null)
            {
                // 호스팅 UI로 전환하는 메서드 호출
                Debug.Log("TeacherLobbyManager 발견, 호스팅 UI 전환 요청");
                lobbyManager.SwitchToHostingUI();
            }
            else
            {
                Debug.LogWarning("TeacherLobbyManager를 찾을 수 없음");
            }
            yield break;
        }
        
        Debug.Log($"교사 로비 씬으로 전환 시도: {currentScene} → {targetScene}");
        
        try
        {
            UnityEngine.SceneManagement.SceneManager.LoadScene(targetScene);
            Debug.Log($"교사 로비 씬 전환 성공: {targetScene}");
        }
        catch (Exception e)
        {
            Debug.LogError($"교사 로비 씬 전환 실패: {e.Message}");
            Debug.LogError($"스택 트레이스: {e.StackTrace}");
        }
    }
    
    // 답변 처리
    private void HandleAnswer(string data)
    {
        try
        {
            if (debugMode)
            {
                Debug.Log($"답변 제출: {data}");
            }
            
            // 답변 처리 로직
            var answerData = JsonUtility.FromJson<AnswerSubmission>(data);
            if (answerData != null)
            {
                playerAnswers.Add(answerData);
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"답변 처리 오류: {e.Message}");
        }
    }
    
    // 강제 게임 종료 처리
    private void HandleForceEndGame(string data)
    {
        try
        {
            if (debugMode)
            {
                Debug.Log($"강제 게임 종료 요청: {data}");
            }
            
            // 강제 게임 종료 이벤트 발생
            OnGameEnd?.Invoke();
        }
        catch (Exception e)
        {
            Debug.LogError($"강제 게임 종료 처리 오류: {e.Message}");
        }
    }
    
    // API 메서드들 (요구사항에 맞춤)
    public void RequestPlayerList()
    {
        if (debugMode)
        {
            Debug.Log("RequestPlayerList 전송");
        }
        SendMessageToWeb("requestPlayerList", "");
    }

    public void RequestGameState()
    {
        if (debugMode)
        {
            Debug.Log("RequestGameState 전송");
        }
        SendMessageToWeb("requestGameState", "");
    }
    
    
    
    
    
    
    // 답변 제출 (기존 메서드 유지)
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
    
    // React 중계 기반: 방 생성 요청 전달
    public void EmitCreateRoom(string mode, int limit)
    {
        var data = new Dictionary<string, object>
        {
            ["gameCode"] = CurrentCode ?? string.Empty,
            ["mode"] = mode,
            ["limit"] = limit
        };
        try
        {
            string jsonData = JsonHelper.DictionaryToJsonSafe(data);
            SendMessageToWeb("create-room", jsonData);
            if (debugMode)
            {
                Debug.Log($"방 생성 요청 전달(create-room): 모드 {mode}, 제한 {limit}");
            }
        }
        catch (System.Exception e)
        {
            Debug.LogError($"EmitCreateRoom 오류: {e.Message}");
        }
    }

    // 플레이어 참가 처리 (TeacherLobby로 라우팅)
    private void HandlePlayerJoined(string data)
    {
        try
        {
            var payload = JsonUtility.FromJson<PlayerJoinedPayload>(data);
            if (payload == null)
            {
                Debug.LogWarning($"playerJoined 파싱 실패: {data}");
                return;
            }

            var id = string.IsNullOrEmpty(payload.id) ? payload.playerId : payload.id;
            var name = string.IsNullOrEmpty(payload.name) ? payload.playerName : payload.name;
            var characterId = string.IsNullOrEmpty(payload.characterId) ? payload.character : payload.characterId;

            Debug.Log($"HandlePlayerJoined 성공: id={id}, name={name}, characterId={characterId} (원본: character={payload.character}, characterId={payload.characterId})");

            // 중복 체크 - 이미 큐에 있는지 확인
            bool isAlreadyQueued = pendingPlayerJoins.Any(p => 
                (string.IsNullOrEmpty(p.id) ? p.playerId : p.id) == id
            );
            
            if (isAlreadyQueued)
            {
                Debug.Log($"중복 플레이어 큐 방지: {name} (ID: {id})는 이미 큐에 있음");
                return;
            }

            var lobby = FindFirstObjectByType<TeacherLobbyManager>();
            if (lobby != null && lobby.IsInitialized)
            {
                Debug.Log("TeacherLobbyManager 찾음 - OnPlayerJoined 호출");
                lobby.OnPlayerJoined(id, name, characterId);
            }
            else
            {
                // 로비가 아직 없으면 큐에 저장 후 나중에 플러시
                pendingPlayerJoins.Add(payload);
                if (debugMode)
                {
                    Debug.LogWarning("TeacherLobbyManager 없음 - playerJoined 이벤트 큐에 저장");
                }
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"HandlePlayerJoined 오류: {e.Message}");
        }
    }

    // 플레이어 퇴장 처리 (TeacherLobby로 라우팅)
    private void HandlePlayerLeft(string data)
    {
        try
        {
            var payload = JsonUtility.FromJson<PlayerLeftPayload>(data);
            if (payload == null)
            {
                Debug.LogWarning($"playerLeft 파싱 실패: {data}");
                return;
            }

            var lobby = FindFirstObjectByType<TeacherLobbyManager>();
            if (lobby != null)
            {
                var id = string.IsNullOrEmpty(payload.id) ? payload.playerId : payload.id;
                // 선택적으로 TeacherLobbyManager에 OnPlayerLeft(id) 메서드가 있다면 호출하도록 설계
                var method = typeof(TeacherLobbyManager).GetMethod("OnPlayerLeft");
                if (method != null)
                {
                    method.Invoke(lobby, new object[] { id });
                }
            }
            else
            {
                var id = string.IsNullOrEmpty(payload.id) ? payload.playerId : payload.id;
                pendingPlayerLeaves.Add(id);
                if (debugMode)
                {
                    Debug.LogWarning("TeacherLobbyManager 없음 - playerLeft 이벤트 큐에 저장");
                }
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"HandlePlayerLeft 오류: {e.Message}");
        }
    }

    public void TryFlushLobbyQueues()
    {
        // 역할에 따라 적절한 로비 매니저 찾기
        if (CurrentRole == "teacher")
        {
            var lobby = FindFirstObjectByType<TeacherLobbyManager>();
            if (lobby == null) 
            {
                if (debugMode)
                {
                    Debug.LogWarning("TryFlushLobbyQueues: TeacherLobbyManager를 찾을 수 없음 - 지연된 초기화 대기 중");
                }
                // TeacherLobbyManager가 아직 초기화되지 않았을 수 있으므로 나중에 다시 시도
                StartCoroutine(DelayedFlushLobbyQueues());
                return;
            }

            // TeacherLobbyManager가 초기화되지 않았으면 대기
            if (!lobby.IsInitialized)
            {
                if (debugMode)
                {
                    Debug.LogWarning("TryFlushLobbyQueues: TeacherLobbyManager가 아직 초기화되지 않음 - 대기 중");
                }
                StartCoroutine(DelayedFlushLobbyQueues());
                return;
            }

            Debug.Log($"TryFlushLobbyQueues (Teacher) 실행: pendingPlayerJoins={pendingPlayerJoins.Count}, pendingPlayerLeaves={pendingPlayerLeaves.Count}");

            // 중복 제거 후 Join 플러시
            var uniqueJoins = new List<PlayerJoinedPayload>();
            var processedIds = new HashSet<string>();
            
            foreach (var p in pendingPlayerJoins)
            {
                var id = string.IsNullOrEmpty(p.id) ? p.playerId : p.id;
                if (!processedIds.Contains(id))
                {
                    uniqueJoins.Add(p);
                    processedIds.Add(id);
                }
                else
                {
                    Debug.Log($"중복 플레이어 제거: {id}");
                }
            }
            
            pendingPlayerJoins.Clear();
            
            foreach (var p in uniqueJoins)
            {
                try
                {
                    var id = string.IsNullOrEmpty(p.id) ? p.playerId : p.id;
                    var name = string.IsNullOrEmpty(p.name) ? p.playerName : p.name;
                    Debug.Log($"큐에서 플레이어 플러시: id={id}, name={name}, characterId={p.characterId}");
                    lobby.OnPlayerJoined(id, name, p.characterId);
                }
                catch (Exception e)
                {
                    Debug.LogError($"플러시 중 오류(playerJoined): {e.Message}");
                }
            }

            // Leave 플러시
            var onLeft = typeof(TeacherLobbyManager).GetMethod("OnPlayerLeft");
            if (onLeft != null)
            {
                foreach (var id in pendingPlayerLeaves)
                {
                    try 
                    { 
                        Debug.Log($"큐에서 플레이어 퇴장 플러시: id={id}");
                        onLeft.Invoke(lobby, new object[] { id }); 
                    }
                    catch (Exception e) 
                    { 
                        Debug.LogError($"플러시 중 오류(playerLeft): {e.Message}"); 
                    }
                }
            }
            pendingPlayerLeaves.Clear();
        }
        else if (CurrentRole == "student")
        {
            // 학생의 경우 로비 큐 플러시가 필요하지 않음 (교사만 플레이어 목록 관리)
            Debug.Log("TryFlushLobbyQueues (Student): 학생은 로비 큐 플러시 불필요");
            pendingPlayerJoins.Clear();
            pendingPlayerLeaves.Clear();
        }
        
        Debug.Log("TryFlushLobbyQueues 완료");
    }


    
    // 강제 큐 플러시 (외부에서 호출 가능)
    public void ForceFlushLobbyQueues()
    {
        Debug.Log("ForceFlushLobbyQueues 호출됨");
        TryFlushLobbyQueues();
    }

    [Serializable]
    private class PlayerJoinedPayload
    {
        public string id;
        public string playerId;
        public string name;
        public string playerName;
        public string characterId;
        public string character; // React에서 보내는 character 필드 추가
    }

    [Serializable]
    private class PlayerLeftPayload
    {
        public string id;
        public string playerId;
    }
    
    [Serializable]
    private class JoinRoomData
    {
        public string gameCode;
        public string nickname;
        public int character;
    }

    // React 중계 기반: 학생 참가 요청 전달
    private bool hasJoinedRoom = false;
    private float lastJoinTime = 0f;
    private const float JOIN_COOLDOWN = 2f; // 2초 쿨다운
    
    public void SendJoin(int character)
    {
        // 캐릭터 변경 시에는 쿨다운 무시하고 즉시 전송
        if (hasJoinedRoom && (Time.time - lastJoinTime) < JOIN_COOLDOWN)
        {
            Debug.Log($"캐릭터 변경 감지: 캐릭터 {character}로 즉시 변경 (쿨다운 무시)");
            // 쿨다운 무시하고 진행
        }
        
        // React에 캐릭터 변경 알림 전송
        var characterData = new Dictionary<string, object>
        {
            ["characterId"] = character
        };
        try
        {
            string characterJson = JsonHelper.DictionaryToJsonSafe(characterData);
            SendMessageToWeb("character-changed", characterJson);
            Debug.Log($"캐릭터 변경 알림 전송: {character}");
        }
        catch (System.Exception e)
        {
            Debug.LogError($"캐릭터 변경 알림 전송 오류: {e.Message}");
        }
        
        var data = new Dictionary<string, object>
        {
            ["gameCode"] = CurrentCode ?? string.Empty,
            ["nickname"] = CurrentNickname ?? string.Empty,
            ["character"] = character
        };
        try
        {
            string jsonData = JsonHelper.DictionaryToJsonSafe(data);
            SendMessageToWeb("join-room", jsonData);
            hasJoinedRoom = true; // 참가 플래그 설정
            lastJoinTime = Time.time; // 마지막 참가 시간 기록
            
            if (debugMode)
            {
                Debug.Log($"방 참가 요청 전달(join-room): 캐릭터 {character}");
            }
        }
        catch (System.Exception e)
        {
            hasJoinedRoom = false; // 실패 시 플래그 리셋
            Debug.LogError($"SendJoin 오류: {e.Message}");
        }
    }

    // React 중계 기반: 답변 제출 전달
    public void SendAnswer(int qid, int choice)
    {
        var data = new Dictionary<string, object>
        {
            ["questionId"] = qid,
            ["answer"] = choice
        };
        try
        {
            string jsonData = JsonHelper.DictionaryToJsonSafe(data);
            SendMessageToWeb("answer", jsonData);
            if (debugMode)
            {
                Debug.Log($"답변 제출 전달(answer): 질문 {qid}, 선택 {choice}");
            }
        }
        catch (System.Exception e)
        {
            Debug.LogError($"SendAnswer 오류: {e.Message}");
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
    
    // 웹으로 메시지 전송
    public void SendMessageToWeb(string type, string data)
    {
        SocketMessage message = new SocketMessage
        {
            type = type,
            data = data
        };
        
        string messageJson = JsonUtility.ToJson(message);
        
        if (debugMode)
        {
            Debug.Log($"웹으로 메시지 전송: {type}");
        }
        
        // WebGL에서는 JavaScript 함수를 통해 메시지를 전송
        if (Application.platform == RuntimePlatform.WebGLPlayer)
        {
            try
            {
                // JavaScript 브리지 함수 호출 (안전한 버전)
                IntPtr messagePtr = CStringAllocator.StringToIntPtr(messageJson);
                try
                {
                    SendMessageToWebInternal(messagePtr);
                }
                finally
                {
                    CStringAllocator.FreeIntPtr(messagePtr);
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"JavaScript 메시지 전송 실패: {e.Message}");
                // 실패해도 게임은 계속 진행
            }
        }
    }
    
    // WebGL에서 JavaScript로 메시지 전송
    [System.Runtime.InteropServices.DllImport("__Internal")]
    private static extern void SendMessageToWebInternal(IntPtr message);
    
    // 재발방지책 #70: 메모리 관리는 C# 측 CStringAllocator로 통일
    
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
    
    // 기본 역할 설정 (에디터 모드에서 테스트용)
    public void SetDefaultRole(string role)
    {
        CurrentRole = role;
        CurrentCode = "TEST" + UnityEngine.Random.Range(100, 999);
        CurrentNickname = role == "teacher" ? "TestTeacher" : "TestStudent";
        isTeacher = role == "teacher";
        
        if (debugMode)
        {
            Debug.Log($"기본 역할 설정: {role}, 코드: {CurrentCode}, 닉네임: {CurrentNickname}");
        }
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
    
    // 새로운 메시지 핸들러들
    private void HandleUpdatePlayerList(string data)
    {
        Debug.Log($"플레이어 목록 업데이트: {data}");
        try
        {
            var playerListData = JsonUtility.FromJson<PlayerListData>(data);
            
            // 선생님 모드일 때만 플레이어 목록 업데이트
            if (CurrentRole == "teacher")
            {
                // 다양한 방법으로 TeacherLobbyManager 검색
                var teacherManager = FindFirstObjectByType<TeacherLobbyManager>();
                if (teacherManager == null)
                {
                    // GameObject.Find로 재시도
                    var teacherObj = GameObject.Find("TeacherLobbyManager");
                    if (teacherObj != null)
                        teacherManager = teacherObj.GetComponent<TeacherLobbyManager>();
                }
                
                if (teacherManager != null)
                {
                    teacherManager.UpdatePlayerList(playerListData.players);
                    Debug.Log($"선생님 플레이어 목록 업데이트 완료: {playerListData.players?.Length ?? 0}명");
                }
                else
                {
                    Debug.LogWarning("TeacherLobbyManager를 찾을 수 없음 - 플레이어 목록 업데이트 실패");
                    // 대안: 직접 UI 업데이트 시도
                    TryUpdateTeacherUIDirectly(playerListData.players);
                }
            }
        }
        catch (System.Exception e)
        {
            Debug.LogError($"플레이어 목록 업데이트 처리 오류: {e.Message}");
        }
    }
    
    private void HandleQuestionStarted(string data)
    {
        Debug.Log($"문제 시작: {data}");
        try
        {
            var questionData = JsonUtility.FromJson<QuestionStartData>(data);
            
            // 문제 시작 처리
            if (questionController != null)
            {
                questionController.StartQuestion(questionData);
            }
            
            // 게임 상태 업데이트
            if (gameStateManager != null)
            {
                gameStateManager.SetState("QuestionStarted");
            }
            
            Debug.Log($"문제 시작 처리 완료: {questionData?.questionText ?? "알 수 없는 문제"}");
        }
        catch (System.Exception e)
        {
            Debug.LogError($"문제 시작 처리 오류: {e.Message}");
        }
    }
    
    private void HandleShowQuestion(string data)
    {
        Debug.Log($"문제 표시: {data}");
        try
        {
            var questionData = JsonUtility.FromJson<QuestionData>(data);
            
            // 문제 표시 처리
            if (questionController != null)
            {
                questionController.ShowQuestion(questionData);
            }
            
            Debug.Log($"문제 표시 처리 완료: {questionData?.question ?? "알 수 없는 문제"}");
        }
        catch (System.Exception e)
        {
            Debug.LogError($"문제 표시 처리 오류: {e.Message}");
        }
    }
    
    private void HandleUpdateGameState(string data)
    {
        Debug.Log($"게임 상태 업데이트: {data}");
        try
        {
            var gameStateData = JsonUtility.FromJson<GameStateData>(data);
            
            // 게임 상태 업데이트
            if (gameStateManager != null)
            {
                gameStateManager.UpdateGameState(gameStateData);
            }
            
            Debug.Log($"게임 상태 업데이트 완료: {gameStateData?.state ?? "알 수 없는 상태"}");
        }
        catch (System.Exception e)
        {
            Debug.LogError($"게임 상태 업데이트 처리 오류: {e.Message}");
        }
    }
    
    private void HandleRefreshUI(string data)
    {
        Debug.Log($"UI 새로고침: {data}");
        try
        {
            // UI 새로고침 처리
            var teacherManager = FindFirstObjectByType<TeacherLobbyManager>();
            if (teacherManager != null)
            {
                teacherManager.RefreshUI();
                Debug.Log("선생님 UI 새로고침 완료");
            }
            
            var studentManager = FindFirstObjectByType<StudentLobbyManager>();
            if (studentManager != null)
            {
                studentManager.RefreshUI();
                Debug.Log("학생 UI 새로고침 완료");
            }
        }
        catch (System.Exception e)
        {
            Debug.LogError($"UI 새로고침 처리 오류: {e.Message}");
        }
    }
    
    // TeacherLobbyManager가 없을 때 직접 UI 업데이트 시도
    private void TryUpdateTeacherUIDirectly(string[] players)
    {
        try
        {
            Debug.Log("TeacherLobbyManager 대안 - 직접 UI 업데이트 시도");
            
            // 학생 목록 UI를 직접 찾아서 업데이트
            var studentListParent = GameObject.Find("StudentList");
            if (studentListParent == null)
                studentListParent = GameObject.Find("PlayerList");
            if (studentListParent == null)
                studentListParent = GameObject.Find("Students");
                
            if (studentListParent != null)
            {
                Debug.Log($"학생 목록 UI 발견: {studentListParent.name}");
                
                // 기존 학생 목록 제거
                for (int i = studentListParent.transform.childCount - 1; i >= 0; i--)
                {
                    var child = studentListParent.transform.GetChild(i);
                    if (child.name.StartsWith("Student") || child.name.StartsWith("Player"))
                    {
                        DestroyImmediate(child.gameObject);
                    }
                }
                
                // 새 학생 목록 추가
                foreach (var playerName in players)
                {
                    var playerObj = new GameObject($"Student_{playerName}");
                    playerObj.transform.SetParent(studentListParent.transform);
                    
                    var textComponent = playerObj.AddComponent<UnityEngine.UI.Text>();
                    if (textComponent != null)
                    {
                        textComponent.text = playerName;
                        textComponent.fontSize = 16;
                        textComponent.color = UnityEngine.Color.black;
                    }
                }
                
                Debug.Log($"직접 UI 업데이트 완료: {players.Length}명");
            }
            else
            {
                Debug.LogWarning("학생 목록 UI를 찾을 수 없음");
            }
        }
        catch (System.Exception e)
        {
            Debug.LogError($"직접 UI 업데이트 실패: {e.Message}");
        }
    }
}

// 새로운 데이터 클래스들
[System.Serializable]
public class PlayerListData
{
    public string[] players;
    public int playerCount;
}

[System.Serializable]
public class QuestionStartData
{
    public string questionText;
    public int questionIndex;
    public float timeLimit;
}

[System.Serializable]
public class GameStateData
{
    public string state;
    public string role;
    public string gameCode;
    public int playerCount;
    public PlayerInfo[] players;
    public QuestionData currentQuestion;
} 