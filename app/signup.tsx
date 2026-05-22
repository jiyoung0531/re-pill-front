import { useRouter } from "expo-router";
import React, { useState } from "react";
import { LinearGradient } from 'expo-linear-gradient';
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
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// 기존 이미지 경로들
const characterImg = require("../assets/images/char.png");

export default function SignUpScreen() {
  const router = useRouter();

  // 입력값 상태 관리
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState("");
  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");

  const handleSignUp = () => {
    alert("회원가입이 완료되었습니다!");
    router.replace("/main");
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
          {/* 🤍 1. 하얀색 아치 배경을 '가장 먼저' 배치해서 도화지 바닥에 깔아버리기 */}
          <View style={styles.archBodyBackground} pointerEvents="none" />
          {/* 2. 그 위에 캐릭터 영역 배치 */}
          <View style={styles.avatarContainer}>
            <Image source={characterImg} style={styles.characterImage} />
          </View>
          {/* 3. 그 위에 인풋창과 버튼들 배치 (이제 아치 위로 완벽하게 올라옵니다!) */}
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
    height: 418, // ⭐️ 기기 기준 절대 높이가 아니라 고정 높이로 변경해서 인풋창 아래에 딱 깔리게 조절!
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

  // ⭐️ 2. 위쪽 흰색 인풋창 스타일 + 빵빵한 그림자 효과 부활!
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
    // 안드로이드 그림자
    elevation: 3,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6D8E91",
    marginRight: 8,
  },

  // ⭐️ 3. 아래쪽 민트색 테두리 인풋창 스타일 + 그림자 효과 부활!
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
    borderColor: "#BBE6E8", // 지영님이 원하신 민트색 border 테두리!
    // iOS 그림자
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    // 안드로이드 그림자
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

  // ⭐️ 4. 회원가입 버튼 스타일 + 입체적인 그림자 효과 부활!
  signUpBtn: {
    width: "100%",
    backgroundColor: "#BBE6E8",
    borderRadius: 25,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    marginBottom: 30,
    // iOS 그림자
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    // 안드로이드 그림자
    elevation: 4,
  },
  signUpBtnText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F355F",
  },
});
