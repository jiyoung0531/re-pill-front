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
        colors={['#BBE6E8', '#FFEB8D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.landingHeader} 
    >
        <Image source={logoTextImg} style={styles.actualLogoText} />
      

      {/* 2. 캐릭터 위치 */}
      <View style={styles.characterAbsoluteContainer} pointerEvents="none">
        <Image source={characterImg} style={styles.actualCharacterImage} />
      </View>

      {/* 3. 상단과 하단 아치 사이 */}
      <View style={{ flex: 4 }} />

      {/* 4. 하단 레이어: 하얀색 큰 아치(원형) 본문 */}
      <View style={styles.archBody}>
        {/* 스캔(카메라) 버튼 */}
        <TouchableOpacity
          style={styles.mainScanBtn}
          onPress={() => router.push("/scan")}
        >
          <Image source={camIcon} style={styles.mainScanIcon} />    
        </TouchableOpacity>

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
    width: 350,
    height: 320,
    resizeMode: "stretch",
    marginTop: -45,
  },
  characterAbsoluteContainer: {
    position: "absolute",
    top: "38%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  actualCharacterImage: {
    width: 190,
    height: 190,
    resizeMode: "contain",
  },
  archBody: {
    flex: 35,
    backgroundColor: "#fff",
    borderTopLeftRadius: SCREEN_WIDTH * 0.8,
    borderTopRightRadius: SCREEN_WIDTH * 0.8,
    alignItems: "center",
    paddingHorizontal: 35,
    paddingTop: 100, 
    justifyContent: "flex-start", 
  },

  mainScanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: 110,
    height: 110,
    paddingVertical: 18,
    marginBottom: 25, 
    elevation: 3,
  },
  mainScanIcon: {
    width: 220,
    height: 220,
  
    resizeMode: "contain",
  },
  mainScanText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F355F",
  },

  
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
