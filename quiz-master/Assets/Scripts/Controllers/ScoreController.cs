using TMPro;
using UnityEngine;

public class ScoreController : MonoBehaviour
{
    public GameObject ScoreTextPrefab;

    public StringVariable ScoreText;

    public IntVariable LifetimeAnswerCount;

    public IntVariable LifetimeCorrectAnswerCount;

    public IntVariable QuizAnswerCount;
     
    public IntVariable QuizCorrectAnswerCount;
    
    [Header("UI References")]
    public TMP_Text scoreText;
    
    private int currentScore = 0;
    private int correctAnswers = 0;
    private int totalAnswers = 0;

    public void CreateScore(Component component, System.Object obj)
    {
        this.DestroyScores();

        this.QuizAnswerCount.SetValue(0);
        this.QuizCorrectAnswerCount.SetValue(0);

        GameObject scoreObject = Instantiate(this.ScoreTextPrefab);
        this.scoreText = scoreObject.GetComponent<TextMeshProUGUI>();
        this.scoreText.transform.SetParent(this.transform);

        this.UpdateScore();
    }

    public void DestroyScores(Component component, System.Object obj)
    {
        this.DestroyScores();
    }

    private void DestroyScores()
    {
        for (int i = this.transform.childCount - 1; i >= 0; i--)
        {
            Destroy(this.transform.GetChild(i).gameObject);
        }
    }

    public void IncrementCorrectAnswers()
    {
        this.QuizAnswerCount.ApplyChange(1);
        this.QuizCorrectAnswerCount.ApplyChange(1);

        this.LifetimeAnswerCount.ApplyChange(1);
        this.LifetimeCorrectAnswerCount.ApplyChange(1);

        this.UpdateScore();
    }

    public void IncrementIncorrectAnswers()
    {
        this.QuizAnswerCount.ApplyChange(1);
        this.LifetimeAnswerCount.ApplyChange(1);

        this.UpdateScore();
    }

    public void UpdateScore()
    {
        this.scoreText.SetText(string.Format(this.ScoreText.Value, this.QuizCorrectAnswerCount.Value, this.QuizAnswerCount.Value));
    }
    
    // GameManager에서 호출할 점수 업데이트 메서드
    public void SetScore(int score, int correctAnswers, int totalAnswers)
    {
        this.currentScore = score;
        this.correctAnswers = correctAnswers;
        this.totalAnswers = totalAnswers;
        
        if (scoreText != null)
        {
            scoreText.text = $"점수: {score}";
        }
    }
    
    public void AddScore(int points)
    {
        currentScore += points;
        if (scoreText != null)
        {
            scoreText.text = $"점수: {currentScore}";
        }
    }
    
    public void SetCorrectAnswers(int correct, int total)
    {
        correctAnswers = correct;
        totalAnswers = total;
    }
    
    public int GetCurrentScore()
    {
        return currentScore;
    }
    
    public int GetCorrectAnswers()
    {
        return correctAnswers;
    }
    
    public int GetTotalAnswers()
    {
        return totalAnswers;
    }
}
