using UnityEngine;
using TMPro;
using UnityEngine.UI;

public class PlayerListItem : MonoBehaviour
{
    [Header("UI References")]
    public TMP_Text rankText;
    public TMP_Text playerNameText;
    public Image characterImage;
    public TMP_Text scoreText;
    public TMP_Text accuracyText;
    public Image statusIndicator;
    
    [Header("Status Colors")]
    public Color onlineColor = Color.green;
    public Color offlineColor = Color.red;
    
    public void SetPlayerData(int rank, string playerName, string characterId, int score, float accuracy, bool isOnline)
    {
        if (rankText != null)
            rankText.text = $"{rank}";
        
        if (playerNameText != null)
            playerNameText.text = playerName;
        
        if (scoreText != null)
            scoreText.text = $"{score}점";
        
        if (accuracyText != null)
            accuracyText.text = $"{accuracy:F1}%";
        
        if (statusIndicator != null)
            statusIndicator.color = isOnline ? onlineColor : offlineColor;
        
        // 캐릭터 이미지 설정 (선택사항)
        if (characterImage != null)
        {
            // 캐릭터 ID에 따른 이미지 설정
            // 실제 구현에서는 캐릭터 스프라이트 배열을 참조
        }
    }
    
    public void SetRank(int rank)
    {
        if (rankText != null)
            rankText.text = $"{rank}";
    }
    
    public void SetScore(int score)
    {
        if (scoreText != null)
            scoreText.text = $"{score}점";
    }
    
    public void SetAccuracy(float accuracy)
    {
        if (accuracyText != null)
            accuracyText.text = $"{accuracy:F1}%";
    }
    
    public void SetOnlineStatus(bool isOnline)
    {
        if (statusIndicator != null)
            statusIndicator.color = isOnline ? onlineColor : offlineColor;
    }
} 