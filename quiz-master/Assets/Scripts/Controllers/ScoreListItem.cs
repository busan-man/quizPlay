using UnityEngine;
using TMPro;

public class ScoreListItem : MonoBehaviour
{
    [Header("UI References")]
    public TMP_Text timeText;
    public TMP_Text playerNameText;
    public TMP_Text actionText;
    public TMP_Text resultText;
    
    [Header("Result Colors")]
    public Color correctColor = Color.green;
    public Color incorrectColor = Color.red;
    public Color neutralColor = Color.white;
    
    public void SetEventData(string time, string playerName, string action, string result, bool isCorrect = false)
    {
        if (timeText != null)
            timeText.text = time;
        
        if (playerNameText != null)
            playerNameText.text = playerName;
        
        if (actionText != null)
            actionText.text = action;
        
        if (resultText != null)
        {
            resultText.text = result;
            
            // 결과에 따른 색상 설정
            if (isCorrect)
                resultText.color = correctColor;
            else if (result.Contains("틀림") || result.Contains("오답"))
                resultText.color = incorrectColor;
            else
                resultText.color = neutralColor;
        }
    }
    
    public void SetTime(string time)
    {
        if (timeText != null)
            timeText.text = time;
    }
    
    public void SetPlayerName(string playerName)
    {
        if (playerNameText != null)
            playerNameText.text = playerName;
    }
    
    public void SetAction(string action)
    {
        if (actionText != null)
            actionText.text = action;
    }
    
    public void SetResult(string result, bool isCorrect = false)
    {
        if (resultText != null)
        {
            resultText.text = result;
            
            // 결과에 따른 색상 설정
            if (isCorrect)
                resultText.color = correctColor;
            else if (result.Contains("틀림") || result.Contains("오답"))
                resultText.color = incorrectColor;
            else
                resultText.color = neutralColor;
        }
    }
} 