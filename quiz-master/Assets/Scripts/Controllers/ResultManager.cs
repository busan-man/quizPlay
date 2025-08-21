using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UnityEngine.SceneManagement;
using System.Linq;

[System.Serializable]
public class FinalPlayerScore
{
    public string playerId;
    public string playerName;
    public string characterId;
    public int finalScore;
    public int correctAnswers;
    public int totalQuestions;
    public float accuracy;
    public int rank;
}

public class ResultManager : MonoBehaviour
{
    [Header("UI References")]
    public GameObject myRankPanel;
    public GameObject fullRankPanel;
    
    [Header("My Rank Panel")]
    public TMP_Text myRankText;
    public TMP_Text myNameText;
    public TMP_Text myScoreText;
    public TMP_Text myCorrectAnswersText;
    public TMP_Text myAccuracyText;
    public TMP_Text myTotalQuestionsText;
    
    [Header("Full Rank Panel")]
    public Transform rankListContent;
    public TMP_Text totalPlayersText;
    public TMP_Text averageScoreText;
    public TMP_Text highestScoreText;
    public TMP_Text totalQuestionsText;
    
    [Header("Prefabs")]
    public GameObject rankListItemPrefab;
    
    [Header("Settings")]
    public float autoReturnDelay = 5f;
    
    private List<FinalPlayerScore> allPlayers = new List<FinalPlayerScore>();
    private FinalPlayerScore myResult;
    private bool isTeacher = false;
    private bool isResultShown = false;
    
    void Start()
    {
        InitializeUI();
        LoadResults();
        ShowResults();
        
        // 자동으로 로비로 돌아가기
        StartCoroutine(AutoReturnToLobby());
    }
    
    void InitializeUI()
    {
        // 패널들 초기화
        if (myRankPanel != null)
        {
            myRankPanel.SetActive(false);
        }
        
        if (fullRankPanel != null)
        {
            fullRankPanel.SetActive(false);
        }
        
        // SocketManager에서 역할 확인
        if (SocketManager.Instance != null)
        {
            isTeacher = SocketManager.Instance.IsTeacher();
        }
    }
    
    void LoadResults()
    {
        // SocketManager에서 결과 데이터 가져오기
        if (SocketManager.Instance != null)
        {
            var gameData = SocketManager.Instance.GetCurrentGameData();
            if (gameData != null)
            {
                // 실제로는 서버에서 전체 결과를 받아와야 함
                // 여기서는 임시 데이터로 시뮬레이션
                CreateSampleResults(gameData);
            }
        }
    }
    
    void CreateSampleResults(GameStartData gameData)
    {
        // 임시 샘플 데이터 생성 (실제로는 서버에서 받아옴)
        allPlayers.Clear();
        
        // 내 결과
        myResult = new FinalPlayerScore
        {
            playerId = gameData.playerName,
            playerName = gameData.playerName,
            characterId = gameData.characterId,
            finalScore = Random.Range(50, 200),
            correctAnswers = Random.Range(3, 8),
            totalQuestions = 10,
            accuracy = 0f,
            rank = 0
        };
        myResult.accuracy = (float)myResult.correctAnswers / myResult.totalQuestions * 100f;
        
        // 다른 플레이어들 결과 (임시)
        string[] sampleNames = { "김철수", "이영희", "박민수", "정수진", "최동욱" };
        for (int i = 0; i < sampleNames.Length; i++)
        {
            if (sampleNames[i] != gameData.playerName)
            {
                FinalPlayerScore player = new FinalPlayerScore
                {
                    playerId = $"player_{i}",
                    playerName = sampleNames[i],
                    characterId = Random.Range(0, 4).ToString(),
                    finalScore = Random.Range(30, 180),
                    correctAnswers = Random.Range(2, 9),
                    totalQuestions = 10,
                    accuracy = 0f,
                    rank = 0
                };
                player.accuracy = (float)player.correctAnswers / player.totalQuestions * 100f;
                allPlayers.Add(player);
            }
        }
        
        // 내 결과도 전체 목록에 추가
        allPlayers.Add(myResult);
        
        // 점수순으로 정렬하고 순위 매기기
        var sortedPlayers = allPlayers.OrderByDescending(p => p.finalScore).ToList();
        for (int i = 0; i < sortedPlayers.Count; i++)
        {
            sortedPlayers[i].rank = i + 1;
        }
        
        allPlayers = sortedPlayers;
    }
    
