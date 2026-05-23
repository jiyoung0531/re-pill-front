import { useRouter } from "expo-router";
import React from "react";
import { View, Alert } from "react-native";
import LoadingScreen from "../components/LoadingScreen";
import { supabase } from "../supabaseClient"; 

export default function IndexScreen() {
  const router = useRouter();

  // 🚀 LoadingScreen에서 로그인 버튼을 누르면 이 함수가 호출되어 검증을 수행합니다!
  const handleSupabaseLogin = async (id: string, password: string) => {
    if (!id || !password) {
      Alert.alert("알림", "아이디와 비밀번호를 모두 입력해 주세요.");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${id}@repill.com`,
        password: password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          Alert.alert(
            "로그인 실패", 
            "아이디 또는 비밀번호가 일치하지 않습니다.\n가입하지 않은 회원이시라면 회원가입을 먼저 진행해 주세요! 🩵"
          );
        } else {
          Alert.alert("로그인 실패", error.message);
        }
      } else if (data.user) {
        Alert.alert("성공", `${id}님, 환영합니다! 🎉`, [
          { text: "확인", onPress: () => router.replace("/main") } // ⭕ 성공 시 진짜 메인으로!
        ]);
      }
    } catch (error) {
      console.error("로그인 통신 에러:", error);
      Alert.alert("오류", "서버와 연결할 수 없습니다.");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* 컴포넌트에 서버 로그인 함수를 프롭스로 넘김 */}
      <LoadingScreen onLoginSuccess={handleSupabaseLogin} />
    </View>
  );
}