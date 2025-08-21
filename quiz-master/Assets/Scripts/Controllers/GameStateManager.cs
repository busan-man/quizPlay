using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class GameStateManager : MonoBehaviour
{
    public static GameStateManager Instance { get; private set; }
    
    [Header("UI References")]
    public GameObject gameStartPanel;
    public GameObject gamePlayPanel;
    public GameObject gameEndPanel;
    public GameObject teacherPanel;
    public GameObject studentPanel;
    
    [Header("Game Info UI")]
    public Text gameCodeText;
    public Text playerNameText;
    public Text characterText;
    public Text scoreText;
    public Text timerText;
    public Text questionText;
    
    [Header("Teacher UI")]
    public Transform playerListContent;
    public GameObject playerListItemPrefab;
    public Transform scoreListContent;
    public GameObject scoreListItemPrefab;
    
    [Header("Game Settings")]
    public float questionTimeLimit = 30f;
    public bool isTimeBasedGame = true;
    public float gameTimeLimit = 300f; // 5분
    
    [Header("Debug Settings")]
    public bool debugMode = true;
    
    private GameStartData currentGameData;
    private bool isGameActive = false;
    private bool isTeacher = false;
    private float gameTimer;
    private float questionTimer;
    private int currentScore = 0;
    private int currentQuestionIndex = 0;
    private List<QuestionData> questions = new List<QuestionData>();
    private Dictionary<string, PlayerInfo> players = new Dictionary<string, PlayerInfo>();
    

    
    // Events
    public static event Action<GameStartData> OnGameStarted;
    public static event Action OnGameEnded;
    public static event Action<QuestionData> OnQuestionChanged;
    public static event Action<int> OnScoreChanged;
    public static event Action<float> OnTimerChanged;
    
    void Awake()
    {
        // 더 강력한 싱글톤 체크 (씬 전환 시 중복 방지)
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
            
            if (debugMode)
            {
                Debug.Log("GameStateManager 싱글톤 초기화됨");
            }
        }
        else if (Instance != this)
        {
            if (debugMode)
            {
                Debug.Log("GameStateManager 중복 인스턴스 제거됨");
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
            Debug.Log($"GameStateManager - 씬 언로드 감지: {scene.name}");
        }
        
        // 씬 언로드 시 게임 상태 유지 (DontDestroyOnLoad로 유지)
        // isGameActive는 유지하여 무한루프 방지
    }
    
    private void OnSceneLoaded(UnityEngine.SceneManagement.Scene scene, UnityEngine.SceneManagement.LoadSceneMode mode)
    {
        if (debugMode)
        {
            Debug.Log($"GameStateManager - 씬 로드 감지: {scene.name}");
        }
        
        // 씬별 초기화
        if (scene.name == "GameScene")
        {
            InitializeGameScene();
        }
    }
    
    private void InitializeGameScene()
    {
        // UI 참조 재연결 및 초기 패널 상태 설정
        StartCoroutine(ReconnectUIReferencesAfterSceneLoad());
        
        // 현재 게임 진행 상태에 따른 패널 표시
        if (isGameActive)
        {
            ShowGamePlayPanel();
        }
        else
        {
            ShowGameStartPanel();
        }
        
        if (debugMode)
        {
            Debug.Log("GameStateManager - InitializeGameScene 완료");
        }
    }
    
    // SocketManager에서 호출하는 메서드들
    public void SetState(string state)
    {
        Debug.Log($"GameStateManager SetState 호출됨: {state}");
        
        switch (state.ToLower())
        {
            case "questionstarted":
                if (debugMode)
                {
                    Debug.Log("게임 상태: 문제 시작됨");
                }
                break;
            case "gameended":
                if (debugMode)
                {
                    Debug.Log("게임 상태: 게임 종료됨");
                }
                EndGame();
                break;
            case "waiting":
                if (debugMode)
                {
                    Debug.Log("게임 상태: 대기 중");
                }
                break;
            default:
                if (debugMode)
                {
                    Debug.Log($"알 수 없는 게임 상태: {state}");
                }
                break;
        }
    }
    
    public void UpdateGameState(GameStateData gameStateData)
    {
        Debug.Log($"GameStateManager UpdateGameState 호출됨: {gameStateData?.state ?? "알 수 없는 상태"}");
        
        if (gameStateData == null) return;
        
        // 게임 상태 업데이트
        SetState(gameStateData.state);
        
        // 추가 게임 데이터가 있다면 업데이트
        if (gameStateData.players != null)
        {
            UpdatePlayerList(gameStateData.players);
        }
        
        if (gameStateData.currentQuestion != null)
        {
            UpdateCurrentQuestion(gameStateData.currentQuestion);
        }
        
        Debug.Log($"게임 상태 업데이트 완료: {gameStateData.state}");
    }
    
    private void UpdatePlayerList(PlayerInfo[] players)
    {
        if (players == null) return;
        
        this.players.Clear();
        foreach (var player in players)
        {
            if (player != null && !string.IsNullOrEmpty(player.playerId))
            {
                this.players[player.playerId] = player;
            }
        }
        
        if (debugMode)
        {
            Debug.Log($"플레이어 목록 업데이트: {this.players.Count}명");
        }
    }
    
    private void UpdateCurrentQuestion(QuestionData question)
    {
        if (question == null) return;
        
        // 현재 문제 업데이트
        if (questionText != null)
        {
            questionText.text = question.question;
        }
        
        if (debugMode)
        {
            Debug.Log($"현재 문제 업데이트: {question.question}");
        }
    }
    
    private IEnumerator ReconnectUIReferencesAfterSceneLoad()
    {
        yield return new WaitForEndOfFrame();
        
        // UI 참조 재설정 (필요한 경우)
        if (gameStartPanel == null || gamePlayPanel == null || gameEndPanel == null)
        {
            // UI 패널들을 다시 찾거나 생성
            if (debugMode)
            {
                Debug.Log("GameStateManager - UI 참조 재설정 필요");
            }
        }
        
        if (debugMode)
        {
            Debug.Log($"GameStateManager - UI 참조 재설정 완료");
        }
    }
    
    void Start()
    {
        // 초기 UI 설정
        ShowGameStartPanel();
        
        // WebCommunicationController 이벤트 구독
        WebCommunicationController.OnGameStart += HandleGameStart;
        WebCommunicationController.OnQuestionReceived += HandleQuestionReceived;
        WebCommunicationController.OnScoreUpdate += HandleScoreUpdate;
        WebCommunicationController.OnGameEnd += HandleGameEnd;
    }
    
    void Update()
    {
        if (isGameActive)
        {
            UpdateTimers();
        }
    }
    
    // 초기화 처리
    public void InitializeGame(InitData initData)
    {
        Debug.Log($"게임 초기화: 역할={initData.role}, 코드={initData.code}, 닉네임={initData.nickname}");
        
        // 씬 전환 매니저 상태 확인
        if (SceneTransitionManager.Instance != null && SceneTransitionManager.Instance.IsTransitioning())
        {
            if (debugMode)
            {
                Debug.LogWarning("씬 전환 중이므로 초기화 처리 지연");
            }
            StartCoroutine(DelayedInitializeGame(initData));
            return;
        }
        
        // 초기화 데이터를 GameStartData로 변환
        currentGameData = new GameStartData
        {
            gameCode = initData.code,
            playerName = initData.nickname,
            isTeacher = initData.role == "teacher"
        };
        
        isTeacher = initData.role == "teacher";
        
        // UI 업데이트
        if (gameCodeText != null)
            gameCodeText.text = $"게임 코드: {initData.code}";
        
        if (playerNameText != null)
            playerNameText.text = $"플레이어: {initData.nickname}";
        
        // 역할에 따른 UI 표시
        if (isTeacher)
        {
            if (teacherPanel != null)
                teacherPanel.SetActive(true);
            if (studentPanel != null)
                studentPanel.SetActive(false);
        }
        else
        {
            if (teacherPanel != null)
                teacherPanel.SetActive(false);
            if (studentPanel != null)
                studentPanel.SetActive(true);
        }
        
        Debug.Log("게임 초기화 완료");
    }
    
    // 씬 전환 중일 때 지연된 초기화 처리
    private IEnumerator DelayedInitializeGame(InitData initData)
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
        InitializeGame(initData);
    }
    
    // 게임 시작 처리
    public void StartGame(GameStartData gameData)
    {
        currentGameData = gameData;
        isTeacher = gameData.isTeacher;
        isGameActive = true;
        gameTimer = 0f;
        currentScore = 0;
        currentQuestionIndex = 0;
        questions.Clear();
        players.Clear();
        
        // UI 업데이트
        UpdateGameInfoUI();
        ShowGamePlayPanel();
        
        // 이벤트 발생
        OnGameStarted?.Invoke(gameData);
        
        Debug.Log($"게임 시작: {gameData.gameCode}, 선생님: {isTeacher}");
    }
    
    // 게임 시작 이벤트 처리
    private void HandleGameStart(GameStartData gameData)
    {
        StartGame(gameData);
    }
    
    // 질문 수신 처리
    private void HandleQuestionReceived(QuestionData question)
    {
        questions.Add(question);
        
        if (currentQuestionIndex == 0)
        {
            // 첫 번째 질문이면 즉시 표시
            ShowQuestion(question);
        }
    }
    
    // 점수 업데이트 처리
    private void HandleScoreUpdate(Dictionary<string, int> scores)
    {
        foreach (var score in scores)
        {
            if (players.ContainsKey(score.Key))
            {
                players[score.Key].score = score.Value;
            }
        }
        
        if (isTeacher)
        {
            UpdateTeacherUI();
        }
    }
    
    // 게임 종료 처리
    private void HandleGameEnd()
    {
        EndGame();
    }
    
    // 게임 종료
    public void EndGame()
    {
        isGameActive = false;
        
        // UI 업데이트
        ShowGameEndPanel();
        
        // 이벤트 발생
        OnGameEnded?.Invoke();
        
        Debug.Log("게임 종료");
    }
    
    // 질문 표시
    public void ShowQuestion(QuestionData question)
    {
        if (questionText != null)
        {
            questionText.text = question.question;
        }
        
        questionTimer = question.timeLimit > 0 ? question.timeLimit : questionTimeLimit;
        
        // 이벤트 발생
        OnQuestionChanged?.Invoke(question);
        
        Debug.Log($"질문 표시: {question.question}");
    }
    
    // 다음 질문으로 이동
    public void NextQuestion()
    {
        currentQuestionIndex++;
        
        if (currentQuestionIndex < questions.Count)
        {
            ShowQuestion(questions[currentQuestionIndex]);
        }
        else
        {
            // 모든 질문 완료
            CompleteGame();
        }
    }
    
    // 답변 제출
    public void SubmitAnswer(string selectedAnswer)
    {
        if (currentQuestionIndex >= questions.Count) return;
        
        QuestionData currentQuestion = questions[currentQuestionIndex];
        bool isCorrect = selectedAnswer == currentQuestion.correctAnswer;
        int points = isCorrect ? currentQuestion.points : 0;
        
        // 점수 업데이트
        currentScore += points;
        OnScoreChanged?.Invoke(currentScore);
        
        // WebCommunicationController에 답변 전송
        if (WebCommunicationController.Instance != null)
        {
            WebCommunicationController.Instance.SubmitAnswer(
                currentQuestionIndex.ToString(),
                selectedAnswer,
                isCorrect,
                points,
                questionTimeLimit - questionTimer
            );
        }
        
        // 다음 질문으로 이동
        NextQuestion();
    }
    
    // 게임 완료
    public void CompleteGame()
    {
        if (WebCommunicationController.Instance != null)
        {
            WebCommunicationController.Instance.CompleteGame();
        }
        
        EndGame();
    }
    
    // 타이머 업데이트
    private void UpdateTimers()
    {
        // 게임 타이머
        if (isTimeBasedGame)
        {
            gameTimer += Time.deltaTime;
            if (gameTimer >= gameTimeLimit)
            {
                CompleteGame();
                return;
            }
        }
        
        // 질문 타이머
        if (questionTimer > 0)
        {
            questionTimer -= Time.deltaTime;
            if (questionTimer <= 0)
            {
                // 시간 초과 - 자동으로 다음 질문
                NextQuestion();
            }
        }
        
        // UI 업데이트
        UpdateTimerUI();
    }
    
    // 타이머 UI 업데이트
    private void UpdateTimerUI()
    {
        if (timerText != null)
        {
            if (isTimeBasedGame)
            {
                float remainingTime = gameTimeLimit - gameTimer;
                int minutes = Mathf.FloorToInt(remainingTime / 60);
                int seconds = Mathf.FloorToInt(remainingTime % 60);
                timerText.text = $"남은 시간: {minutes:00}:{seconds:00}";
                
                // 타이머 변경 이벤트 발생
                OnTimerChanged?.Invoke(remainingTime);
            }
            else
            {
                timerText.text = $"질문 시간: {questionTimer:F1}초";
                
                // 타이머 변경 이벤트 발생
                OnTimerChanged?.Invoke(questionTimer);
            }
        }
    }
    
    // 게임 정보 UI 업데이트
    private void UpdateGameInfoUI()
    {
        if (gameCodeText != null && currentGameData != null)
        {
            gameCodeText.text = $"게임 코드: {currentGameData.gameCode}";
        }
        
        if (playerNameText != null && currentGameData != null)
        {
            playerNameText.text = $"플레이어: {currentGameData.playerName}";
        }
        
        if (characterText != null && currentGameData != null)
        {
            characterText.text = $"캐릭터: {currentGameData.characterId}";
        }
        
        if (scoreText != null)
        {
            scoreText.text = $"점수: {currentScore}";
        }
    }
    
    // 선생님 UI 업데이트
    private void UpdateTeacherUI()
    {
        if (!isTeacher) return;
        
        // 플레이어 목록 업데이트
        UpdatePlayerList();
        
        // 점수 목록 업데이트
        UpdateScoreList();
    }
    
    // 플레이어 목록 업데이트
    private void UpdatePlayerList()
    {
        if (playerListContent == null || playerListItemPrefab == null) return;
        
        // 기존 항목들 제거
        foreach (Transform child in playerListContent)
        {
            Destroy(child.gameObject);
        }
        
        // 새 항목들 생성
        foreach (var player in players.Values)
        {
            GameObject item = Instantiate(playerListItemPrefab, playerListContent);
            var playerItem = item.GetComponent<PlayerListItem>();
            if (playerItem != null)
            {
                float accuracy = player.totalAnswers > 0 ? (float)player.correctAnswers / player.totalAnswers * 100f : 0f;
                playerItem.SetPlayerData(0, player.playerName, player.characterId, player.score, accuracy, player.isOnline);
            }
        }
    }
    
    // 점수 목록 업데이트
    private void UpdateScoreList()
    {
        if (scoreListContent == null || scoreListItemPrefab == null) return;
        
        // 기존 항목들 제거
        foreach (Transform child in scoreListContent)
        {
            Destroy(child.gameObject);
        }
        
        // 점수순으로 정렬
        var sortedPlayers = new List<PlayerInfo>(players.Values);
        sortedPlayers.Sort((a, b) => b.score.CompareTo(a.score));
        
        // 새 항목들 생성
        for (int i = 0; i < sortedPlayers.Count; i++)
        {
            GameObject item = Instantiate(scoreListItemPrefab, scoreListContent);
            var scoreItem = item.GetComponent<ScoreListItem>();
            if (scoreItem != null)
            {
                var player = sortedPlayers[i];
                float accuracy = player.totalAnswers > 0 ? (float)player.correctAnswers / player.totalAnswers * 100f : 0f;
                string result = $"{player.score}점 ({accuracy:F1}%)";
                scoreItem.SetEventData(
                    $"#{i + 1}", 
                    player.playerName, 
                    $"정답: {player.correctAnswers}/{player.totalAnswers}", 
                    result
                );
            }
        }
    }
    
    // UI 패널 표시 메서드들
    private void ShowGameStartPanel()
    {
        if (gameStartPanel != null) gameStartPanel.SetActive(true);
        if (gamePlayPanel != null) gamePlayPanel.SetActive(false);
        if (gameEndPanel != null) gameEndPanel.SetActive(false);
    }
    
    private void ShowGamePlayPanel()
    {
        if (gameStartPanel != null) gameStartPanel.SetActive(false);
        if (gamePlayPanel != null) gamePlayPanel.SetActive(true);
        if (gameEndPanel != null) gameEndPanel.SetActive(false);
        
        // 선생님/학생 패널 설정
        if (teacherPanel != null) teacherPanel.SetActive(isTeacher);
        if (studentPanel != null) studentPanel.SetActive(!isTeacher);
    }
    
    private void ShowGameEndPanel()
    {
        if (gameStartPanel != null) gameStartPanel.SetActive(false);
        if (gamePlayPanel != null) gamePlayPanel.SetActive(false);
        if (gameEndPanel != null) gameEndPanel.SetActive(true);
    }
    
    // 플레이어 추가/업데이트
    public void UpdatePlayer(string playerId, string playerName, string characterId, int score = 0)
    {
        if (!players.ContainsKey(playerId))
        {
            players[playerId] = new PlayerInfo();
        }
        
        players[playerId].playerId = playerId;
        players[playerId].playerName = playerName;
        players[playerId].characterId = characterId;
        players[playerId].score = score;
        players[playerId].isOnline = true;
        
        if (isTeacher)
        {
            UpdateTeacherUI();
        }
    }
    
    // 플레이어 제거
    public void RemovePlayer(string playerId)
    {
        if (players.ContainsKey(playerId))
        {
            players[playerId].isOnline = false;
            
            if (isTeacher)
            {
                UpdateTeacherUI();
            }
        }
    }
    
    // 현재 게임 데이터 반환
    public GameStartData GetCurrentGameData()
    {
        return currentGameData;
    }
    
    // 게임 활성 상태 확인
    public bool IsGameActive()
    {
        return isGameActive;
    }
    
    // 선생님 여부 확인
    public bool IsTeacher()
    {
        return isTeacher;
    }
    
    // 현재 점수 반환
    public int GetCurrentScore()
    {
        return currentScore;
    }
} 