    void ShowResults()
    {
        if (isResultShown) return;
        
        if (isTeacher)
        {
            ShowFullRankPanel();
        }
        else
        {
            ShowMyRankPanel();
        }
        
        isResultShown = true;
    }
    
    void ShowMyRankPanel()
    {
        if (myRankPanel != null)
        {
            myRankPanel.SetActive(true);
            
            // 내 결과 정보 표시
            if (myRankText != null)
            {
                myRankText.text = $"#{myResult.rank}";
            }
            
            if (myNameText != null)
            {
                myNameText.text = myResult.playerName;
            }
            
            if (myScoreText != null)
            {
                myScoreText.text = $"{myResult.finalScore}점";
            }
            
            if (myCorrectAnswersText != null)
            {
                myCorrectAnswersText.text = $"{myResult.correctAnswers}개";
            }
            
            if (myAccuracyText != null)
            {
                myAccuracyText.text = $"{myResult.accuracy:F1}%";
            }
            
            if (myTotalQuestionsText != null)
            {
                myTotalQuestionsText.text = $"{myResult.totalQuestions}개";
            }
        }
    }
    
    void ShowFullRankPanel()
    {
        if (fullRankPanel != null)
        {
            fullRankPanel.SetActive(true);
            
            // 전체 통계 표시
            if (totalPlayersText != null)
            {
                totalPlayersText.text = $"{allPlayers.Count}명";
            }
            
            if (averageScoreText != null)
            {
                float avgScore = (float)allPlayers.Average(p => p.finalScore);
                averageScoreText.text = $"{avgScore:F1}점";
            }
            
            if (highestScoreText != null)
            {
                int maxScore = allPlayers.Max(p => p.finalScore);
                highestScoreText.text = $"{maxScore}점";
            }
            
            if (totalQuestionsText != null)
            {
                int totalQ = allPlayers.FirstOrDefault()?.totalQuestions ?? 0;
                totalQuestionsText.text = $"{totalQ}개";
            }
            
            // 순위 목록 표시
            UpdateRankList();
        }
    }
    
    void UpdateRankList()
    {
        if (rankListContent == null || rankListItemPrefab == null)
        {
            return;
        }
        
        // 기존 아이템들 제거
        foreach (Transform child in rankListContent)
        {
            Destroy(child.gameObject);
        }
        
        // 순위 목록 생성
        for (int i = 0; i < allPlayers.Count; i++)
        {
            var player = allPlayers[i];
            
            GameObject itemObj = Instantiate(rankListItemPrefab, rankListContent);
            
            // UI 요소들 찾기
            TMP_Text rankText = itemObj.transform.Find("RankText")?.GetComponent<TMP_Text>();
            TMP_Text nameText = itemObj.transform.Find("NameText")?.GetComponent<TMP_Text>();
            TMP_Text scoreText = itemObj.transform.Find("ScoreText")?.GetComponent<TMP_Text>();
            TMP_Text correctText = itemObj.transform.Find("CorrectText")?.GetComponent<TMP_Text>();
            TMP_Text accuracyText = itemObj.transform.Find("AccuracyText")?.GetComponent<TMP_Text>();
            Image backgroundImage = itemObj.GetComponent<Image>();
            
            // 데이터 설정
            if (rankText != null)
            {
                rankText.text = $"#{player.rank}";
            }
            
            if (nameText != null)
            {
                nameText.text = player.playerName;
            }
            
            if (scoreText != null)
            {
                scoreText.text = $"{player.finalScore}점";
            }
            
            if (correctText != null)
            {
                correctText.text = $"{player.correctAnswers}/{player.totalQuestions}";
            }
            
            if (accuracyText != null)
            {
                accuracyText.text = $"{player.accuracy:F1}%";
            }
            
            // 내 결과는 하이라이트
            if (backgroundImage != null && player.playerId == myResult?.playerId)
            {
                backgroundImage.color = new Color(1f, 1f, 0.8f, 0.3f); // 연한 노란색
            }
        }
    }
    
