import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import LoadingScreen from "../components/LoadingScreen";

export default function HomeScreen() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const router = useRouter(); // ⭐️ 라우터 선언

  // 백엔드 통신용 함수 (사진 캡처 및 전송)
  const takePictureAndSend = async () => {
    if (cameraRef.current && !isProcessing) {
      try {
        setIsProcessing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
        });
        const formData = new FormData();
        formData.append("image", {
          uri: photo.uri,
          name: "pill.jpg",
          type: "image/jpeg",
        } as any);

        const response = await fetch("http://192.168.0.100:5000/api/ocr", {
          method: "POST",
          body: formData,
          headers: { "Content-Type": "multipart/form-data" },
        });

        const result = await response.json();
        alert(`인식 성공!\n약 이름: ${result.name}`);
      } catch (error) {
        console.error(error);
        alert("서버 연결에 실패했습니다.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // ⭐️ [이동 해결 핵심] 로그인이 안 되어 있을 때 LoadingScreen을 보여주고,
  // 로그인 버튼 신호가 오면 즉시 주소를 '/main'으로 변경합니다!
  if (!isLoggedIn) {
    return (
      <LoadingScreen
        onLoginSuccess={() => {
          setIsLoggedIn(true); // 1. 로그인 상태를 true로 변경
          router.replace("/main"); // 2. 🚀 진짜 app/main.tsx 화면으로 강제 이동!
        }}
      />
    );
  }

  // --- 카메라 권한 체크 (로그인 성공 이후 작동) ---
  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={{ textAlign: "center", marginBottom: 20 }}>
          re:pill 앱을 사용하기 위해 카메라 권한이 필요합니다.
        </Text>
        <TouchableOpacity
          style={styles.permissionBtn}
          onPress={requestPermission}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>
            권한 허용하기
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- 메인 카메라 스캔 화면 UI ---
  return (
    <View style={styles.mainContainer}>
      <CameraView style={styles.camera} facing="back" ref={cameraRef} />
      <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        {isProcessing && (
          <View style={styles.insideLoading}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={{ color: "#fff", marginTop: 10 }}>AI 분석 중...</Text>
          </View>
        )}
        <View style={styles.guideContainer} pointerEvents="none">
          <View style={styles.guideBox}></View>
          <Text style={styles.guideText}>
            알약의 정보가 잘 보이도록{"\n"}칸 안에 맞춰 찍어주세요
          </Text>
        </View>
        <View style={styles.topRightControls}>
          <Text style={styles.headerTitle}>re:pill</Text>
          <View style={styles.iconContainer}>
            <Ionicons
              name="moon-outline"
              size={25}
              color="#fff"
              style={styles.controlIcon}
            />
            <Ionicons
              name="flash-outline"
              size={25}
              color="#fff"
              style={styles.controlIcon}
            />
            <Ionicons
              name="menu-outline"
              size={25}
              color="#fff"
              style={styles.controlIcon}
            />
          </View>
        </View>
        <View style={styles.zoomControls}>
          <Text style={styles.zoomText}>.5</Text>
          <View style={styles.activeZoomPill}>
            <Text style={styles.activeZoomText}>1x</Text>
          </View>
          <Text style={styles.zoomText}>2</Text>
        </View>
        <TouchableOpacity style={styles.cameraRotateBtn}>
          <Ionicons name="refresh-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.bottomControlBar}>
        <TouchableOpacity
          style={styles.iconCircleBtn}
          onPress={() => router.push("/medicine-list")}
        >
          <Ionicons name="calendar-clear-outline" size={30} color="#9CD2D5" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shutterButton}
          onPress={takePictureAndSend}
        >
          <View style={styles.shutterButtonInner} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconCircleBtn}
          onPress={() => router.push("/disposal-map")}
        >
          <Ionicons name="map-outline" size={30} color="#9CD2D5" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  insideLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  permissionBtn: {
    backgroundColor: "#5C7A7C",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  guideContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  guideBox: {
    width: 260,
    height: 180,
    borderWidth: 2,
    borderColor: "#9CD2D5",
    borderRadius: 16,
  },
  guideText: {
    marginTop: 20,
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
    lineHeight: 20,
  },
  topRightControls: {
    flexDirection: "row",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: "#5C7A7C",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 30,
    zIndex: 999,
  },
  headerTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    bottom: 15,
    fontSize: 24,
    fontWeight: "bold",
    color: "#9CD2D5",
    zIndex: 1000,
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 20,
  },
  controlIcon: { marginLeft: 15 },
  zoomControls: {
    flexDirection: "row",
    position: "absolute",
    bottom: 160,
    alignSelf: "center",
    alignItems: "center",
  },
  zoomText: { color: "#fff", fontSize: 14, marginHorizontal: 10, opacity: 0.7 },
  activeZoomPill: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
  },
  activeZoomText: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  cameraRotateBtn: {
    position: "absolute",
    bottom: 150,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 12,
    borderRadius: 25,
  },
  bottomControlBar: {
    height: 140,
    backgroundColor: "#5C7A7C",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 20,
  },
  iconCircleBtn: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  shutterButton: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    borderWidth: 5,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  shutterButtonInner: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: "#fff",
  },
});
