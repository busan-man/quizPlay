using System;
using System.Collections.Generic;

[System.Serializable]
public class WebMessage
{
    public string type;
    public string data;
}

[System.Serializable]
public class InitData
{
    public string role;
    public string code;
    public string nickname;
    public string gameId;
}

[System.Serializable]
public class SocketMessage
{
    public string type;
    public string data;
}

[System.Serializable]
public class GameStartData
{
    public string gameCode;
    public string playerName;
    public string characterId;
    public bool isTeacher;
    public GameConfig gameConfig;
}

[System.Serializable]
public class GameConfig
{
    public string gameMode; // "time" or "score"
    public int timeLimit; // minutes
    public int scoreLimit;
}

[System.Serializable]
public class QuestionData
{
    public string question;
    public string[] options;
    public string correctAnswer;
    public string explanation;
    public int points;
    public int timeLimit;
}

[System.Serializable]
public class AnswerSubmission
{
    public string questionId;
    public string selectedAnswer;
    public bool isCorrect;
    public int points;
    public float timeSpent;
}

[System.Serializable]
public class PlayerInfo
{
    public string playerId;
    public string playerName;
    public string characterId;
    public int score;
    public int correctAnswers;
    public int totalAnswers;
    public bool isOnline;
}

[System.Serializable]
public class GameResult
{
    public string playerId;
    public string playerName;
    public int finalScore;
    public int correctAnswers;
    public int totalQuestions;
    public float totalTime;
    public List<AnswerSubmission> answers;
} 