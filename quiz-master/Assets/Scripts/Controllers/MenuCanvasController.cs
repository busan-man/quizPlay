using System.Collections;
using UnityEngine;
using UnityEngine.Events;

/// <summary>
/// 메뉴 캔버스를 제어하는 컨트롤러
/// 게임 시작 이벤트를 처리하고 UI 상태를 관리합니다.
/// </summary>
public class MenuCanvasController : MonoBehaviour
{
    [Header("Events")]
    public UnityEvent OnGameStarted;
    
    [Header("UI References")]
    [SerializeField] private GameObject menuPanel;
    [SerializeField] private GameObject gamePanel;
    
    [Header("Debug")]
    [SerializeField] private bool debugMode = true;
    
    private void Start()
    {
        if (debugMode)
        {
            Debug.Log("MenuCanvasController 초기화됨");
        }
        
        // 게임 상태에 따라 초기 UI 설정
        SetMenuVisible(true);
        SetGameVisible(false);
    }
    
    /// <summary>
    /// 게임 시작 시 호출되는 메서드
    /// </summary>
    public void StartGame()
    {
        if (debugMode)
        {
            Debug.Log("MenuCanvasController: 게임 시작됨");
        }
        
        // UI 상태 변경
        SetMenuVisible(false);
        SetGameVisible(true);
        
        // 이벤트 발생
        OnGameStarted?.Invoke();
    }
    
    /// <summary>
    /// 게임 종료 시 호출되는 메서드
    /// </summary>
    public void EndGame()
    {
        if (debugMode)
        {
            Debug.Log("MenuCanvasController: 게임 종료됨");
        }
        
        // UI 상태 변경
        SetMenuVisible(true);
        SetGameVisible(false);
    }
    
    /// <summary>
    /// 메뉴 패널 표시/숨김
    /// </summary>
    /// <param name="visible">표시 여부</param>
    private void SetMenuVisible(bool visible)
    {
        if (menuPanel != null)
        {
            menuPanel.SetActive(visible);
        }
    }
    
    /// <summary>
    /// 게임 패널 표시/숨김
    /// </summary>
    /// <param name="visible">표시 여부</param>
    private void SetGameVisible(bool visible)
    {
        if (gamePanel != null)
        {
            gamePanel.SetActive(visible);
        }
    }
    
    /// <summary>
    /// 외부에서 게임 시작을 트리거하는 메서드
    /// </summary>
    public void TriggerGameStart()
    {
        StartGame();
    }
    
    /// <summary>
    /// 외부에서 게임 종료를 트리거하는 메서드
    /// </summary>
    public void TriggerGameEnd()
    {
        EndGame();
    }
}

