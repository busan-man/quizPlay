using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UnityEngine.SceneManagement;
using System.Linq;

public class TeacherLobbyManager : MonoBehaviour
{
    [Header("1단계 UI - 게임 설정")]
    public GameObject gameSettingsPanel;
    public TMP_Dropdown modeDropdown;
    public TMP_InputField limitInput;
    public Button hostButton;
    public TMP_Text nicknameLabel;
    public TMP_Text instructionsText;
    
    [Header("2단계 UI - 호스팅")]
    public GameObject hostingPanel;
    public TMP_Text gameCodeLabel;
    public Button startGameButton;
    public TMP_Text playerCountText;
    public TMP_Text statusText;
    public Transform studentListContent;
    
    [Header("Prefabs")]
    public GameObject studentListItemPrefab;
    
    [Header("Game Settings")]
    public string[] modeOptions = { "Time", "Score" };
    
    private string selectedMode = "Time";
    private int gameLimit = 5;
    private bool isHosting = false;
    private int connectedPlayers = 0;
    private string currentGameCode = "";
    private List<GameObject> studentListItems = new List<GameObject>();
    private Dictionary<string, GameObject> playerIdToItemMap = new Dictionary<string, GameObject>(); // 플레이어 ID와 UI 아이템 매핑
    private bool canStartGame = false; // 수동 버튼 클릭만 허용하는 플래그
    private bool isInitialized = false; // 초기화 완료 플래그
    
    // 초기화 완료 상태를 외부에서 확인할 수 있는 프로퍼티
    public bool IsInitialized => isInitialized;
    
    void Start()
    {
        InitializeUI();
        SetupEventListeners();
        
        // 씬 로드 시 플레이어 목록 완전 초기화 (이전 데이터 정리)
        ClearStudentList();
        
        // 재발 방지책: 씬 전환 후 지연 실행으로 JavaScript 함수 재등록 대기
        StartCoroutine(DelayedInitialization());
    }
    
    // 재발 방지책: 씬 전환 후 안전한 초기화 (통합 해결책)
    IEnumerator DelayedInitialization()
    {
        // 재발 방지책: 씬 전환 완료 대기 시간 단축 (3초 → 1.5초)
        yield return new WaitForSeconds(1.5f);
        
        // 재발 방지책: SocketManager 재확인
        if (SocketManager.Instance != null)
        {
            nicknameLabel.text = SocketManager.Instance.CurrentNickname;
            Debug.Log("TeacherLobbyManager 초기화 완료 - JavaScript 함수 재등록 대기 완료 (1.5초)");
        }
        else
        {
            Debug.LogWarning("SocketManager가 null입니다 - 추가 대기 후 재시도");
            yield return new WaitForSeconds(0.5f);
            
            if (SocketManager.Instance != null)
            {
                nicknameLabel.text = SocketManager.Instance.CurrentNickname;
                Debug.Log("TeacherLobbyManager 초기화 완료 - 추가 대기 후 성공");
            }
        }
        
        // 초기화 완료 플래그 설정
        isInitialized = true;
        Debug.Log("TeacherLobbyManager 초기화 완료 - 플레이어 이벤트 처리 준비됨");
        
        // 초기화 완료 후 큐에 저장된 이벤트들 플러시 시도
        if (SocketManager.Instance != null)
        {
            SocketManager.Instance.TryFlushLobbyQueues();
        }
        
        // 추가 안전장치: 3초 후 플레이어 목록 재정리
        yield return new WaitForSeconds(3f);
        Debug.Log("안전장치: 플레이어 목록 재정리 실행");
        ClearStudentList();
        
        // 추가 안전장치: 10초 후 한 번 더 정리
        yield return new WaitForSeconds(7f);
        Debug.Log("최종 안전장치: 플레이어 목록 최종 정리 실행");
        ClearStudentList();
    }
    
