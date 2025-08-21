using UnityEngine;

public class AutoWebCommunicationController : MonoBehaviour
{
    [Header("Settings")]
    public bool autoCreate = true;
    public bool debugMode = true;
    
    private static AutoWebCommunicationController instance;
    private WebCommunicationController webController;
    
    void Awake()
    {
        if (debugMode)
        {
            Debug.Log("AutoWebCommunicationController Awake 호출됨");
        }
        
        if (instance == null)
        {
            instance = this;
            DontDestroyOnLoad(gameObject);
            if (debugMode)
            {
                Debug.Log("AutoWebCommunicationController 싱글톤 인스턴스 설정됨");
            }
        }
        else
        {
            if (debugMode)
            {
                Debug.Log("AutoWebCommunicationController 중복 인스턴스 제거됨");
            }
            Destroy(gameObject);
            return;
        }
        
        if (autoCreate)
        {
            CreateWebCommunicationController();
        }
    }
    
    void Start()
    {
        if (debugMode)
        {
            Debug.Log("AutoWebCommunicationController Start 호출됨");
        }
        
        if (!autoCreate)
        {
            CreateWebCommunicationController();
        }
    }
    
    private void CreateWebCommunicationController()
    {
        if (debugMode)
        {
            Debug.Log("CreateWebCommunicationController 메서드 호출됨");
        }
        
        // 기존 컨트롤러 확인
        var allControllers = FindFirstObjectByType<WebCommunicationController>();
        
        if (allControllers != null)
        {
            if (debugMode)
            {
                Debug.Log("WebCommunicationController가 이미 존재합니다: " + allControllers.gameObject.name);
            }
            return;
        }
        
        if (debugMode)
        {
            Debug.Log("WebCommunicationController를 생성합니다...");
        }
        
        // WebCommunicationController 생성
        GameObject controllerObj = new GameObject("WebCommunicationController");
        webController = controllerObj.AddComponent<WebCommunicationController>();
        
        // DontDestroyOnLoad 설정
        DontDestroyOnLoad(controllerObj);
        
        if (debugMode)
        {
            Debug.Log("WebCommunicationController가 자동으로 생성되었습니다: " + controllerObj.name);
            Debug.Log("DontDestroyOnLoad 설정됨: " + controllerObj.name);
            
            // 생성된 객체의 상태 확인
            if (webController != null)
            {
                Debug.Log("WebCommunicationController 컴포넌트가 성공적으로 추가됨");
            }
            else
            {
                Debug.LogError("WebCommunicationController 컴포넌트 추가 실패!");
            }
        }
    }
    
    // 수동으로 WebCommunicationController 생성
    [ContextMenu("Create WebCommunicationController")]
    public void ManualCreate()
    {
        if (debugMode)
        {
            Debug.Log("수동으로 WebCommunicationController 생성 요청됨");
        }
        CreateWebCommunicationController();
    }
    
    // WebCommunicationController 참조 가져오기
    public WebCommunicationController GetWebController()
    {
        if (webController == null)
        {
            if (debugMode)
            {
                Debug.Log("WebCommunicationController 참조가 null이므로 새로 생성합니다.");
            }
            CreateWebCommunicationController();
        }
        return webController;
    }
    
    // 현재 상태 확인
    [ContextMenu("Check Status")]
    public void CheckStatus()
    {
        Debug.Log("=== AutoWebCommunicationController 상태 확인 ===");
        Debug.Log("Instance: " + (instance != null ? "존재함" : "null"));
        Debug.Log("WebController: " + (webController != null ? "존재함" : "null"));
        
        var allControllers = FindFirstObjectByType<WebCommunicationController>();
        Debug.Log("씬의 WebCommunicationController 수: " + (allControllers != null ? "1" : "0"));
        
        if (allControllers != null)
        {
            Debug.Log("- " + allControllers.gameObject.name + " (DontDestroyOnLoad: " + 
                     (allControllers.gameObject.hideFlags.HasFlag(HideFlags.DontSaveInBuild)) + ")");
        }
    }
    
    // 싱글톤 인스턴스 가져오기
    public static AutoWebCommunicationController Instance
    {
        get
        {
            if (instance == null)
            {
                Debug.Log("AutoWebCommunicationController 인스턴스가 null이므로 새로 생성합니다.");
                GameObject obj = new GameObject("AutoWebCommunicationController");
                instance = obj.AddComponent<AutoWebCommunicationController>();
                DontDestroyOnLoad(obj);
            }
            return instance;
        }
    }
} 