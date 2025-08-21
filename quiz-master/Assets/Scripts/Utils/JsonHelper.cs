using System.Collections.Generic;
using System.Text;

public static class JsonHelper
{
    // 안전한 JSON 직렬화: 문자열 값을 올바르게 이스케이프/따옴표 처리
    public static string DictionaryToJsonSafe(Dictionary<string, object> dict)
    {
        var sb = new StringBuilder();
        sb.Append("{");

        bool first = true;
        foreach (var kvp in dict)
        {
            if (!first)
            {
                sb.Append(",");
            }

            sb.Append('"').Append(kvp.Key).Append('"').Append(":");

            if (kvp.Value == null)
            {
                sb.Append("null");
            }
            else if (kvp.Value is string s)
            {
                // 문자열 이스케이프
                var escaped = s
                    .Replace("\\", "\\\\")
                    .Replace("\"", "\\\"")
                    .Replace("\n", "\\n")
                    .Replace("\r", "\\r")
                    .Replace("\t", "\\t");
                sb.Append('"').Append(escaped).Append('"');
            }
            else if (kvp.Value is bool b)
            {
                sb.Append(b ? "true" : "false");
            }
            else if (kvp.Value is int || kvp.Value is long || kvp.Value is float || kvp.Value is double || kvp.Value is decimal)
            {
                sb.Append(kvp.Value.ToString());
            }
            else if (kvp.Value is Dictionary<string, object> nested)
            {
                sb.Append(DictionaryToJsonSafe(nested));
            }
            else
            {
                // 그 외 타입은 문자열로 처리
                var str = kvp.Value.ToString() ?? string.Empty;
                var escaped = str
                    .Replace("\\", "\\\\")
                    .Replace("\"", "\\\"")
                    .Replace("\n", "\\n")
                    .Replace("\r", "\\r")
                    .Replace("\t", "\\t");
                sb.Append('"').Append(escaped).Append('"');
            }

            first = false;
        }

        sb.Append("}");
        return sb.ToString();
    }

    public static string DictionaryToJson<TKey, TValue>(Dictionary<TKey, TValue> dict)
    {
        var sb = new StringBuilder();
        sb.Append("{");
        
        bool first = true;
        foreach (var kvp in dict)
        {
            if (!first)
                sb.Append(",");
            
            // 기존 메서드는 문자열 따옴표 처리를 하지 않아 JSON이 깨질 수 있음
            // 호환성 유지를 위해 문자열로 강제 변환 후 안전 이스케이프 처리
            string valueString = kvp.Value?.ToString() ?? "";
            var escaped = valueString
                .Replace("\\", "\\\\")
                .Replace("\"", "\\\"")
                .Replace("\n", "\\n")
                .Replace("\r", "\\r")
                .Replace("\t", "\\t");
            sb.Append($"\"{kvp.Key}\":\"{escaped}\"");
            first = false;
        }
        
        sb.Append("}");
        return sb.ToString();
    }
    
    public static Dictionary<string, string> JsonToDictionary(string json)
    {
        var result = new Dictionary<string, string>();
        
        try
        {
            string cleanJson = json.Trim('{', '}');
            string[] pairs = cleanJson.Split(',');
            
            foreach (string pair in pairs)
            {
                string[] keyValue = pair.Split(':');
                if (keyValue.Length == 2)
                {
                    string key = keyValue[0].Trim('"');
                    string value = keyValue[1].Trim('"');
                    result[key] = value;
                }
            }
        }
        catch
        {
            // 파싱 실패 시 빈 딕셔너리 반환
        }
        
        return result;
    }
    
    public static Dictionary<string, int> JsonToIntDictionary(string json)
    {
        var result = new Dictionary<string, int>();
        
        try
        {
            string cleanJson = json.Trim('{', '}');
            string[] pairs = cleanJson.Split(',');
            
            foreach (string pair in pairs)
            {
                string[] keyValue = pair.Split(':');
                if (keyValue.Length == 2)
                {
                    string key = keyValue[0].Trim('"');
                    if (int.TryParse(keyValue[1].Trim(), out int value))
                    {
                        result[key] = value;
                    }
                }
            }
        }
        catch
        {
            // 파싱 실패 시 빈 딕셔너리 반환
        }
        
        return result;
    }
} 