    void InitializeUI()
    {
        // 1단계 UI 초기화
        if (gameSettingsPanel == null)
        {
            Debug.LogError("GameSettingsPanel이 할당되지 않았습니다!");
            return;
        }
        
        if (hostingPanel == null)
        {
            Debug.LogError("HostingPanel이 할당되지 않았습니다!");
            return;
        }
        
        // 초기 상태: 게임 설정 패널만 표시
        gameSettingsPanel.SetActive(true);
        hostingPanel.SetActive(false);
        
        // 모드 드롭다운 설정
        if (modeDropdown != null)
        {
            modeDropdown.ClearOptions();
            modeDropdown.AddOptions(new List<string>(modeOptions));
            modeDropdown.value = 0;
        }
        
        // 제한값 입력 필드 설정
        if (limitInput != null)
        {
            limitInput.text = "5";
            limitInput.placeholder.GetComponent<TMP_Text>().text = "Enter time (minutes) or score";
        }
        
        // 호스트 버튼 초기화
        if (hostButton != null)
        {
            hostButton.interactable = true;
            TMP_Text hostButtonText = hostButton.GetComponentInChildren<TMP_Text>();
            if (hostButtonText != null)
            {
                hostButtonText.text = "Start Hosting";
            }
        }
        
        // 게임 시작 버튼 초기화
        if (startGameButton != null)
        {
            startGameButton.interactable = false;
            TMP_Text startButtonText = startGameButton.GetComponentInChildren<TMP_Text>();
            if (startButtonText != null)
            {
                startButtonText.text = "Start Game";
            }
        }
        
        // 상태 텍스트 초기화
        if (statusText != null)
        {
            statusText.text = "Complete game settings and start hosting.";
        }
        
        if (playerCountText != null)
        {
            playerCountText.text = "Players: 0";
        }
        
        // 게임 코드 라벨 초기화
        if (gameCodeLabel != null)
        {
            gameCodeLabel.text = "Game Code: Loading...";
        }
        
        // 학생 목록 초기화
        ClearStudentList();
    }
    
    void SetupEventListeners()
    {
        Debug.Log("SetupEventListeners 시작");
        
        // 드롭다운 이벤트
        if (modeDropdown != null)
        {
            modeDropdown.onValueChanged.AddListener(OnModeChanged);
            Debug.Log("modeDropdown 이벤트 리스너 등록");
        }
        
        // 입력 필드 이벤트
        if (limitInput != null)
        {
            limitInput.onValueChanged.AddListener(OnLimitChanged);
            Debug.Log("limitInput 이벤트 리스너 등록");
        }
        
        // 호스트 버튼 이벤트
        if (hostButton != null)
        {
            hostButton.onClick.AddListener(OnHostButtonClicked);
            Debug.Log("hostButton 이벤트 리스너 등록");
        }
        
        // 게임 시작 버튼 이벤트
        if (startGameButton != null)
        {
            // 기존 리스너 모두 제거 (중복 방지)
            startGameButton.onClick.RemoveAllListeners();
            startGameButton.onClick.AddListener(OnStartGameButtonClicked);
            Debug.Log("startGameButton 이벤트 리스너 등록 (기존 리스너 제거 후)");
        }
        
        // SocketManager 이벤트 구독
        if (SocketManager.Instance != null)
        {
            SocketManager.OnStart += OnGameStart;
            Debug.Log("SocketManager.OnStart 이벤트 구독");
        }
        
        Debug.Log("SetupEventListeners 완료");
    }
    
    void OnModeChanged(int index)
    {
        selectedMode = modeOptions[index];
        
        // 모드에 따라 입력 필드 플레이스홀더 변경
        if (limitInput != null)
        {
            TMP_Text placeholder = limitInput.placeholder.GetComponent<TMP_Text>();
            if (selectedMode == "Time")
            {
                placeholder.text = "Enter time (minutes) (1-60)";
                limitInput.text = "5";
                gameLimit = 5;
            }
            else
            {
                placeholder.text = "Enter score (1-100)";
                limitInput.text = "50";
                gameLimit = 50;
            }
        }
    }
    
    void OnLimitChanged(string value)
    {
        if (int.TryParse(value, out int limit))
        {
            if (selectedMode == "Time")
            {
                // 시간 제한: 1-60분
                gameLimit = Mathf.Clamp(limit, 1, 60);
            }
            else
            {
                // 점수 제한: 1-100점
                gameLimit = Mathf.Clamp(limit, 1, 100);
            }
            
            // 입력 필드 업데이트
            if (limitInput != null)
            {
                limitInput.text = gameLimit.ToString();
            }
        }
    }
    
