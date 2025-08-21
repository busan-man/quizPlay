using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UnityEngine.SceneManagement;

public class StudentLobbyManager : MonoBehaviour
{
    [Header("UI References")]
    public TMP_Text nicknameLabel;
    public Transform characterGrid;
    
    [Header("Character Settings")]
    public GameObject characterButtonPrefab;
    public string[] characterNames = { "캐릭터 1", "캐릭터 2", "캐릭터 3", "캐릭터 4" };
    public Sprite[] characterSprites;
    
    private int selectedCharacterIndex = -1;
    private List<Button> characterButtons = new List<Button>();
    private bool hasJoinedGame = false;
    
    void Start()
    {
        InitializeUI();
        SetupCharacterGrid();
        SetupEventListeners();
        
        // 재발 방지책: 씬 전환 후 지연 실행으로 JavaScript 함수 재등록 대기
        StartCoroutine(DelayedInitialization());
    }
    
    // 재발 방지책: 씬 전환 후 안전한 초기화
    IEnumerator DelayedInitialization()
    {
        // 재발 방지책: 씬 전환 완료 대기 시간 증가 (3초)
        yield return new WaitForSeconds(3f);
        
        // SocketManager에서 받은 정보로 UI 초기화
        if (SocketManager.Instance != null)
        {
            nicknameLabel.text = SocketManager.Instance.CurrentNickname;
            Debug.Log("StudentLobbyManager 초기화 완료 - JavaScript 함수 재등록 대기 완료 (3초)");
        }
        else
        {
            Debug.LogWarning("SocketManager가 null입니다 - 추가 대기 후 재시도");
            yield return new WaitForSeconds(1f);
            
            if (SocketManager.Instance != null)
            {
                nicknameLabel.text = SocketManager.Instance.CurrentNickname;
                Debug.Log("StudentLobbyManager 초기화 완료 - 추가 대기 후 성공");
            }
        }
    }
    
    void InitializeUI()
    {
        // 닉네임 라벨 초기화
        if (nicknameLabel == null)
        {
            Debug.LogError("NicknameLabel이 할당되지 않았습니다!");
            return;
        }
    }
    
    void SetupCharacterGrid()
    {
        if (characterGrid == null)
        {
            Debug.LogError("CharacterGrid가 할당되지 않았습니다!");
            return;
        }
        
        // 기존 캐릭터 버튼들 제거
        foreach (Transform child in characterGrid)
        {
            Destroy(child.gameObject);
        }
        characterButtons.Clear();
        
        // 캐릭터 버튼들 생성
        for (int i = 0; i < characterNames.Length; i++)
        {
            GameObject buttonObj = Instantiate(characterButtonPrefab, characterGrid);
            Button button = buttonObj.GetComponent<Button>();
            TMP_Text buttonText = buttonObj.GetComponentInChildren<TMP_Text>();
            Image buttonImage = buttonObj.GetComponent<Image>();
            
            if (buttonText != null)
            {
                buttonText.text = characterNames[i];
            }
            
            if (buttonImage != null && i < characterSprites.Length)
            {
                buttonImage.sprite = characterSprites[i];
            }
            
            int characterIndex = i; // 클로저를 위한 로컬 변수
            button.onClick.AddListener(() => OnCharacterSelected(characterIndex));
            
            characterButtons.Add(button);
        }
    }
    
    void SetupEventListeners()
    {
        // SocketManager 이벤트 구독
        if (SocketManager.Instance != null)
        {
            SocketManager.OnStart += OnGameStart;
        }
    }
    
