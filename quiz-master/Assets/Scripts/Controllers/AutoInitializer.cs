using System.Collections;
using UnityEngine;

/// <summary>
/// 게임 시작 시 필요한 매니저들을 자동으로 초기화하는 컨트롤러
/// </summary>
public class AutoInitializer : MonoBehaviour
{
    [Header("Debug Settings")]
    [SerializeField] private bool debugMode = true;
    
    [Header("Auto Initialize Settings")]
    [SerializeField] private bool autoInitialize = true;
    
    [Header("Manager References")]
    [SerializeField] private GameObject gameStateManagerPrefab;
    [SerializeField] private GameObject socketManagerPrefab;
    [SerializeField] private GameObject webCommunicationPrefab;
    
    private void Awake()
    {
        if (debugMode)
        {
            Debug.Log("=== AutoInitializer 시작 ===");
        }
        
        // DontDestroyOnLoad 설정
        DontDestroyOnLoad(gameObject);
        
        if (autoInitialize)
        {
            StartCoroutine(InitializeManagers());
        }
    }
    
    private IEnumerator InitializeManagers()
    {
        if (debugMode)
        {
            Debug.Log("필수 매니저들 초기화 시작");
        }
        
        // GameStateManager 확인 및 생성
        if (FindFirstObjectByType<GameStateManager>() == null)
        {
            if (gameStateManagerPrefab != null)
            {
                Instantiate(gameStateManagerPrefab);
                if (debugMode) Debug.Log("GameStateManager 생성됨");
            }
            else
            {
                var go = new GameObject("GameStateManager");
                go.AddComponent<GameStateManager>();
                if (debugMode) Debug.Log("GameStateManager 동적 생성됨");
            }
        }
        
        yield return new WaitForSeconds(0.1f);
        
        // SocketManager 확인 및 생성
        if (FindFirstObjectByType<SocketManager>() == null)
        {
            if (socketManagerPrefab != null)
            {
                Instantiate(socketManagerPrefab);
                if (debugMode) Debug.Log("SocketManager 생성됨");
            }
            else
            {
                var go = new GameObject("SocketManager");
                go.AddComponent<SocketManager>();
                if (debugMode) Debug.Log("SocketManager 동적 생성됨");
            }
        }
        
        yield return new WaitForSeconds(0.1f);
        
        // WebCommunicationController 확인 및 생성
        if (FindFirstObjectByType<WebCommunicationController>() == null)
        {
            if (webCommunicationPrefab != null)
            {
                Instantiate(webCommunicationPrefab);
                if (debugMode) Debug.Log("WebCommunicationController 생성됨");
            }
            else
            {
                var go = new GameObject("WebCommunicationController");
                go.AddComponent<WebCommunicationController>();
                if (debugMode) Debug.Log("WebCommunicationController 동적 생성됨");
            }
        }
        
        if (debugMode)
        {
            Debug.Log("=== AutoInitializer 초기화 완료 ===");
        }
    }
    
    private void Start()
    {
        if (debugMode)
        {
            Debug.Log("AutoInitializer Start 호출됨");
            
            // 현재 씬의 매니저 상태 확인
            var gameState = FindFirstObjectByType<GameStateManager>();
            var socket = FindFirstObjectByType<SocketManager>();
            var webComm = FindFirstObjectByType<WebCommunicationController>();
            
            Debug.Log($"매니저 상태 - GameState: {gameState != null}, Socket: {socket != null}, WebComm: {webComm != null}");
        }
    }
}