    void OnHostButtonClicked()
    {
        if (isHosting)
        {
            Debug.LogWarning("Already hosting!");
            return;
        }
        
        if (SocketManager.Instance == null)
        {
            Debug.LogError("SocketManager is missing!");
            return;
        }
        
        if (gameLimit <= 0)
        {
            Debug.LogWarning("Please set game limit!");
            return;
        }
        
        // 호스팅 시작
        isHosting = true;
        
        // SocketManager를 통해 방 생성 요청
        string mode = selectedMode == "Time" ? "time" : "score";
        SocketManager.Instance.EmitCreateRoom(mode, gameLimit);
        
        Debug.Log($"Room creation request: mode={mode}, limit={gameLimit}");
        
        // UI를 2단계로 변경
        SwitchToHostingUI();
        
        // 호스팅 상태 표시
        StartCoroutine(ShowHostingState());
    }
    
    public void SwitchToHostingUI()
    {
        // 1단계 UI 숨기기
        gameSettingsPanel.SetActive(false);
        
        // 2단계 UI 표시
        hostingPanel.SetActive(true);
        
        // 게임 코드 표시 (실제 코드가 있으면 우선 사용)
        if (SocketManager.Instance != null && !string.IsNullOrEmpty(SocketManager.Instance.CurrentCode))
        {
            currentGameCode = SocketManager.Instance.CurrentCode;
        }
        else
        {
            currentGameCode = GenerateGameCode();
        }
        if (gameCodeLabel != null)
        {
            gameCodeLabel.text = $"Game Code: {currentGameCode}";
        }
        
        // 상태 텍스트 업데이트
        if (statusText != null)
        {
            statusText.text = "Waiting for students to join...";
        }
        
        // 게임 시작 버튼 상태 업데이트
        UpdateStartButtonState();
    }
    
    string GenerateGameCode()
    {
        // 6자리 랜덤 코드 생성
        string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        string code = "";
        for (int i = 0; i < 6; i++)
        {
            code += chars[UnityEngine.Random.Range(0, chars.Length)];
        }
        return code;
    }
    
    public void OnStartGameButtonClicked()
    {
        Debug.Log("=== OnStartGameButtonClicked 호출됨 ===");
        Debug.Log($"호출 스택: {System.Environment.StackTrace}");
        Debug.Log($"현재 상태: isHosting={isHosting}, connectedPlayers={connectedPlayers}, canStartGame={canStartGame}");
        
        // 수동 버튼 클릭 전용 보호 (자동 호출 방지)
        if (!canStartGame)
        {
            Debug.LogWarning("자동 호출 방지: canStartGame이 false입니다!");
            return;
        }
        
        if (!isHosting)
        {
            Debug.LogWarning("Not hosting!");
            return;
        }
        
        if (connectedPlayers == 0)
        {
            Debug.LogWarning("No players joined!");
            return;
        }
        
        // 게임 시작 요청
        if (SocketManager.Instance != null)
        {
            Debug.Log("SocketManager를 통해 startGame 메시지 전송");
            SocketManager.Instance.SendMessageToWeb("startGame", "");
        }
        else
        {
            Debug.LogError("SocketManager가 null입니다!");
        }
        
        Debug.Log("Game start request 완료");
        
        // 버튼 비활성화
        startGameButton.interactable = false;
        canStartGame = false; // 중복 실행 방지
        TMP_Text startButtonText = startGameButton.GetComponentInChildren<TMP_Text>();
        if (startButtonText != null)
        {
            startButtonText.text = "Starting Game...";
        }
        
        // 게임 씬으로 전환 (수동 버튼 클릭시에만)
        StartCoroutine(TransitionToGameScene());
        Debug.Log("=== OnStartGameButtonClicked 완료 ===");
    }
    
    IEnumerator ShowHostingState()
    {
        if (hostButton != null)
        {
            TMP_Text buttonText = hostButton.GetComponentInChildren<TMP_Text>();
            if (buttonText != null)
            {
                string originalText = buttonText.text;
                buttonText.text = "Hosting...";
                
                yield return new WaitForSeconds(2f);
                
                // 호스팅 완료 상태로 변경
                buttonText.text = "Hosting Complete";
                hostButton.interactable = false;
            }
        }
    }
    
