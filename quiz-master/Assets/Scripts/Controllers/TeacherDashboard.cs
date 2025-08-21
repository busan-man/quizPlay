using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UnityEngine.SceneManagement;
using System.Linq;

[System.Serializable]
public class PlayerScore
{
    public string playerId;
    public string playerName;
    public string characterId;
    public int score;
    public int correctAnswers;
    public int totalAnswers;
    public bool isOnline;
}

[System.Serializable]
public class EventLog
{
    public string playerName;
    public string action;
    public string result;
    public float timestamp;
}

public class TeacherDashboard : MonoBehaviour
{
    [Header("UI References")]
    public TMP_Text gameCodeLabel;
    public Transform leaderboardContent;
    public Transform eventFeedContent;
    public TMP_Text playerCountText;
    public TMP_Text gameTimeText;
    public Button endGameButton;
    
    [Header("Prefabs")]
    public GameObject playerListItemPrefab;
    public GameObject eventLogItemPrefab;
    
    [Header("Game Settings")]
    public float gameTimeLimit = 300f; // 5분
    
    private Dictionary<string, PlayerScore> players = new Dictionary<string, PlayerScore>();
    private List<EventLog> eventLogs = new List<EventLog>();
    private float gameTimer = 0f;
    private bool isGameActive = false;
    private string currentGameCode = "";
    
    void Start()
    {
        InitializeUI();
        SetupEventListeners();
        
        // SocketManager에서 게임 정보 가져오기
        if (SocketManager.Instance != null)
        {
            var gameData = SocketManager.Instance.GetCurrentGameData();
            if (gameData != null)
            {
                currentGameCode = gameData.gameCode;
                gameCodeLabel.text = $"게임 코드: {currentGameCode}";
                
                // 게임 설정 적용
                if (gameData.gameConfig != null)
                {
                    if (gameData.gameConfig.gameMode == "time")
                    {
                        gameTimeLimit = gameData.gameConfig.timeLimit * 60f; // 분을 초로 변환
                    }
                }
            }
        }
        
        // 게임 시작
        isGameActive = true;
        AddEventLog("시스템", "게임 시작", "게임이 시작되었습니다.");
    }
    
    void Update()
    {
        if (isGameActive)
        {
            UpdateGameTimer();
        }
    }
    
    void InitializeUI()
    {
        // 게임 코드 라벨 초기화
        if (gameCodeLabel == null)
        {
            Debug.LogError("GameCodeLabel이 할당되지 않았습니다!");
            return;
        }
        
        gameCodeLabel.text = "게임 코드: 로딩 중...";
        
        // 플레이어 수 텍스트 초기화
        if (playerCountText == null)
        {
            Debug.LogError("PlayerCountText가 할당되지 않았습니다!");
            return;
        }
        
        playerCountText.text = "참가자: 0명";
        
        // 게임 시간 텍스트 초기화
        if (gameTimeText == null)
        {
            Debug.LogError("GameTimeText가 할당되지 않았습니다!");
            return;
        }
        
        gameTimeText.text = "00:00";
        
        // 게임 종료 버튼 초기화
        if (endGameButton == null)
        {
            Debug.LogError("EndGameButton이 할당되지 않았습니다!");
            return;
        }
        
        endGameButton.interactable = true;
        TMP_Text endGameButtonText = endGameButton.GetComponentInChildren<TMP_Text>();
        if (endGameButtonText != null)
        {
            endGameButtonText.text = "게임 종료";
        }
        
        // 리더보드와 이벤트 피드 초기화
        ClearLeaderboard();
        ClearEventFeed();
    }
    
    void SetupEventListeners()
    {
        // 게임 종료 버튼 이벤트
        if (endGameButton != null)
        {
            endGameButton.onClick.AddListener(OnEndGameButtonClicked);
        }
        
        // SocketManager 이벤트 구독
        if (SocketManager.Instance != null)
        {
            SocketManager.OnScoreUpdate += OnScoreUpdate;
            SocketManager.OnGameEnd += OnGameEnd;
            SocketManager.OnScoreboard += OnScoreboard;
        }
    }
    