    void OnCharacterSelected(int characterIndex)
    {
        // 이미 게임에 참가했다면 캐릭터 변경만
        if (hasJoinedGame)
        {
            // 이전 선택 해제
            if (selectedCharacterIndex >= 0 && selectedCharacterIndex < characterButtons.Count)
            {
                characterButtons[selectedCharacterIndex].interactable = true;
            }
            
            // 새 선택
            selectedCharacterIndex = characterIndex;
            characterButtons[characterIndex].interactable = false;
            
            // 서버에 캐릭터 변경 요청
            if (SocketManager.Instance != null)
            {
                SocketManager.Instance.SendJoin(selectedCharacterIndex);
            }
            
            Debug.Log($"캐릭터 변경: {characterNames[characterIndex]} (인덱스: {characterIndex})");
            return;
        }
        
        // 이전 선택 해제
        if (selectedCharacterIndex >= 0 && selectedCharacterIndex < characterButtons.Count)
        {
            characterButtons[selectedCharacterIndex].interactable = true;
        }
        
        // 새 선택
        selectedCharacterIndex = characterIndex;
        characterButtons[characterIndex].interactable = false;
        
        // 자동으로 게임 참가
        if (SocketManager.Instance != null)
        {
            hasJoinedGame = true;
            SocketManager.Instance.SendJoin(selectedCharacterIndex);
            
            Debug.Log($"캐릭터 선택 및 게임 참가: {characterNames[characterIndex]} (인덱스: {characterIndex})");
            
            // 참가 중 상태 표시
            StartCoroutine(ShowJoiningState());
        }
    }
    
    IEnumerator ShowJoiningState()
    {
        // 닉네임 라벨에 참가 중 상태 표시
        if (nicknameLabel != null)
        {
            string originalText = nicknameLabel.text;
            nicknameLabel.text = $"{originalText} - 참가 중...";
            
            yield return new WaitForSeconds(2f);
            
            // 참가 완료 상태로 변경
            nicknameLabel.text = $"{originalText} - 대기 중";
        }
    }
    
    public void OnGameStart()
    {
        Debug.Log("게임 시작 이벤트 수신 - GameScene으로 이동");
        
        // GameScene으로 씬 전환
        SceneManager.LoadScene("GameScene");
    }
    
    void OnDestroy()
    {
        // 이벤트 구독 해제
        if (SocketManager.Instance != null)
        {
            SocketManager.OnStart -= OnGameStart;
        }
    }
    
    // 디버그용 메서드
    [ContextMenu("테스트 - 캐릭터 0 선택")]
    void TestSelectCharacter0()
    {
        OnCharacterSelected(0);
    }
    
    [ContextMenu("테스트 - 게임 시작")]
    void TestGameStart()
    {
        OnGameStart();
    }
    
    [ContextMenu("테스트 - 게임 참가")]
    void TestJoinGame()
    {
        if (selectedCharacterIndex >= 0)
        {
            JoinGame();
        }
        else
        {
            Debug.LogWarning("캐릭터를 선택해주세요!");
        }
    }
    
    private void JoinGame()
    {
        if (SocketManager.Instance == null)
        {
            Debug.LogError("SocketManager가 null입니다!");
            return;
        }
        
        hasJoinedGame = true;
        SocketManager.Instance.SendJoin(selectedCharacterIndex);
        StartCoroutine(ShowJoiningState());
        
        Debug.Log($"JoinGame 호출: 캐릭터 인덱스 {selectedCharacterIndex}");
    }
    
    // SocketManager에서 호출하는 메서드
    public void RefreshUI()
    {
        Debug.Log("StudentLobbyManager RefreshUI 호출됨");
        
        // UI 상태 새로고침
        UpdateCharacterSelection();
        
        // 게임 참가 상태 확인
        if (SocketManager.Instance != null)
        {
            // 현재 게임 상태 확인
            SocketManager.Instance.RequestGameState();
        }
        
        Debug.Log("StudentLobbyManager UI 새로고침 완료");
    }
    
    private void UpdateCharacterSelection()
    {
        // 캐릭터 선택 상태 업데이트
        for (int i = 0; i < characterButtons.Count; i++)
        {
            if (characterButtons[i] != null)
            {
                bool isSelected = (i == selectedCharacterIndex);
                characterButtons[i].interactable = !hasJoinedGame;
                
                // 선택된 캐릭터 시각적 표시
                ColorBlock colors = characterButtons[i].colors;
                colors.normalColor = isSelected ? Color.green : Color.white;
                characterButtons[i].colors = colors;
            }
        }
    }
} 