    IEnumerator TransitionToGameScene()
    {
        // 잠깐 대기 후 게임 씬으로 전환
        yield return new WaitForSeconds(1f);
        
        Debug.Log("TeacherGameScene으로 전환");
        SceneManager.LoadScene("TeacherGameScene");
    }
    
    // 학생 참가 시 호출되는 메서드 (서버에서 호출)
    public void OnPlayerJoined(string playerId, string playerName, string characterId)
    {
        // 초기화가 완료되지 않았으면 이벤트를 큐에 저장
        if (!isInitialized)
        {
            Debug.LogWarning($"OnPlayerJoined: TeacherLobbyManager가 아직 초기화되지 않음 - 이벤트 큐에 저장: {playerName}");
            // SocketManager의 큐에 저장되도록 함 (SocketManager에서 처리)
            return;
        }
        
        Debug.Log($"OnPlayerJoined 호출됨: playerId={playerId}, playerName={playerName}, characterId={characterId}");
        
        // 중복 참가 방지 (playerId 기반으로만 체크 - 서버에서 이미 이름 중복 처리됨)
        if (playerIdToItemMap.ContainsKey(playerId))
        {
            Debug.Log($"중복 참가 방지: playerId {playerId}는 이미 등록됨");
            return;
        }
        
        // 이름 기반 중복 체크는 제거 (서버에서 자동 이름 생성 처리)
        
        // 학생 목록에 추가
        AddStudentToList(playerId, playerName, characterId);
        
        // 첫 번째 참가자가 들어오면 게임 시작 버튼 활성화
        if (connectedPlayers == 1)
        {
            if (startGameButton != null)
            {
                startGameButton.interactable = true;
                canStartGame = true; // 수동 버튼 클릭 허용
                Debug.Log("시작 버튼 활성화됨 (canStartGame=true)");
            }
            else
            {
                Debug.LogError("startGameButton이 null입니다!");
            }
            
            if (statusText != null)
            {
                statusText.text = "You can start the game!";
                Debug.Log("상태 텍스트 업데이트: You can start the game!");
            }
            else
            {
                Debug.LogError("statusText가 null입니다!");
            }
        }
    }
    
    void AddStudentToList(string playerId, string playerName, string characterId)
    {
        Debug.Log($"AddStudentToList 호출됨: playerName={playerName}, characterId={characterId}");
        
        if (studentListItemPrefab != null && studentListContent != null)
        {
            GameObject itemObj = Instantiate(studentListItemPrefab, studentListContent);
            studentListItems.Add(itemObj);
            
            // 플레이어 ID와 UI 아이템 매핑 저장
            playerIdToItemMap[playerId] = itemObj;
            
            Debug.Log($"학생 리스트 아이템 생성됨: {itemObj.name} (플레이어 ID: {playerId})");
            
            // UI 요소들 찾기 (프리팹 구조에 맞게 수정)
            TMP_Text nameText = itemObj.transform.Find("NameText")?.GetComponent<TMP_Text>();
            TMP_Text characterText = itemObj.transform.Find("CharacterText")?.GetComponent<TMP_Text>();
            Image statusImage = itemObj.transform.Find("StatusImage")?.GetComponent<Image>();
            
            Debug.Log($"UI 요소 찾기 결과: nameText={nameText != null}, characterText={characterText != null}, statusImage={statusImage != null}");
            
            // 데이터 설정
            if (nameText != null)
            {
                nameText.text = playerName;
                Debug.Log($"NameText 설정됨: {playerName}");
            }
            else
            {
                Debug.LogError("NameText를 찾을 수 없음!");
            }
            
            if (characterText != null)
            {
                // characterId 처리 개선 (캐릭터 미선택 제거)
                string characterDisplay;
                if (string.IsNullOrEmpty(characterId) || characterId.Trim() == "")
                {
                    // 기본값: 랜덤 캐릭터 0-3
                    int randomChar = UnityEngine.Random.Range(0, 4);
                    characterDisplay = $"캐릭터 {randomChar}";
                    Debug.Log($"캐릭터 미선택 → 랜덤 캐릭터 {randomChar}로 설정");
                }
                else if (int.TryParse(characterId, out int charId))
                {
                    characterDisplay = $"캐릭터 {charId}";
                }
                else
                {
                    characterDisplay = $"캐릭터 {characterId}";
                }
                
                characterText.text = characterDisplay;
                Debug.Log($"CharacterText 설정됨: {characterDisplay} (원본 characterId: '{characterId}')");
            }
            else
            {
                Debug.LogError("CharacterText를 찾을 수 없음!");
            }
            
            if (statusImage != null)
            {
                statusImage.color = Color.green; // 온라인 상태
                Debug.Log("StatusImage 색상 설정됨");
            }
            else
            {
                Debug.LogError("StatusImage를 찾을 수 없음!");
            }
            
            // 연결된 플레이어 수 업데이트 (실제 리스트 개수 사용)
            connectedPlayers = studentListItems.Count;
            
            // UI 업데이트
            UpdatePlayerCount();
            UpdateStartButtonState();
            
            Debug.Log($"학생 목록에 추가됨: {playerName} (총 {connectedPlayers}명)");
        }
        else
        {
            Debug.LogError($"프리팹 또는 컨텐츠 없음: prefab={studentListItemPrefab != null}, content={studentListContent != null}");
        }
    }
    