    void OnScoreUpdate(Dictionary<string, int> scores)
    {
        // 점수 업데이트 처리
        foreach (var scoreEntry in scores)
        {
            if (players.ContainsKey(scoreEntry.Key))
            {
                players[scoreEntry.Key].score = scoreEntry.Value;
            }
        }
        
        UpdateLeaderboard();
    }
    
    void OnScoreboard()
    {
        // 점수판 업데이트 이벤트
        Debug.Log("점수판 업데이트 이벤트 수신");
        UpdateLeaderboard();
    }
    
    void OnGameEnd()
    {
        Debug.Log("게임 종료 이벤트 수신");
        
        // 게임 종료 처리
        isGameActive = false;
        AddEventLog("시스템", "게임 종료", "게임이 종료되었습니다.");
        
        // 게임 종료 버튼 비활성화
        if (endGameButton != null)
        {
            endGameButton.interactable = false;
            TMP_Text endGameButtonText = endGameButton.GetComponentInChildren<TMP_Text>();
            if (endGameButtonText != null)
            {
                endGameButtonText.text = "게임 종료됨";
            }
        }
        
        // ResultScene으로 이동
        SceneManager.LoadScene("ResultScene");
    }
    
    // 게임 종료 버튼 클릭 핸들러
    void OnEndGameButtonClicked()
    {
        if (!isGameActive)
        {
            Debug.LogWarning("게임이 이미 종료되었습니다!");
            return;
        }
        
        // 확인 다이얼로그 표시 (선택사항)
        Debug.Log("게임 종료 확인: 정말로 게임을 종료하시겠습니까?");
        
        // 강제 게임 종료
        ForceEndGame();
    }
    
    // 강제 게임 종료 메서드
    public void ForceEndGame()
    {
        if (!isGameActive)
        {
            Debug.LogWarning("게임이 이미 종료되었습니다!");
            return;
        }
        
        Debug.Log("강제 게임 종료 실행");
        
        // 게임 종료 버튼 비활성화
        if (endGameButton != null)
        {
            endGameButton.interactable = false;
            TMP_Text endGameButtonText = endGameButton.GetComponentInChildren<TMP_Text>();
            if (endGameButtonText != null)
            {
                endGameButtonText.text = "종료 중...";
            }
        }
        
        // 서버에 게임 종료 요청
        if (SocketManager.Instance != null)
        {
            SocketManager.Instance.SendMessageToWeb("forceEndGame", "");
        }
        
        // 이벤트 로그 추가
        AddEventLog("선생님", "게임 종료", "강제로 게임을 종료했습니다.");
        
        // 잠시 후 게임 종료 처리
        StartCoroutine(DelayedGameEnd());
    }
    
    IEnumerator DelayedGameEnd()
    {
        yield return new WaitForSeconds(2f); // 2초 대기
        
        // 게임 종료 처리
        isGameActive = false;
        
        // ResultScene으로 이동
        SceneManager.LoadScene("ResultScene");
    }
    
    void UpdateGameTimer()
    {
        if (gameTimer < gameTimeLimit)
        {
            gameTimer += Time.deltaTime;
            
            if (gameTimeText != null)
            {
                float remainingTime = gameTimeLimit - gameTimer;
                int minutes = Mathf.FloorToInt(remainingTime / 60f);
                int seconds = Mathf.FloorToInt(remainingTime % 60f);
                gameTimeText.text = string.Format("{0:00}:{1:00}", minutes, seconds);
            }
            
            // 시간 초과 시 게임 종료
            if (gameTimer >= gameTimeLimit)
            {
                OnGameTimeUp();
            }
        }
    }
    
    void OnGameTimeUp()
    {
        Debug.Log("게임 시간 초과");
        AddEventLog("시스템", "시간 초과", "게임 시간이 종료되었습니다.");
        
        // 게임 종료
        if (SocketManager.Instance != null)
        {
            // 게임 종료 이벤트 발생
        }
    }
    
