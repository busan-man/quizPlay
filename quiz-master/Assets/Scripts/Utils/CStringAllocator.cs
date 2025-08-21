using System;
using System.Runtime.InteropServices;

public static class CStringAllocator
{
    public static IntPtr StringToIntPtr(string str)
    {
        if (str == null)
        {
            return IntPtr.Zero;
        }
        // 빈 문자열도 유효한 C 문자열로 전달 (NUL 포함)
        byte[] bytes = System.Text.Encoding.UTF8.GetBytes(str + '\0');
        IntPtr ptr = Marshal.AllocHGlobal(bytes.Length);
        Marshal.Copy(bytes, 0, ptr, bytes.Length);
        return ptr;
    }

    public static void FreeIntPtr(IntPtr ptr)
    {
        if (ptr != IntPtr.Zero)
        {
            Marshal.FreeHGlobal(ptr);
        }
    }
}