    void ClearStudentList()
    {
        foreach (GameObject item in studentListItems)
        {
            if (item != null)
            {
                Destroy(item);
            }
        }
        studentListItems.Clear();
        playerIdToItemMap.Clear(); // 매핑도 함께 정리
        connectedPlayers = 0;
        Debug.Log("학생 목록 완전 정리됨");
    }

    // 플레이어 퇴장 처리 (실제 UI에서 제거)
    public void OnPlayerLeft(string playerId)
    {
        Debug.Log($"플레이어 퇴장 처리: {playerId}");
        
        // playerIdToItemMap에서 해당 플레이어 찾기
        if (playerIdToItemMap.TryGetValue(playerId, out GameObject itemObj))
        {
            // 리스트에서 제거
            if (studentListItems.Contains(itemObj))
            {
                studentListItems.Remove(itemObj);
                Debug.Log($"학생 리스트에서 제거됨: {playerId}");
            }
            
            // UI 오브젝트 제거
            if (itemObj != null)
            {
                Destroy(itemObj);
                Debug.Log($"UI 오브젝트 제거됨: {playerId}");
            }
            
            // 매핑에서 제거
            playerIdToItemMap.Remove(playerId);
            
            // 연결된 플레이어 수 업데이트 (실제 리스트 개수 사용)
            connectedPlayers = studentListItems.Count;
            
            // UI 업데이트
            UpdatePlayerCount();
            UpdateStartButtonState();
            
            Debug.Log($"플레이어 퇴장 완료: {playerId} (총 {connectedPlayers}명)");
        }
        else
        {
            Debug.LogWarning($"퇴장할 플레이어를 찾을 수 없음: {playerId}");
        }
    }
    
    void OnGameStart()
    {
        Debug.Log("=== OnGameStart 이벤트 수신됨 ===");
        Debug.Log($"호출 스택: {System.Environment.StackTrace}");
        Debug.Log("Game start event received - 호스팅 UI로 자동 전환");
        
        // 더 이상 자동으로 씬 전환하지 않음
        // 대신 호스팅 UI로 전환
        SwitchToHostingUI();
        
        // 사용자가 수동으로 "Start Game" 버튼을 클릭해야 TeacherGameScene으로 이동
        Debug.Log("=== OnGameStart 완료 - 자동 씬 전환 없음 ===");
    }
    
    void UpdatePlayerCount()
    {
        if (playerCountText != null)
        {
            playerCountText.text = $"Players: {connectedPlayers}";
            Debug.Log($"playerCountText 업데이트: Players: {connectedPlayers}");
        }
        else
        {
            Debug.LogError("playerCountText가 null입니다!");
        }
    }
    
    void UpdateStartButtonState()
    {
        if (startGameButton != null)
        {
            bool canStart = connectedPlayers >= 1 && canStartGame;
            startGameButton.interactable = canStart;
            Debug.Log($"시작 버튼 상태 업데이트: interactable={canStart} (플레이어: {connectedPlayers}, canStartGame: {canStartGame})");
        }
        else
        {
            Debug.LogError("startGameButton이 null입니다!");
        }
        
        if (statusText != null)
        {
            if (connectedPlayers >= 1 && canStartGame)
            {
                statusText.text = "You can start the game!";
            }
            else if (connectedPlayers == 0)
            {
                statusText.text = "Waiting for players...";
            }
            else
            {
                statusText.text = "Game in progress...";
            }
            Debug.Log($"상태 텍스트 업데이트: {statusText.text}");
        }
        else
        {
            Debug.LogError("statusText가 null입니다!");
        }
    }
    
