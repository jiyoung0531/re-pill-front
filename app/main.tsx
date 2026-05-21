import React, { useState } from "react";
import {
    Dimensions,
    Image,
    StyleSheet,
    View
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

  // 2단계: ⭐️ 시안 완벽 반영 로그인 랜딩 화면
  return (
    <View style={styles.landingContainer}>
      {/* 상단 레이어: 연민트 배경 + 로고와 글씨 배치 */}
      <View style={styles.landingHeader}>
        <Image source={logoImg} style={styles.actualLogoImage} />
        <Image source={logoTextImg} style={styles.actualLogoText} />
      </View>

      {/* ⭐️ 캐릭터 독립 레이어 배치: 아치선 경계에 완벽히 겹치도록 분리 */}
      <View style={styles.characterAbsoluteContainer} pointerEvents="none">
        <Image source={characterImg} style={styles.actualCharacterImage} />
      </View>

      {/* 하단 레이어: 하얀색 큰 아치(원형) 본문 */}
      <View style={styles.archBody}></View>
    </View>
  );
}

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

  // 1. 맨 위 네이비색 사각 로고 크기 조정
  actualLogoImage: {
    width: 175,
    height: 175,
    resizeMode: "contain",
  },

  // 2. 이름 불일치 에러 완벽 해결 (actualLogoText로 통일)
  actualLogoText: {
    width: 320, // 중간 글씨 크기 시원하게 키움
    height: 280,
    resizeMode: "stretch",
    marginTop: -49, // 로고 이미지 아래로 적절히 배치
  },

  // 하단 흰색 아치 바디
  archBody: {
    flex: 6,
    backgroundColor: "#fff",
    borderTopLeftRadius: SCREEN_WIDTH * 0.8,
    borderTopRightRadius: SCREEN_WIDTH * 0.8,
    alignItems: "center",
    paddingHorizontal: 40,
    justifyContent: "center", // 내부 폼과 버튼 중앙 정렬
  },

  // 3. ⭐️ 캐릭터를 아치선 한가운데 고정하고 밑부분이 인풋창 뒤로 가려지게 하는 절대 좌표 치트키
  characterAbsoluteContainer: {
    position: "absolute",
    top: "52%", // 아치형 경계선 부분에 정확히 위치시킴
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10, // 아치 배경보다는 위, 그러나 인풋창 배경보단 뒤로 가도록 설정
  },
  actualCharacterImage: {
    width: 175, // ⭐️ 캐릭터 크기 큼직하게 조정
    height: 175,
    resizeMode: "contain",
  },

  // 입력 폼 영역
  formContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 64, // ⭐️ 캐릭터가 겹쳐 올라온 만큼 첫 인풋창을 아래로 내려서 겹치게 만듦
    zIndex: 20, // 캐릭터 몸통보다 인풋창이 앞으로 튀어나오게 설정
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
    backgroundColor: "#fff", // 캐릭터 아래를 완벽히 가려주기 위한 불투명 흰색 배경
    marginBottom: 12,
  },

  // 하단 버튼 영역
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

  // 로딩 화면 스타일
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