    // 플레이어 추가/업데이트
    public void UpdatePlayer(string playerId, string playerName, string characterId, int score = 0)
    {
        if (players.ContainsKey(playerId))
        {
            // 기존 플레이어 업데이트
            players[playerId].playerName = playerName;
            players[playerId].characterId = characterId;
            players[playerId].score = score;
            players[playerId].isOnline = true;
        }
        else
        {
            // 새 플레이어 추가
            PlayerScore newPlayer = new PlayerScore
            {
                playerId = playerId,
                playerName = playerName,
                characterId = characterId,
                score = score,
                correctAnswers = 0,
                totalAnswers = 0,
                isOnline = true
            };
            
            players[playerId] = newPlayer;
            AddEventLog(playerName, "참가", "게임에 참가했습니다.");
        }
        
        UpdateLeaderboard();
        UpdatePlayerCount();
    }
    
    // 플레이어 답변 업데이트
    public void UpdatePlayerAnswer(string playerId, bool isCorrect, int points)
    {
        if (players.ContainsKey(playerId))
        {
            players[playerId].totalAnswers++;
            if (isCorrect)
            {
                players[playerId].correctAnswers++;
            }
            
            string result = isCorrect ? "정답" : "오답";
            AddEventLog(players[playerId].playerName, "답변", $"{result} (+{points}점)");
        }
    }
    
    // 플레이어 제거
    public void RemovePlayer(string playerId)
    {
        if (players.ContainsKey(playerId))
        {
            string playerName = players[playerId].playerName;
            players.Remove(playerId);
            
            AddEventLog(playerName, "퇴장", "게임에서 나갔습니다.");
            UpdateLeaderboard();
            UpdatePlayerCount();
        }
    }
    
    // 리더보드 업데이트
    void UpdateLeaderboard()
    {
        ClearLeaderboard();
        
        // 점수순으로 정렬
        var sortedPlayers = players.Values
            .OrderByDescending(p => p.score)
            .ThenBy(p => p.playerName)
            .ToList();
        
        // 리더보드 아이템 생성
        for (int i = 0; i < sortedPlayers.Count; i++)
        {
            var player = sortedPlayers[i];
            
            if (playerListItemPrefab != null && leaderboardContent != null)
            {
                GameObject itemObj = Instantiate(playerListItemPrefab, leaderboardContent);
                
                // UI 요소들 찾기
                TMP_Text rankText = itemObj.transform.Find("RankText")?.GetComponent<TMP_Text>();
                TMP_Text nameText = itemObj.transform.Find("NameText")?.GetComponent<TMP_Text>();
                TMP_Text scoreText = itemObj.transform.Find("ScoreText")?.GetComponent<TMP_Text>();
                TMP_Text accuracyText = itemObj.transform.Find("AccuracyText")?.GetComponent<TMP_Text>();
                Image statusImage = itemObj.transform.Find("StatusImage")?.GetComponent<Image>();
                
                // 데이터 설정
                if (rankText != null)
                {
                    rankText.text = $"#{i + 1}";
                }
                
                if (nameText != null)
                {
                    nameText.text = player.playerName;
                }
                
                if (scoreText != null)
                {
                    scoreText.text = $"{player.score}점";
                }
                
                if (accuracyText != null)
                {
                    float accuracy = player.totalAnswers > 0 ? 
                        (float)player.correctAnswers / player.totalAnswers * 100f : 0f;
                    accuracyText.text = $"{accuracy:F1}%";
                }
                
                if (statusImage != null)
                {
                    statusImage.color = player.isOnline ? Color.green : Color.gray;
                }
            }
        }
    }
    
    // 이벤트 로그 추가
    void AddEventLog(string playerName, string action, string result)
    {
        EventLog log = new EventLog
        {
            playerName = playerName,
            action = action,
            result = result,
            timestamp = Time.time
        };
        
        eventLogs.Add(log);
        
        // 최대 50개까지만 유지
        if (eventLogs.Count > 50)
        {
            eventLogs.RemoveAt(0);
        }
        
        UpdateEventFeed();
    }
    
