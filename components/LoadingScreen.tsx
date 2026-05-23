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
  onLoginSuccess?: (id: string, password: string) => void;
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
      //  사용자가 입력창에 적은 id와 password를 부모(index.tsx) 서버 검증 함수로 이동
      onLoginSuccess(id, password); 
    }
  };

  // 로딩 화면
  if (!showLogin) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5C7A7C" />
        <Text style={styles.loadingText}>re:pill 준비 중...</Text>
      </View>
    );
  }


  return (
    <LinearGradient
      colors={['#BBE6E8', '#FFEB8D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.landingContainer}
    >
      {/* 상단 로고 영역 */}
      <View style={styles.landingHeader}>
        <Image source={logoImg} style={styles.actualLogoImage} />
        <Image source={logoTextImg} style={styles.actualLogoText} />
      </View>

      {/* 아치 본문 */}
      <View style={styles.archBody}>
        
        {/*  캐릭터 레이어  */}
        <View style={styles.characterAbsoluteContainer} pointerEvents="none">
          <Image source={characterImg} style={styles.actualCharacterImage} />
        </View>

        {/* 인풋창 컨테이너 */}
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

        {/* 로그인 및 회원가입  */}
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
  archBody: {
    flex: 6.8,
    backgroundColor: "#fff",
    width: "100%", 
    borderTopLeftRadius: SCREEN_WIDTH * 0.8,
    borderTopRightRadius: SCREEN_WIDTH * 0.8,
    alignItems: "center",
    paddingHorizontal: 35,
    justifyContent: "center",
    position: "relative", 
  },
  characterAbsoluteContainer: {
    position: "absolute",
    top: 9,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1, 
  },
  actualCharacterImage: {
    width: 178,
    height: 178,
    resizeMode: "contain",
  },
  formContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 33, 
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