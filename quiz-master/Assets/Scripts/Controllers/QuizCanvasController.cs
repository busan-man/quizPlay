using UnityEngine;
using UnityEngine.Events;

public class QuizCanvasController : MonoBehaviour
{
    public QuizStateManager QuizStateManager;

    public UnityEvent<Component, Object> OnLoadQuestion;

    void Start()
    {
        // QuizStateManager 자동 할당 (할당되지 않은 경우)
        if (QuizStateManager == null)
        {
            QuizStateManager = FindFirstObjectByType<QuizStateManager>();
            if (QuizStateManager != null)
            {
                Debug.Log("QuizCanvasController: QuizStateManager 자동 할당 완료");
            }
            else
            {
                Debug.LogError("QuizCanvasController: QuizStateManager를 찾을 수 없습니다!");
            }
        }
    }

    public void LoadQuestion()
    {
        // Null check to prevent NullReferenceException
        if (OnLoadQuestion != null)
        {
            this.OnLoadQuestion.Invoke(this, null);
        }
        else
        {
            Debug.LogWarning("QuizCanvasController: OnLoadQuestion event is null. Please assign a GameEvent in the Unity Inspector.");
            
            // Fallback: 직접 QuizStateManager 호출
            if (QuizStateManager != null)
            {
                Debug.Log("QuizCanvasController: Fallback - 직접 QuizStateManager.LoadQuestion() 호출");
                QuizStateManager.LoadQuestion();
            }
            else
            {
                Debug.LogError("QuizCanvasController: QuizStateManager도 null입니다. Unity Inspector에서 할당해주세요.");
            }
        }
    }
}
