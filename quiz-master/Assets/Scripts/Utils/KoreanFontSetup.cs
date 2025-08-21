using UnityEngine;
using TMPro;
using System.Collections.Generic;

[DefaultExecutionOrder(-9999)]
public class KoreanFontSetup : MonoBehaviour
{
    [Header("한글 폰트 설정")]
    public TMP_FontAsset koreanFontAsset;
    
    [Header("디버그 설정")]
    public bool debugMode = true;
    
    private static KoreanFontSetup instance;
    public static KoreanFontSetup Instance
    {
        get
        {
            if (instance == null)
            {
                instance = FindFirstObjectByType<KoreanFontSetup>();
                if (instance == null)
                {
                    GameObject obj = new GameObject("KoreanFontSetup");
                    instance = obj.AddComponent<KoreanFontSetup>();
                    DontDestroyOnLoad(obj);
                }
            }
            return instance;
        }
    }
    
    void Awake()
    {
        if (instance == null)
        {
            instance = this;
            DontDestroyOnLoad(gameObject);
            
            if (debugMode)
            {
                Debug.Log("[KoreanFontSetup] 한글 폰트 설정 초기화됨");
            }
            
            SetupKoreanFonts();
        }
        else if (instance != this)
        {
            if (debugMode)
            {
                Debug.Log("[KoreanFontSetup] 중복 인스턴스 제거됨");
            }
            Destroy(gameObject);
        }
    }
    
    void SetupKoreanFonts()
    {
        if (koreanFontAsset == null)
        {
            // 기본 한글 폰트 찾기
            koreanFontAsset = Resources.Load<TMP_FontAsset>("Fonts/NotoSansKR-Regular SDF");
            
            if (koreanFontAsset == null)
            {
                // 다른 한글 폰트 시도
                koreanFontAsset = Resources.Load<TMP_FontAsset>("Fonts/MalgunGothic SDF");
            }
            
            if (koreanFontAsset == null)
            {
                if (debugMode)
                {
                    Debug.LogWarning("[KoreanFontSetup] 한글 폰트를 찾을 수 없습니다. 기본 폰트를 사용합니다.");
                }
                return;
            }
        }
        
        if (debugMode)
        {
            Debug.Log($"[KoreanFontSetup] 한글 폰트 설정 완료: {koreanFontAsset.name}");
        }
        
        // 모든 TextMeshPro 컴포넌트에 한글 폰트 적용
        ApplyKoreanFontToAllTexts();
    }
    
    public void ApplyKoreanFontToAllTexts()
    {
        if (koreanFontAsset == null) return;
        
        // 현재 씬의 모든 TextMeshPro 컴포넌트 찾기
        TextMeshProUGUI[] textComponents = FindObjectsByType<TextMeshProUGUI>(FindObjectsSortMode.None);
        TextMeshPro[] textMeshComponents = FindObjectsByType<TextMeshPro>(FindObjectsSortMode.None);
        
        int appliedCount = 0;
        
        // UI 텍스트에 적용
        foreach (var text in textComponents)
        {
            if (text.font != koreanFontAsset)
            {
                text.font = koreanFontAsset;
                appliedCount++;
            }
        }
        
        // 월드 텍스트에 적용
        foreach (var text in textMeshComponents)
        {
            if (text.font != koreanFontAsset)
            {
                text.font = koreanFontAsset;
                appliedCount++;
            }
        }
        
        if (debugMode)
        {
            Debug.Log($"[KoreanFontSetup] {appliedCount}개의 텍스트 컴포넌트에 한글 폰트 적용됨");
        }
    }
    
    // 새로운 씬이 로드될 때 호출
    public void OnSceneLoaded()
    {
        if (debugMode)
        {
            Debug.Log("[KoreanFontSetup] 새 씬 로드됨, 한글 폰트 재적용");
        }
        
        // 약간의 지연 후 폰트 적용 (씬 로드 완료 대기)
        Invoke(nameof(ApplyKoreanFontToAllTexts), 0.1f);
    }
    
    // 특정 텍스트 컴포넌트에 한글 폰트 적용
    public void ApplyKoreanFont(TextMeshProUGUI textComponent)
    {
        if (koreanFontAsset != null && textComponent != null)
        {
            textComponent.font = koreanFontAsset;
        }
    }
    
    public void ApplyKoreanFont(TextMeshPro textComponent)
    {
        if (koreanFontAsset != null && textComponent != null)
        {
            textComponent.font = koreanFontAsset;
        }
    }
} 