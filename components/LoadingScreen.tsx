import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { LinearGradient } from 'expo-linear-gradient';
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

  const handleLogin = () => {
    if (onLoginSuccess) {
      onLoginSuccess();
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

  // 2단계: 대각선 그라데이션 및 입체 레이어 로그인 화면
  return (
    <LinearGradient
      colors={['#BBE6E8', '#FFEB8D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.landingContainer}
    >
      {/* 바탕색을 투명하게 비춰주는 상단 로고 영역 */}
      <View style={styles.landingHeader}>
        <Image source={logoImg} style={styles.actualLogoImage} />
        <Image source={logoTextImg} style={styles.actualLogoText} />
      </View>

      {/* [1층 렌더링] 하얀색 아치 본문 바디 (가장 밑바닥 틀) */}
      <View style={styles.archBody}>
        
        {/* [2층 렌더링] 귀여운 캐릭터 레이어 (아치 자식으로 이동하여 아치선 위에 안착) */}
        <View style={styles.characterAbsoluteContainer} pointerEvents="none">
          <Image source={characterImg} style={styles.actualCharacterImage} />
        </View>

        {/* [3층 렌더링] 인풋창 컨테이너 (높은 zIndex와 상단 마진으로 캐릭터 몸통 하단을 덮음) */}
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

        {/* 하단 로그인 및 회원가입 버튼 열 */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.capsuleBtn} onPress={handleLogin}>
            <Text style={styles.btnText}>로그인</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.capsuleBtn}
            onPress={() => router.push("/signup")}
          >
            <Text style={styles.btnText}>회원가입</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  landingContainer: {
    flex: 1,
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
    width: 270,
    height: 240,
    resizeMode: "stretch",
    marginTop: -35,
  },
  // 🤍 1층: 가장 바탕이 되는 하얀색 아치 폼 설정
  archBody: {
    flex: 6.8,
    backgroundColor: "#fff",
    width: "100%", // 양옆 여백 비지 않도록 화면 가로 전체 확장
    borderTopLeftRadius: SCREEN_WIDTH * 0.8,
    borderTopRightRadius: SCREEN_WIDTH * 0.8,
    alignItems: "center",
    paddingHorizontal: 35,
    justifyContent: "center",
    position: "relative", // 자식들의 절대 위치 기준점 부여
  },
  // 🐹 2층: 아치 지붕선에 걸쳐져 머리와 상체가 밖으로 삐져나오는 캐릭터 설정
  characterAbsoluteContainer: {
    position: "absolute",
    top: 9, // 마이너스 오프셋으로 아치 하얀 선 위쪽으로 캐릭터를 밀어 올림
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1, // 아치 바닥면보다 위에 배치
  },
  actualCharacterImage: {
    width: 178,
    height: 178,
    resizeMode: "contain",
  },
  // ⌨️ 3층: 캐릭터 몸통을 덮으며 올라오는 인풋 입력창 구역 설정
  formContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 33, // 캐릭터 밑부분과 자연스럽게 겹치도록 정렬 간격 조정
    zIndex: 20, // 캐릭터(zIndex: 1)를 완전히 덮고 위로 올라오도록 서열 정리
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