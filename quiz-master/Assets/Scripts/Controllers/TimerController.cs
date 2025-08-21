using UnityEngine;
using TMPro;

public class TimerController : MonoBehaviour
{
    public GameObject QuestionTimerPrefab;
    public GameObject AnswerTimerPrefab;
    
    [Header("UI References")]
    public TMP_Text timerText;
    
    private float currentTime;
    private float maxTime;
    private bool isTimerActive = false;
    
    public void CreateQuestionTimer(Component component, System.Object obj)
    {
        if (obj is QuestionEntity question)
        {
            // Clear out previous answers
            this.DeleteTimers();

            // Instantiate a button
            GameObject questionTimer = Instantiate(this.QuestionTimerPrefab);
            questionTimer.GetComponent<TimerImageController>().SetQuestion(question);

            // Set its parent to 'Answers' GameObject
            questionTimer.transform.SetParent(this.transform);
        }
    }

    public void CreateAnswerTimer(Component component, System.Object obj)
    {
        if (obj is QuestionEntity question)
        {
            // Clear out previous answers
            this.DeleteTimers();

            // Instantiate a button
            GameObject answerTimer = Instantiate(this.AnswerTimerPrefab);
            answerTimer.GetComponent<TimerImageController>().SetQuestion(question);

            // Set its parent to 'Answers' GameObject
            answerTimer.transform.SetParent(this.transform);
        }
    }
    
    // GameManager에서 호출할 타이머 업데이트 메서드
    public void UpdateTimer(float currentTime, float maxTime)
    {
        this.currentTime = currentTime;
        this.maxTime = maxTime;
        this.isTimerActive = true;
        
        if (timerText != null)
        {
            int minutes = Mathf.FloorToInt(currentTime / 60f);
            int seconds = Mathf.FloorToInt(currentTime % 60f);
            timerText.text = string.Format("{0:00}:{1:00}", minutes, seconds);
        }
    }
    
    public void StartTimer(float duration)
    {
        currentTime = duration;
        maxTime = duration;
        isTimerActive = true;
    }
    
    public void StopTimer()
    {
        isTimerActive = false;
    }
    
    public float GetCurrentTime()
    {
        return currentTime;
    }
    
    public bool IsTimerActive()
    {
        return isTimerActive;
    }

    private void DeleteTimers()
    {
        for (int i = this.transform.childCount - 1; i >= 0; i--)
        {
            Destroy(this.transform.GetChild(i).gameObject);
        }
    }
}