    // 이벤트 피드 업데이트
    void UpdateEventFeed()
    {
        ClearEventFeed();
        
        // 최신 이벤트부터 표시 (최대 20개)
        var recentLogs = eventLogs
            .OrderByDescending(log => log.timestamp)
            .Take(20)
            .Reverse()
            .ToList();
        
        foreach (var log in recentLogs)
        {
            if (eventLogItemPrefab != null && eventFeedContent != null)
            {
                GameObject itemObj = Instantiate(eventLogItemPrefab, eventFeedContent);
                
                // UI 요소들 찾기
                TMP_Text timeText = itemObj.transform.Find("TimeText")?.GetComponent<TMP_Text>();
                TMP_Text playerText = itemObj.transform.Find("PlayerText")?.GetComponent<TMP_Text>();
                TMP_Text actionText = itemObj.transform.Find("ActionText")?.GetComponent<TMP_Text>();
                TMP_Text resultText = itemObj.transform.Find("ResultText")?.GetComponent<TMP_Text>();
                
                // 데이터 설정
                if (timeText != null)
                {
                    float timeSinceStart = Time.time - log.timestamp;
                    timeText.text = $"{timeSinceStart:F1}s";
                }
                
                if (playerText != null)
                {
                    playerText.text = log.playerName;
                }
                
                if (actionText != null)
                {
                    actionText.text = log.action;
                }
                
                if (resultText != null)
                {
                    resultText.text = log.result;
                }
            }
        }
    }
    
    // 플레이어 수 업데이트
    void UpdatePlayerCount()
    {
        if (playerCountText != null)
        {
            int onlineCount = players.Values.Count(p => p.isOnline);
            playerCountText.text = $"플레이어: {onlineCount}명";
        }
    }
    
    // 리더보드 클리어
    void ClearLeaderboard()
    {
        if (leaderboardContent != null)
        {
            foreach (Transform child in leaderboardContent)
            {
                Destroy(child.gameObject);
            }
        }
    }
    
    // 이벤트 피드 클리어
    void ClearEventFeed()
    {
        if (eventFeedContent != null)
        {
            foreach (Transform child in eventFeedContent)
            {
                Destroy(child.gameObject);
            }
        }
    }
    
    void OnDestroy()
    {
        // 이벤트 구독 해제
        if (SocketManager.Instance != null)
        {
            SocketManager.OnScoreUpdate -= OnScoreUpdate;
            SocketManager.OnGameEnd -= OnGameEnd;
            SocketManager.OnScoreboard -= OnScoreboard;
        }
    }
    
    // 현재 게임 상태 반환
    public Dictionary<string, PlayerScore> GetPlayers()
    {
        return new Dictionary<string, PlayerScore>(players);
    }
    
    public List<EventLog> GetEventLogs()
    {
        return new List<EventLog>(eventLogs);
    }
    
    public float GetGameTime()
    {
        return gameTimer;
    }
    
    // 디버그용 메서드들
    [ContextMenu("테스트 - 플레이어 추가")]
    void TestAddPlayer()
    {
        UpdatePlayer("test1", "테스트플레이어1", "1", 100);
        UpdatePlayer("test2", "테스트플레이어2", "2", 85);
        UpdatePlayer("test3", "테스트플레이어3", "3", 120);
    }
    
    [ContextMenu("테스트 - 답변 이벤트")]
    void TestAnswerEvent()
    {
        UpdatePlayerAnswer("test1", true, 10);
        UpdatePlayerAnswer("test2", false, 0);
    }
    
    [ContextMenu("테스트 - 게임 종료")]
    void TestGameEnd()
    {
        OnGameEnd();
    }
    
    [ContextMenu("테스트 - 강제 게임 종료")]
    void TestForceEndGame()
    {
        ForceEndGame();
    }
} 