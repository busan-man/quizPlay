using UnityEngine;
using TMPro;
using System.Collections.Generic;

public class FontSetupUtility : MonoBehaviour
{
    [Header("폰트 설정")]
    public TMP_FontAsset koreanFontAsset;
    
    [Header("자동 설정")]
    public bool autoSetupOnStart = true;
    public bool setupAllScenes = false;
    
    void Start()
    {
        if (autoSetupOnStart)
        {
            SetupKoreanFont();
        }
    }
    
    [ContextMenu("한국어 폰트 설정")]
    public void SetupKoreanFont()
    {
        // 폰트 에셋이 지정되지 않은 경우 자동으로 찾기
        if (koreanFontAsset == null)
        {
            koreanFontAsset = FindKoreanFontAsset();
        }
        
        if (koreanFontAsset == null)
        {
            Debug.LogError("한국어 폰트 에셋을 찾을 수 없습니다!");
            return;
        }
        
        // 현재 씬의 모든 TextMeshPro 컴포넌트에 폰트 적용
        ApplyFontToAllTextComponents();
        
        // TMP Settings 업데이트
        TMP_Settings.defaultFontAsset = koreanFontAsset;
        
        Debug.Log($"한국어 폰트 설정 완료: {koreanFontAsset.name}");
    }
    
    TMP_FontAsset FindKoreanFontAsset()
    {
        // Resources 폴더에서 찾기
        TMP_FontAsset font = Resources.Load<TMP_FontAsset>("Fonts/Maplestory Bold SDF");
        if (font != null) return font;
        
        // TextMesh Pro 폴더에서 찾기
        font = Resources.Load<TMP_FontAsset>("TextMesh Pro/Fonts/Maplestory Bold SDF");
        if (font != null) return font;
        
        // Assets에서 직접 찾기
        TMP_FontAsset[] allFonts = Resources.FindObjectsOfTypeAll<TMP_FontAsset>();
        foreach (TMP_FontAsset f in allFonts)
        {
            if (f.name.Contains("Maplestory") || f.name.Contains("Korean"))
            {
                return f;
            }
        }
        
        return null;
    }
    
    void ApplyFontToAllTextComponents()
    {
        // 현재 씬의 모든 TextMeshPro 컴포넌트 찾기
        TMP_Text[] allTextComponents = FindObjectsByType<TMP_Text>(FindObjectsSortMode.None);
        
        foreach (TMP_Text textComponent in allTextComponents)
        {
            if (textComponent.font != koreanFontAsset)
            {
                textComponent.font = koreanFontAsset;
                Debug.Log($"폰트 적용됨: {textComponent.name}");
            }
        }
        
        // TextMeshProUGUI 컴포넌트도 찾기
        TextMeshProUGUI[] allUGUIComponents = FindObjectsByType<TextMeshProUGUI>(FindObjectsSortMode.None);
        
        foreach (TextMeshProUGUI uguiComponent in allUGUIComponents)
        {
            if (uguiComponent.font != koreanFontAsset)
            {
                uguiComponent.font = koreanFontAsset;
                Debug.Log($"폰트 적용됨 (UGUI): {uguiComponent.name}");
            }
        }
    }
    
    [ContextMenu("모든 씬에 폰트 적용")]
    public void ApplyFontToAllScenes()
    {
        if (!setupAllScenes)
        {
            Debug.LogWarning("setupAllScenes이 false로 설정되어 있습니다. 이 기능을 사용하려면 true로 설정하세요.");
            return;
        }
        
        // 모든 씬을 순회하면서 폰트 적용
        for (int i = 0; i < UnityEngine.SceneManagement.SceneManager.sceneCountInBuildSettings; i++)
        {
            string sceneName = UnityEngine.SceneManagement.SceneUtility.GetScenePathByBuildIndex(i);
            Debug.Log($"씬 로드 중: {sceneName}");
            
            // 씬을 로드하고 폰트 적용
            UnityEngine.SceneManagement.SceneManager.LoadScene(i, UnityEngine.SceneManagement.LoadSceneMode.Additive);
            
            // 잠시 대기 후 폰트 적용
            StartCoroutine(ApplyFontAfterSceneLoad());
        }
    }
    
    System.Collections.IEnumerator ApplyFontAfterSceneLoad()
    {
        yield return new WaitForSeconds(0.1f);
        ApplyFontToAllTextComponents();
    }

    public void ApplyKoreanFontToAllTexts()
    {
        // 모든 폰트 에셋 찾기
        TMP_FontAsset[] allFonts = Resources.FindObjectsOfTypeAll<TMP_FontAsset>();
        
        // 한글 폰트 찾기
        TMP_FontAsset koreanFont = null;
        foreach (var font in allFonts)
        {
            if (font.name.Contains("Korean") || font.name.Contains("Noto") || font.name.Contains("Nanum"))
            {
                koreanFont = font;
                break;
            }
        }
        
        if (koreanFont == null)
        {
            Debug.LogWarning("한글 폰트를 찾을 수 없습니다.");
            return;
        }
        
        // 모든 텍스트 컴포넌트에 한글 폰트 적용
        TMP_Text[] allTextComponents = FindObjectsByType<TMP_Text>(FindObjectsSortMode.None);
        TextMeshProUGUI[] allUGUIComponents = FindObjectsByType<TextMeshProUGUI>(FindObjectsSortMode.None);
        
        int appliedCount = 0;
        
        foreach (var textComponent in allTextComponents)
        {
            if (textComponent.font != koreanFont)
            {
                textComponent.font = koreanFont;
                appliedCount++;
            }
        }
        
        foreach (var uguiComponent in allUGUIComponents)
        {
            if (uguiComponent.font != koreanFont)
            {
                uguiComponent.font = koreanFont;
                appliedCount++;
            }
        }
        
        Debug.Log($"한글 폰트가 {appliedCount}개의 텍스트 컴포넌트에 적용됨");
    }
} 