using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UnityEngine.SceneManagement;

public class GameManager : MonoBehaviour
{
    [Header("기존 Quiz-Master 컨트롤러들")]
    public QuestionController questionController;
    public AnswerController answerController;
    public ScoreController scoreController;
    public TimerController timerController;
    
    [Header("UI References")]
    public TMP_Text playerNameText;
    public TMP_Text characterText;
    
    [Header("Game Settings")]
    public float questionTimeLimit = 30f;
    public float gameTimeLimit = 300f; // 5분
    
    private QuestionData currentQuestion;
    private bool isAnswerSubmitted = false;
    private float questionTimer;
    private float gameTimer;
    private int currentScore = 0;
    private int correctAnswers = 0;
    private int totalQuestions = 0;
    private bool isGameActive = false;
    
    void Start()
    {
        // 재발 방지책: 씬 전환 후 지연 실행으로 JavaScript 함수 재등록 대기
        StartCoroutine(DelayedInitialization());
    }
    
    // 재발 방지책: 씬 전환 후 안전한 초기화
    IEnumerator DelayedInitialization()
    {
        // 재발 방지책: 씬 전환 완료 대기 시간 증가 (3초)
        yield return new WaitForSeconds(3f);
        
        // 한국어 폰트 설정
        SetupKoreanFont();
        
        // 기존 quiz-master 컨트롤러들 자동 찾기
        FindQuizMasterControllers();
        
        // 플레이어 정보 UI 생성
        CreatePlayerInfoUI();
        
        InitializeUI();
        SetupEventListeners();
        
        // SocketManager에서 게임 정보 가져오기
        if (SocketManager.Instance != null)
        {
            var gameData = SocketManager.Instance.GetCurrentGameData();
            if (gameData != null)
            {
                if (playerNameText != null)
                    playerNameText.text = gameData.playerName;
                if (characterText != null)
                    characterText.text = $"캐릭터 {gameData.characterId}";
                
                // 게임 설정 적용
                if (gameData.gameConfig != null)
                {
                    if (gameData.gameConfig.gameMode == "time")
                    {
                        gameTimeLimit = gameData.gameConfig.timeLimit * 60f; // 분을 초로 변환
                    }
                }
            }
            
            Debug.Log("GameManager 초기화 완료 - JavaScript 함수 재등록 대기 완료 (3초)");
            
            // 퀴즈 셀렉션 건너뛰고 자동으로 퀴즈 시작
            StartCoroutine(AutoStartQuiz());
        }
        else
        {
            Debug.LogWarning("SocketManager가 null입니다 - 추가 대기 후 재시도");
            yield return new WaitForSeconds(1f);
            
            if (SocketManager.Instance != null)
            {
                Debug.Log("GameManager 초기화 완료 - 추가 대기 후 성공");
                
                // 퀴즈 셀렉션 건너뛰고 자동으로 퀴즈 시작
                StartCoroutine(AutoStartQuiz());
            }
        }
    }
    
    void SetupKoreanFont()
    {
        // Maplestory Bold SDF 폰트 로드
        TMP_FontAsset koreanFont = Resources.Load<TMP_FontAsset>("Fonts/Maplestory Bold SDF");
        if (koreanFont == null)
        {
            // Resources 폴더에서 찾지 못한 경우 직접 로드
            koreanFont = Resources.Load<TMP_FontAsset>("TextMesh Pro/Fonts/Maplestory Bold SDF");
        }
        
        if (koreanFont != null)
        {
            // TMP Settings의 기본 폰트로 설정
            TMP_Settings.defaultFontAsset = koreanFont;
            Debug.Log("한국어 폰트 설정 완료: Maplestory Bold SDF");
        }
        else
        {
            Debug.LogWarning("한국어 폰트를 찾을 수 없습니다: Maplestory Bold SDF");
        }
    }
    
