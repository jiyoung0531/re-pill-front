import { useRouter } from "expo-router";
import React from "react";
import { LinearGradient } from 'expo-linear-gradient';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const camIcon = require("../assets/images/camera.png");
const saveIcon = require("../assets/images/save.png");
const mapIcon = require("../assets/images/map.png");
const characterImg = require("../assets/images/char.png");
const logoTextImg = require("../assets/images/logo2.png");

export default function MainScreen() {
  const router = useRouter();

  return (
    <View style={styles.landingContainer}>
      {/* 1. 상단 로고 텍스트 영역 */}
      <LinearGradient
      // 위쪽은 시그니처 민트색, 아래쪽은 연한 민트색으로 부드럽게 이어지도록 설정
        colors={['#BBE6E8', '#FFEB8D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.landingHeader} // 기존 헤더 스타일(높이, 패딩 등)은 그대로 유지!
    >
        <Image source={logoTextImg} style={styles.actualLogoText} />
      

      {/* 2. 캐릭터 절대 위치 레이어 */}
      <View style={styles.characterAbsoluteContainer} pointerEvents="none">
        <Image source={characterImg} style={styles.actualCharacterImage} />
      </View>

      {/* 3. 상단과 하단 아치 사이의 공백 밸런스 */}
      <View style={{ flex: 4 }} />

      {/* 4. 하단 레이어: 하얀색 큰 아치(원형) 본문 */}
      <View style={styles.archBody}>
        {/* ⭐️ [위층] 주인공: 가로로 길고 직관적인 큰 약 스캔 버튼 */}
        <TouchableOpacity
          style={styles.mainScanBtn}
          onPress={() => router.push("/scan")}
        >
          <Image source={camIcon} style={styles.mainScanIcon} />
        
        </TouchableOpacity>

        {/* ⭐️ [아래층] 서브: 보관함과 폐기 지도를 가로로 깔끔하게 2분할 배치 */}
        <View style={styles.subBtnRow}>
          {/* 1. 보관함(약 목록) 버튼 */}
          <TouchableOpacity
            style={styles.subMenuItem}
            onPress={() => router.push("/medicine-list")}
          >
            <View style={styles.iconWrapper}>
              <Image source={saveIcon} style={styles.subIconBtn} />
            </View>
            <Text style={styles.subMenuText}>보관함</Text>
          </TouchableOpacity>

          {/* 2. 폐기 지도 버튼 */}
          <TouchableOpacity
            style={styles.subMenuItem}
            onPress={() => router.push("/disposal-map")}
          >
            <View style={styles.iconWrapper}>
              <Image source={mapIcon} style={styles.subIconBtn} />
            </View>
            <Text style={styles.subMenuText}>폐기 지도</Text>
          </TouchableOpacity>
        </View>
      </View>
      </LinearGradient>
    </View>
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
    paddingTop: 75,
    backgroundColor: "transparent",
  },
  actualLogoText: {
    width: 320,
    height: 290,
    resizeMode: "stretch",
    marginTop: -45,
  },
  characterAbsoluteContainer: {
    position: "absolute",
    top: "35%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  actualCharacterImage: {
    width: 185,
    height: 185,
    resizeMode: "contain",
  },
  archBody: {
    flex: 24,
    backgroundColor: "#fff",
    borderTopLeftRadius: SCREEN_WIDTH * 0.8,
    borderTopRightRadius: SCREEN_WIDTH * 0.8,
    alignItems: "center",
    paddingHorizontal: 35,
    paddingTop: 140, // 캐릭터 꼬리가 아치 위에 자연스럽게 얹어지도록 상단 여백 조절
    justifyContent: "flex-start", // 컴포넌트들이 위에서부터 차례대로 정렬되도록 변경
  },

  // ⭐️ 새로 추가된 대형 약 스캔 버튼 스타일
  mainScanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#BBE6E8", // 전체 화면 무드와 맞춘 민트색 포인트 배경
    width: "100%",
    paddingVertical: 18,
    borderRadius: 20,
    marginBottom: 75, // 아래 서브 버튼들과의 시각적 분리를 위한 넉넉한 간격
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  mainScanIcon: {
    width: 40,
    height: 40,
    marginRight: 30,
    resizeMode: "contain",
  },
  mainScanText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F355F", // 기존 디자인의 깊이감 있는 네이비 톤 통일
  },

  // ⭐️ 아래 서브 버튼 2개를 묶어주는 가로 정렬 상자
  subBtnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
  },
  subMenuItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  iconWrapper: {
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  subIconBtn: {
    width: 75,
    height: 75,
    resizeMode: "contain",
  },
  subMenuText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F355F",
    textAlign: "center",
  },
});
