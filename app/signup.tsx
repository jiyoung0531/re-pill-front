import { useRouter } from "expo-router";
import React, { useState } from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { createClient } from "@supabase/supabase-js";
import {
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Alert,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const characterImg = require("../assets/images/char.png");

export default function SignUpScreen() {
  const router = useRouter();

  // 입력값 상태 관리
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState("");
  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");

  const handleSignUp = async () => {
    // id, password, birth으로 빈값 체크
    if (!id || !password || !birth) {
      Alert.alert("알림", "아이디, 비밀번호, 생년월일을 모두 입력해 주세요.");
      return;
    }

    // upabase 회원가입 시작
    try {
      // 수파베이스는 기본적으로 '이메일 형태'를 아이디로 받음 
      // 일반 아이디(id) 뒤에 서비스 도메인을 임시로 붙여 이메일 형태로 변환해 가입
      const { data, error } = await supabase.auth.signUp({
        email: `${id}@repill.com`, 
        password: password,
        options: {
          data: {
            birthdate: birth, // 생년월일 추가 데이터는 metadata에 저장
          },
        },
      });

      if (error) {
        Alert.alert("회원가입 실패", error.message);
      } else if (data) {
        // 가입 성공 시 알림을 띄우고 메인 화면으로 이동
        Alert.alert("성공", "회원가입이 완료되었습니다!", [
          {
            text: "확인",
            onPress: () => {
              router.replace("/"); 
            },
          },
        ]);
      }
    } catch (error) {
      console.error("수파베이스 통신 에러:", error);
      Alert.alert("오류", "네트워크 통신 중 에러가 발생했습니다.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >

      <LinearGradient
      colors={['#BBE6E8', '#FFEB8D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >   
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.archBodyBackground} pointerEvents="none" />
          <View style={styles.avatarContainer}>
            <Image source={characterImg} style={styles.characterImage} />
          </View>
          <View style={styles.formContainer}>
            <View style={styles.whiteInputWrapper}>
              <Text style={styles.inputLabel}>아이디:</Text>
              <TextInput
                style={styles.input}
                value={id}
                onChangeText={setId}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.whiteInputWrapper}>
              <Text style={styles.inputLabel}>비밀번호:</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.whiteInputWrapper}>
              <Text style={styles.inputLabel}>비밀번호 확인:</Text>
              <TextInput
                style={styles.input}
                value={passwordCheck}
                onChangeText={setPasswordCheck}
                secureTextEntry
              />
            </View>

            <View style={styles.mintBorderInputWrapper}>
              <Text style={styles.mintBorderInputLabel}>사용자 이름:</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.mintBorderInputWrapper}>
              <Text style={styles.mintBorderInputLabel}>생년월일:</Text>
              <TextInput
                style={styles.input}
                value={birth}
                onChangeText={setBirth}
                placeholder="YYYY.MM.DD"
                placeholderTextColor="#A8C9CB"
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity style={styles.signUpBtn} onPress={handleSignUp}>
              <Text style={styles.signUpBtnText}>회원가입</Text>
            </TouchableOpacity>
          </View>{" "}
          {/* formContainer 닫기 */}
        </View>
      </ScrollView>
      </LinearGradient> 
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "transparnet",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 50,
  },

  archBodyBackground: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 418,
    backgroundColor: "#fff",
    borderTopLeftRadius: SCREEN_WIDTH * 0.8,
    borderTopRightRadius: SCREEN_WIDTH * 0.8,
  },
  avatarContainer: {
    marginTop: 55,
    marginBottom: -70,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  characterImage: {
    width: 170,
    height: 170,
    resizeMode: "contain",
  },
  formContainer: {
    width: "100%",
    paddingHorizontal: 40,
    zIndex: 2,
    marginTop: 37,
  },
  whiteInputWrapper: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 50,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: "#BBE6E8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6D8E91",
    marginRight: 8,
  },

  mintBorderInputWrapper: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 50,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: "#BBE6E8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  mintBorderInputLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#5C7A7C",
    marginRight: 8,
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: "#1F355F",
    paddingVertical: 0,
  },
  signUpBtn: {
    width: "100%",
    backgroundColor: "#BBE6E8",
    borderRadius: 25,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  signUpBtnText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F355F",
  },
});