    void FindQuizMasterControllers()
    {
        // 기존 quiz-master 컨트롤러들 자동 찾기
        questionController = FindFirstObjectByType<QuestionController>();
        answerController = FindFirstObjectByType<AnswerController>();
        scoreController = FindFirstObjectByType<ScoreController>();
        timerController = FindFirstObjectByType<TimerController>();
        
        if (questionController == null)
            Debug.LogWarning("QuestionController를 찾을 수 없습니다!");
        if (answerController == null)
            Debug.LogWarning("AnswerController를 찾을 수 없습니다!");
        if (scoreController == null)
            Debug.LogWarning("ScoreController를 찾을 수 없습니다!");
        if (timerController == null)
            Debug.LogWarning("TimerController를 찾을 수 없습니다!");
    }
    
    void CreatePlayerInfoUI()
    {
        // QuizCanvas 찾기
        Canvas quizCanvas = FindFirstObjectByType<Canvas>();
        if (quizCanvas == null)
        {
            Debug.LogError("QuizCanvas를 찾을 수 없습니다!");
            return;
        }
        
        // PlayerInfoPanel 생성
        GameObject playerInfoPanel = new GameObject("PlayerInfoPanel");
        playerInfoPanel.transform.SetParent(quizCanvas.transform, false);
        
        // RectTransform 설정
        RectTransform panelRect = playerInfoPanel.AddComponent<RectTransform>();
        panelRect.anchorMin = new Vector2(0, 1);
        panelRect.anchorMax = new Vector2(0, 1);
        panelRect.pivot = new Vector2(0, 1);
        panelRect.anchoredPosition = new Vector2(20, -20);
        panelRect.sizeDelta = new Vector2(300, 80);
        
        // 배경 이미지 추가
        Image panelImage = playerInfoPanel.AddComponent<Image>();
        panelImage.color = new Color(0, 0, 0, 0.7f);
        
        // Vertical Layout Group 추가
        VerticalLayoutGroup layoutGroup = playerInfoPanel.AddComponent<VerticalLayoutGroup>();
        layoutGroup.padding = new RectOffset(10, 10, 10, 10);
        layoutGroup.spacing = 5;
        layoutGroup.childAlignment = TextAnchor.UpperLeft;
        
        // PlayerNameText 생성
        GameObject playerNameObj = new GameObject("PlayerNameText");
        playerNameObj.transform.SetParent(playerInfoPanel.transform, false);
        playerNameText = playerNameObj.AddComponent<TextMeshProUGUI>();
        playerNameText.text = "플레이어";
        playerNameText.fontSize = 16;
        playerNameText.color = Color.white;
        
        // CharacterText 생성
        GameObject characterObj = new GameObject("CharacterText");
        characterObj.transform.SetParent(playerInfoPanel.transform, false);
        characterText = characterObj.AddComponent<TextMeshProUGUI>();
        characterText.text = "캐릭터";
        characterText.fontSize = 14;
        characterText.color = Color.yellow;
    }
    
    void Update()
    {
        if (isGameActive)
        {
            UpdateTimers();
        }
    }
    
    void InitializeUI()
    {
        // 플레이어 정보 초기화
        if (playerNameText != null)
        {
            playerNameText.text = "플레이어";
        }
        
        if (characterText != null)
        {
            characterText.text = "캐릭터";
        }
    }
    
    void SetupEventListeners()
    {
        // SocketManager 이벤트 구독
        if (SocketManager.Instance != null)
        {
            SocketManager.OnQuestionReceived += OnQuestionReceived;
            SocketManager.OnScoreUpdate += OnScoreUpdate;
            SocketManager.OnGameEnd += OnGameEnd;
        }
    }
    
    void OnQuestionReceived(QuestionData question)
    {
        ShowQuestion(question);
    }
    
    void OnScoreUpdate(Dictionary<string, int> scores)
    {
        Debug.Log("점수 업데이트 수신");
        // 기존 ScoreController를 통해 점수 업데이트
        if (scoreController != null)
        {
            scoreController.SetScore(currentScore, correctAnswers, totalQuestions);
        }
    }
    