    void OnDestroy()
    {
        // 이벤트 구독 해제
        if (SocketManager.Instance != null)
        {
            SocketManager.OnStart -= OnGameStart;
        }
    }
    
    // Getter 메서드들
    public string GetSelectedMode()
    {
        return selectedMode;
    }
    
    public int GetGameLimit()
    {
        return gameLimit;
    }
    
    public int GetConnectedPlayers()
    {
        return connectedPlayers;
    }
    
    public string GetCurrentGameCode()
    {
        return currentGameCode;
    }
    
    // 디버그용 메서드들
    [ContextMenu("테스트 - 학생 참가")]
    void TestPlayerJoined()
    {
        Debug.Log("테스트 학생 참가 실행");
        OnPlayerJoined("test1", "TestStudent1", "1");
    }
    
    [ContextMenu("강제 큐 플러시")]
    void ForceFlushQueues()
    {
        Debug.Log("강제 큐 플러시 실행");
        if (SocketManager.Instance != null)
        {
            SocketManager.Instance.ForceFlushLobbyQueues();
        }
    }
    
    [ContextMenu("테스트 - 게임 시작")]
    void TestGameStart()
    {
        OnGameStart();
    }
    
    [ContextMenu("테스트 - 호스팅 UI 전환")]
    void TestSwitchToHostingUI()
    {
        SwitchToHostingUI();
    }
    
    // PlayerData 클래스 정의
    [System.Serializable]
    public class PlayerData
    {
        public string id;
        public string name;
        public string characterId;
    }
    
    // SocketManager에서 호출하는 메서드들
    public void UpdatePlayerList(PlayerData[] players)
    {
        Debug.Log($"UpdatePlayerList 호출됨: {players?.Length ?? 0}명의 플레이어");
        
        if (players == null)
        {
            Debug.LogWarning("플레이어 데이터가 null입니다");
            return;
        }
        
        // 기존 플레이어 목록 정리
        ClearStudentList();
        
        // 새로운 플레이어들 추가
        foreach (var player in players)
        {
            if (player != null && !string.IsNullOrEmpty(player.name))
            {
                AddStudentToList(player.id, player.name, player.characterId);
            }
        }
        
        // 연결된 플레이어 수 업데이트
        connectedPlayers = players.Length;
        UpdatePlayerCount();
        UpdateStartButtonState();
        
        Debug.Log($"플레이어 목록 업데이트 완료: {connectedPlayers}명");
    }

    // 문자열 배열(이름들)만 전달되는 경우를 위한 오버로드
    public void UpdatePlayerList(string[] playerNames)
    {
        Debug.Log($"UpdatePlayerList(string[]) 호출됨: {playerNames?.Length ?? 0}명의 플레이어 이름");
        
        if (playerNames == null)
        {
            Debug.LogWarning("플레이어 이름 목록이 null입니다");
            return;
        }
        
        ClearStudentList();
        
        foreach (var name in playerNames)
        {
            if (!string.IsNullOrEmpty(name))
            {
                // 이름을 임시 ID로 사용 (중복 이름은 마지막 항목만 유지됨)
                AddStudentToList(name, name, "");
            }
        }
        
        connectedPlayers = playerNames.Length;
        UpdatePlayerCount();
        UpdateStartButtonState();
        
        Debug.Log($"플레이어 이름 기반 목록 업데이트 완료: {connectedPlayers}명");
    }

    public void RefreshUI()
    {
        Debug.Log("TeacherLobbyManager RefreshUI 호출됨");
        
        // UI 상태 새로고침
        UpdatePlayerCount();
        UpdateStartButtonState();
        
        // 플레이어 목록 새로고침 (SocketManager에서 최신 데이터를 받아서 업데이트)
        if (SocketManager.Instance != null)
        {
            SocketManager.Instance.RequestPlayerList();
        }
        
        Debug.Log("TeacherLobbyManager UI 새로고침 완료");
    }
} 