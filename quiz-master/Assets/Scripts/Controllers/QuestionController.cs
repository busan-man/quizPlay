using TMPro;
using UnityEngine;

public class QuestionController : MonoBehaviour
{
    public GameObject QuestionTextPrefab;

    public StringVariable CorrectAnswerText;

    public StringVariable IncorrectAnswerText;

    public StringVariable ExpiredTimerText;

    public void ShowQuestion(Component component, System.Object obj)
    {
        if (obj is QuestionEntity questionPresentation)
        {
            // Clear out previous question
            this.DeleteQuestions(null, null);

            // Instantiate a question
            GameObject questionText = instantiateQuestionText(this.QuestionTextPrefab, questionPresentation.Question);

            // Set its parent to 'Question' GameObject
            questionText.transform.SetParent(this.transform);
        }
    }

    public void ShowCorrectAnswerText(Component component, System.Object obj)
    {
        if (obj is QuestionEntity question)
        {
            // Clear out previous question
            this.DeleteQuestions(null, null);

            // Instantiate a question
            GameObject questionText = instantiateQuestionText(this.QuestionTextPrefab, string.Format(this.CorrectAnswerText.Value, "\n", question.Explanation));

            // Set its parent to 'Question' GameObject
            questionText.transform.SetParent(this.transform);
        }
    }

    public void ShowIncorrectAnswerText(Component component, System.Object obj)
    {
        if (obj is QuestionEntity question)
        {
            // Clear out previous question
            this.DeleteQuestions(null, null);

            // Instantiate a question
            GameObject questionText = instantiateQuestionText(this.QuestionTextPrefab, string.Format(this.IncorrectAnswerText.Value, "\n", question.CorrectAnswer));

            // Set its parent to 'Question' GameObject
            questionText.transform.SetParent(this.transform);
        }
    }

    public void ShowTimerExpiredText(Component component, System.Object obj)
    {
        if (obj is QuestionEntity question)
        {
            // Clear out previous question
            this.DeleteQuestions(null, null);

            // Instantiate a question
            GameObject questionText = instantiateQuestionText(this.QuestionTextPrefab, string.Format(this.ExpiredTimerText.Value, "\n", question.CorrectAnswer));

            // Set its parent to 'Question' GameObject
            questionText.transform.SetParent(this.transform);
        }
    }

    private GameObject instantiateQuestionText(GameObject prefab, string text)
    {
        GameObject questionText = Instantiate(prefab);
        questionText.GetComponent<TextMeshProUGUI>().SetText(text);
        return questionText;
    }

    public void DeleteQuestions(Component component, System.Object obj)
    {
        for (int i = this.transform.childCount - 1; i >= 0; i--)
        {
            Destroy(this.transform.GetChild(i).gameObject);
        }
    }
    
    // QuestionData를 받는 SetQuestion 메서드 추가
    public void SetQuestion(QuestionData questionData)
    {
        if (questionData == null) return;
        
        // 기존 질문들 삭제
        DeleteQuestions(null, null);
        
        // 새 질문 텍스트 생성
        GameObject questionText = instantiateQuestionText(this.QuestionTextPrefab, questionData.question);
        questionText.transform.SetParent(this.transform);
        
        Debug.Log($"질문 설정 완료: {questionData.question}");
    }
    
    // SocketManager에서 호출하는 메서드들
    public void StartQuestion(QuestionStartData questionData)
    {
        Debug.Log($"StartQuestion 호출됨: {questionData?.questionText ?? "알 수 없는 문제"}");
        
        if (questionData == null) return;
        
        // 기존 질문들 삭제
        DeleteQuestions(null, null);
        
        // 새 질문 텍스트 생성
        GameObject questionText = instantiateQuestionText(this.QuestionTextPrefab, questionData.questionText);
        questionText.transform.SetParent(this.transform);
        
        Debug.Log($"문제 시작 완료: {questionData.questionText}");
    }
    
    public void ShowQuestion(QuestionData questionData)
    {
        Debug.Log($"ShowQuestion 호출됨: {questionData?.question ?? "알 수 없는 문제"}");
        
        if (questionData == null) return;
        
        // 기존 질문들 삭제
        DeleteQuestions(null, null);
        
        // 새 질문 텍스트 생성
        GameObject questionText = instantiateQuestionText(this.QuestionTextPrefab, questionData.question);
        questionText.transform.SetParent(this.transform);
        
        Debug.Log($"문제 표시 완료: {questionData.question}");
    }
}