    void OnGameEnd()
    {
        Debug.Log("게임 종료 이벤트 수신");
        
        // 게임 완료 처리
        if (SocketManager.Instance != null)
        {
            SocketManager.Instance.CompleteGame();
        }
        
        // ResultScene으로 이동
        SceneManager.LoadScene("ResultScene");
    }
    
    void ShowQuestion(QuestionData question)
    {
        currentQuestion = question;
        isAnswerSubmitted = false;
        questionTimer = questionTimeLimit;
        totalQuestions++;
        isGameActive = true;
        
        // 기존 QuestionController를 통해 질문 표시
        if (questionController != null)
        {
            questionController.SetQuestion(question);
        }
        
        // 기존 AnswerController를 통해 답변 버튼 생성
        if (answerController != null)
        {
            // QuestionData를 Question으로 변환하여 QuestionEntity 생성
            Question questionObj = ScriptableObject.CreateInstance<Question>();
            questionObj.QuestionText = question.question;
            questionObj.CorrectAnswer = question.correctAnswer;
            questionObj.Explanation = question.explanation;
            questionObj.IncorrectAnswers = question.options.Where(opt => opt != question.correctAnswer).ToArray();
            
            QuestionEntity questionEntity = new QuestionEntity(questionObj);
            
            answerController.LoadAnswers(null, questionEntity);
        }
        
        Debug.Log($"질문 표시: {question.question}");
    }
    
    void UpdateTimers()
    {
        // 질문 타이머 업데이트
        if (questionTimer > 0)
        {
            questionTimer -= Time.deltaTime;
            
            // 기존 TimerController를 통해 타이머 업데이트
            if (timerController != null)
            {
                timerController.UpdateTimer(questionTimer, questionTimeLimit);
            }
            
            if (questionTimer <= 0)
            {
                OnTimeUp();
            }
        }
        
        // 게임 타이머 업데이트
        if (gameTimer < gameTimeLimit)
        {
            gameTimer += Time.deltaTime;
            
            if (gameTimer >= gameTimeLimit)
            {
                OnGameTimeUp();
            }
        }
    }
    
    void OnTimeUp()
    {
        Debug.Log("질문 시간 초과");
        
        // 시간 초과 시 자동으로 틀린 답으로 처리
        if (SocketManager.Instance != null)
        {
            SocketManager.Instance.SendAnswer(0, -1); // 틀린 답
        }
        
        // 다음 질문 대기 (서버에서 전송)
        isGameActive = false;
    }
    
    void OnGameTimeUp()
    {
        Debug.Log("게임 시간 초과");
        
        // 게임 완료 처리
        if (SocketManager.Instance != null)
        {
            SocketManager.Instance.CompleteGame();
        }
        
        // ResultScene으로 이동
        SceneManager.LoadScene("ResultScene");
    }
    
    // 답변 선택 시 호출되는 메서드 (기존 AnswerButtonController에서 호출)
    public void OnAnswerSelected(string selectedAnswer, bool isCorrect)
    {
        if (isAnswerSubmitted || currentQuestion == null) return;
        
        isAnswerSubmitted = true;
        isGameActive = false;
        
        if (isCorrect)
        {
            correctAnswers++;
            currentScore += currentQuestion.points;
        }
        
        // 서버에 답변 전송
        if (SocketManager.Instance != null)
        {
            int answerIndex = System.Array.IndexOf(currentQuestion.options, selectedAnswer);
            SocketManager.Instance.SendAnswer(answerIndex, answerIndex);
        }
        
        Debug.Log($"답변 선택: {selectedAnswer}, 정답: {isCorrect}");
        
        // 다음 질문 대기 (서버에서 전송)
        StartCoroutine(WaitForNextQuestion());
    }
    
    IEnumerator WaitForNextQuestion()
    {
        yield return new WaitForSeconds(2f); // 2초 대기
        
        // 서버에서 다음 질문을 전송할 때까지 대기
        // OnQuestionReceived에서 자동으로 처리됨
    }
    