    IEnumerator AutoReturnToLobby()
    {
        yield return new WaitForSeconds(autoReturnDelay);
        
        // 로비로 돌아가기
        ReturnToLobby();
    }
    
    public void ReturnToLobby()
    {
        // 역할에 따라 적절한 로비로 이동
        if (isTeacher)
        {
            SceneManager.LoadScene("TeacherLobbyScene");
        }
        else
        {
            SceneManager.LoadScene("StudentLobbyScene");
        }
    }
    
    public void ViewAllResults()
    {
        // 전체 결과 보기 (학생용)
        if (!isTeacher && myRankPanel != null && fullRankPanel != null)
        {
            myRankPanel.SetActive(false);
            ShowFullRankPanel();
        }
    }
    
    public void PlayAgain()
    {
        // 다시 게임하기
        if (SocketManager.Instance != null)
        {
            // 같은 게임 코드로 다시 참가
            string gameCode = SocketManager.Instance.CurrentCode;
            string nickname = SocketManager.Instance.CurrentNickname;
            
            // 웹으로 다시 게임하기 요청
            var data = new Dictionary<string, string>
            {
                ["action"] = "playAgain",
                ["gameCode"] = gameCode,
                ["nickname"] = nickname
            };
            
            string jsonData = JsonUtility.ToJson(data);
            SocketManager.Instance.SendMessageToWeb("playAgain", jsonData);
        }
    }
    
    public void ShareResult()
    {
        // 결과 공유 (선택사항)
        if (myResult != null)
        {
            string shareText = $"퀴즈 게임 결과: {myResult.playerName} - {myResult.finalScore}점 (#{myResult.rank}위)";
            
            // 클립보드에 복사
            GUIUtility.systemCopyBuffer = shareText;
            
            Debug.Log("결과가 클립보드에 복사되었습니다: " + shareText);
        }
    }
    
    public void ExportResults()
    {
        // 결과 내보내기 (선생님용)
        if (isTeacher)
        {
            StartCoroutine(ExportResultsToCSV());
        }
    }
    
    IEnumerator ExportResultsToCSV()
    {
        // CSV 형식으로 결과 생성
        string csvData = "순위,이름,점수,정답수,총문제수,정확도\n";
        
        foreach (var player in allPlayers)
        {
            csvData += $"{player.rank},{player.playerName},{player.finalScore},{player.correctAnswers},{player.totalQuestions},{player.accuracy:F1}%\n";
        }
        
        // 웹으로 CSV 데이터 전송
        if (SocketManager.Instance != null)
        {
            var exportData = new Dictionary<string, string>
            {
                ["action"] = "exportResults",
                ["data"] = csvData,
                ["filename"] = $"quiz_results_{System.DateTime.Now:yyyyMMdd_HHmmss}.csv"
            };
            
            string jsonData = JsonUtility.ToJson(exportData);
            SocketManager.Instance.SendMessageToWeb("exportResults", jsonData);
        }
        
        yield return null;
    }
    
    // 현재 결과 데이터 반환
    public FinalPlayerScore GetMyResult()
    {
        return myResult;
    }
    
    public List<FinalPlayerScore> GetAllResults()
    {
        return new List<FinalPlayerScore>(allPlayers);
    }
    
    // 디버그용 메서드
    [ContextMenu("테스트 - 내 결과 패널")]
    void TestMyRankPanel()
    {
        isTeacher = false;
        ShowMyRankPanel();
    }
    
    [ContextMenu("테스트 - 전체 결과 패널")]
    void TestFullRankPanel()
    {
        isTeacher = true;
        ShowFullRankPanel();
    }
    
    [ContextMenu("테스트 - 로비로 돌아가기")]
    void TestReturnToLobby()
    {
        ReturnToLobby();
    }
} 