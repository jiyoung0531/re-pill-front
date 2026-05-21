import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface LoadingScreenProps {
  onLoginSuccess?: () => void;
}

const characterImg = require("../assets/images/char.png");
const logoImg = require("../assets/images/logo1.png");
const logoTextImg = require("../assets/images/logo2.png");

export default function LoadingScreen({ onLoginSuccess }: LoadingScreenProps) {
  const [showLogin, setShowLogin] = useState(false);
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();

  useEffect(() => {
    // 3초 동안 로딩 서클 작동
    const timer = setTimeout(() => {
      setShowLogin(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // ⭐️ [여기에 추가됨!] 버튼 누르면 바로 무조건 통과하는 임시 로그인 함수
  const handleLogin = () => {
    router.replace("/main");
    {
      /*if (!id.trim() || !password.trim()) {
      Alert.alert("알림", "아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }

    // 성공 팝업 띄우고 메인(app/main.tsx)으로 쏴주기
    Alert.alert("성공", `${id}님, 환영합니다!`);
    if (onLoginSuccess) {
      onLoginSuccess();
    }*/
    }
  };

  // 1단계: 로딩 화면
  if (!showLogin) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5C7A7C" />
        <Text style={styles.loadingText}>re:pill 준비 중...</Text>
      </View>
    );
  }

  // 2단계: 시안 완벽 반영 로그인 랜딩 화면
  return (
    <View style={styles.landingContainer}>
      {/* 상단 레이어: 연민트 배경 + 로고와 글씨 배치 */}
      <View style={styles.landingHeader}>
        <Image source={logoImg} style={styles.actualLogoImage} />
        <Image source={logoTextImg} style={styles.actualLogoText} />
      </View>

      {/* 캐릭터 독립 레이어 배치: 아치선 경계에 완벽히 겹치도록 분리 */}
      <View style={styles.characterAbsoluteContainer} pointerEvents="none">
        <Image source={characterImg} style={styles.actualCharacterImage} />
      </View>

      {/* 하단 레이어: 하얀색 큰 아치(원형) 본문 */}
      <View style={styles.archBody}>
        {/* 인풋창 (ID, Password) - 캐릭터 밑부분을 가리도록 마진 조정 */}
        <View style={styles.formContainer}>
          <TextInput
            style={styles.capsuleInput}
            placeholder="ID:"
            placeholderTextColor="#9CD2D5"
            value={id}
            onChangeText={setId}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.capsuleInput}
            placeholder="Password:"
            placeholderTextColor="#9CD2D5"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {/* 하단 버튼 영역 */}
        <View style={styles.buttonRow}>
          {/* ⭐️ onPress에 방금 만든 handleLogin 함수를 연결했습니다! */}
          <TouchableOpacity style={styles.capsuleBtn} onPress={handleLogin}>
            <Text style={styles.btnText}>로그인</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.capsuleBtn}
            onPress={() => alert("회원가입 페이지 준비 중")}
          >
            <Text style={styles.btnText}>회원가입</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// 지영님이 맞춰두신 황금 비율 스타일 시트 그대로 유지!
const styles = StyleSheet.create({
  landingContainer: {
    flex: 1,
    backgroundColor: "#BBE6E8",
  },
  landingHeader: {
    flex: 4.8,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 85,
  },
  actualLogoImage: {
    width: 175,
    height: 175,
    resizeMode: "contain",
  },
  actualLogoText: {
    width: 320,
    height: 280,
    resizeMode: "stretch",
    marginTop: -49,
  },
  archBody: {
    flex: 6,
    backgroundColor: "#fff",
    borderTopLeftRadius: SCREEN_WIDTH * 0.8,
    borderTopRightRadius: SCREEN_WIDTH * 0.8,
    alignItems: "center",
    paddingHorizontal: 40,
    justifyContent: "center",
  },
  characterAbsoluteContainer: {
    position: "absolute",
    top: "52%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  actualCharacterImage: {
    width: 175,
    height: 175,
    resizeMode: "contain",
  },
  formContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 64,
    zIndex: 20,
  },
  capsuleInput: {
    width: "85%",
    height: 46,
    borderWidth: 1.5,
    borderColor: "#BBE6E8",
    borderRadius: 23,
    paddingHorizontal: 20,
    fontSize: 15,
    color: "#5C7A7C",
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "85%",
    marginTop: 15,
  },
  capsuleBtn: {
    flex: 0.47,
    height: 44,
    backgroundColor: "#BBE6E8",
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: {
    color: "#5C7A7C",
    fontSize: 15,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#BBE6E8",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#5C7A7C",
    fontWeight: "bold",
  },
});