    void OnDestroy()
    {
        // 이벤트 구독 해제
        if (SocketManager.Instance != null)
        {
            SocketManager.OnQuestionReceived -= OnQuestionReceived;
            SocketManager.OnScoreUpdate -= OnScoreUpdate;
            SocketManager.OnGameEnd -= OnGameEnd;
        }
    }
    
    // Getter 메서드들
    public int GetCurrentScore()
    {
        return currentScore;
    }
    
    public int GetCorrectAnswers()
    {
        return correctAnswers;
    }
    
    public int GetTotalQuestions()
    {
        return totalQuestions;
    }
    
    // 디버그용 메서드들
    [ContextMenu("테스트 - 질문 표시")]
    void TestShowQuestion()
    {
        QuestionData testQuestion = new QuestionData
        {
            question = "테스트 질문입니다.",
            options = new string[] { "답변 1", "답변 2", "답변 3", "답변 4" },
            correctAnswer = "답변 1",
            explanation = "테스트 설명",
            points = 10,
            timeLimit = 30
        };
        
        ShowQuestion(testQuestion);
    }
    
    [ContextMenu("테스트 - 게임 종료")]
    void TestGameEnd()
    {
        OnGameEnd();
    }
    
    [ContextMenu("테스트 - 타이머 업데이트")]
    void TestTimerUpdate()
    {
        if (timerController != null)
        {
            timerController.UpdateTimer(25f, 30f);
        }
    }
    
    [ContextMenu("테스트 - 점수 업데이트")]
    void TestScoreUpdate()
    {
        if (scoreController != null)
        {
            scoreController.SetScore(150, 3, 5);
        }
    }
    
    [ContextMenu("테스트 - 답변 선택")]
    void TestAnswerSelection()
    {
        OnAnswerSelected("답변 1", true);
    }
    
    [ContextMenu("테스트 - 전체 시스템")]
    void TestFullSystem()
    {
        Debug.Log("=== 전체 시스템 테스트 시작 ===");
        
        // 1. 컨트롤러들 찾기
        FindQuizMasterControllers();
        
        // 2. 테스트 질문 표시
        TestShowQuestion();
        
        // 3. 타이머 테스트
        TestTimerUpdate();
        
        // 4. 점수 테스트
        TestScoreUpdate();
        
        Debug.Log("=== 전체 시스템 테스트 완료 ===");
    }
    
    // 퀴즈 셀렉션을 건너뛰고 자동으로 퀴즈 시작
    IEnumerator AutoStartQuiz()
    {
        Debug.Log("=== 자동 퀴즈 시작 로직 시작 ===");
        
        // 컨트롤러들이 준비될 때까지 대기
        yield return new WaitForSeconds(1f);
        
        // 퀴즈 셀렉션 UI가 있다면 비활성화
        GameObject quizSelectionUI = GameObject.Find("QuizSelection");
        if (quizSelectionUI != null)
        {
            Debug.Log("퀴즈 셀렉션 UI 발견 - 비활성화");
            quizSelectionUI.SetActive(false);
        }
        
        // 퀴즈 컨트롤러가 있다면 비활성화
        QuizController quizController = FindFirstObjectByType<QuizController>();
        if (quizController != null)
        {
            Debug.Log("퀴즈 컨트롤러 발견 - 비활성화");
            quizController.gameObject.SetActive(false);
        }
        
        // 서버에서 퀴즈 데이터를 기다리거나 기본 퀴즈 시작
        if (SocketManager.Instance != null)
        {
            var socketManager = SocketManager.Instance;
            
            // 게임이 이미 시작되었는지 확인
            if (socketManager.IsGameStarted())
            {
                Debug.Log("게임이 이미 시작됨 - 현재 상태 유지");
            }
            else
            {
                Debug.Log("서버에서 퀴즈 데이터 대기 중...");
                // 서버에서 퀴즈가 시작되면 OnQuestionReceived 이벤트가 호출됨
            }
        }
        else
        {
            Debug.LogWarning("SocketManager가 없어 자동 퀴즈 시작 실패");
        }
        
        Debug.Log("=== 자동 퀴즈 시작 로직 완료 ===");
    }
} 