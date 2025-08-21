using UnityEngine;
using UnityEditor;
using TMPro;

public class FontUpdater : EditorWindow
{
    public TMP_FontAsset koreanFont;
    
    [MenuItem("Tools/Update Korean Font")]
    public static void ShowWindow()
    {
        GetWindow<FontUpdater>("Korean Font Updater");
    }
    
    void OnGUI()
    {
        GUILayout.Label("Korean Font Updater", EditorStyles.boldLabel);
        
        koreanFont = (TMP_FontAsset)EditorGUILayout.ObjectField("Korean SDF Font", koreanFont, typeof(TMP_FontAsset), false);
        
        if (GUILayout.Button("Update All Prefabs") && koreanFont != null)
        {
            UpdateAllPrefabs();
        }
    }
    
    void UpdateAllPrefabs()
    {
        string[] prefabPaths = {
            "Assets/Prefabs/LeaderboardContent.prefab",
            "Assets/Prefabs/StudentListItemPrefab.prefab",
            "Assets/Prefabs/PlayerListItemPrefab.prefab",
            "Assets/Prefabs/Questions/Question.prefab",
            "Assets/Prefabs/Answers/Answer.prefab",
            "Assets/Prefabs/Instructions/Instruction.prefab",
            "Assets/Prefabs/FinalScore/FinalScore.prefab",
            "Assets/Prefabs/Scores/Score.prefab"
        };
        
        foreach (string path in prefabPaths)
        {
            GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(path);
            if (prefab != null)
            {
                UpdatePrefabFonts(prefab, path);
            }
        }
        
        AssetDatabase.SaveAssets();
        Debug.Log("모든 프리팹의 한글 폰트 업데이트 완료!");
    }
    
    void UpdatePrefabFonts(GameObject prefab, string path)
    {
        GameObject instance = PrefabUtility.InstantiatePrefab(prefab) as GameObject;
        
        TMP_Text[] textComponents = instance.GetComponentsInChildren<TMP_Text>(true);
        
        foreach (TMP_Text text in textComponents)
        {
            text.font = koreanFont;
        }
        
        PrefabUtility.SaveAsPrefabAsset(instance, path);
        DestroyImmediate(instance);
        
        Debug.Log($"Updated: {path}");
    }
}
