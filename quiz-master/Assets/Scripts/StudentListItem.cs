using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class StudentListItem : MonoBehaviour
{
    [Header("UI References")]
    public TMP_Text nameText;
    public TMP_Text characterText;
    public Image statusImage;
    public Image backgroundImage;
    
    [Header("Settings")]
    public Color onlineColor = Color.green;
    public Color offlineColor = Color.gray;
    public Color selectedColor = new Color(0.2f, 0.6f, 1f, 0.3f);
    public Color normalColor = new Color(1f, 1f, 1f, 0.1f);
    
    private string playerId;
    private string playerName;
    private string characterId;
    private bool isOnline = true;
    private bool isSelected = false;
    
    public void SetStudentData(string id, string name, string character, bool online = true)
    {
        playerId = id;
        playerName = name;
        characterId = character;
        isOnline = online;
        
        UpdateUI();
    }
    
    void UpdateUI()
    {
        // 이름 텍스트 설정
        if (nameText != null)
        {
            nameText.text = playerName;
        }
        
        // 캐릭터 텍스트 설정
        if (characterText != null)
        {
            characterText.text = $"캐릭터 {characterId}";
        }
        
        // 상태 이미지 설정
        if (statusImage != null)
        {
            statusImage.color = isOnline ? onlineColor : offlineColor;
        }
        
        // 배경 이미지 설정
        if (backgroundImage != null)
        {
            backgroundImage.color = isSelected ? selectedColor : normalColor;
        }
    }
    
    public void SetOnlineStatus(bool online)
    {
        isOnline = online;
        UpdateUI();
    }
    
    public void SetSelected(bool selected)
    {
        isSelected = selected;
        UpdateUI();
    }
    
    // Getter 메서드들
    public string GetPlayerId()
    {
        return playerId;
    }
    
    public string GetPlayerName()
    {
        return playerName;
    }
    
    public string GetCharacterId()
    {
        return characterId;
    }
    
    public bool IsOnline()
    {
        return isOnline;
    }
    
    public bool IsSelected()
    {
        return isSelected;
    }
} 