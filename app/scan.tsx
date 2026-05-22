import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const logoTextImg = require("../assets/images/logo2.png");

export default function ScanScreen() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const router = useRouter();

  // 카메라 전면/후면 전환 함수
  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

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

  // --- 카메라 권한 체크 ---
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

  return (
    <View style={styles.mainContainer}>
      {/* 1. 상단 컨트롤 바 (민트색 헤더 및 로고 텍스트) */}
      <View style={styles.topControlBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={26} color="#1F355F" />
        </TouchableOpacity>
        <Image source={logoTextImg} style={styles.actualLogoText} />
        <View style={{ width: 26 }} />
      </View>

      {/* 2. 중앙 카메라 프리뷰 영역 */}
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef} />

        {/* AI 분석 중 로딩 스피너 */}
        {isProcessing && (
          <View style={styles.insideLoading}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={{ color: "#fff", marginTop: 10 }}>AI 분석 중...</Text>
          </View>
        )}

        {/* ⭐️ [지영님의 소중한 가이드라인 부활!] 네모칸 가이드 레이어 */}
        <View style={styles.guideContainer} pointerEvents="none">
          <View style={styles.guideBox} />
          <Text style={styles.guideText}>
            약의 정보가 잘 보이도록{"\n"}칸 안에 맞춰 찍어주세요
          </Text>
        </View>

        {/* 3. 시안 전면 컨트롤 뷰 (반투명 원형 버튼 세트) */}
        <View style={styles.cameraOverlay} pointerEvents="box-none">
          {/* 왼쪽 버튼: 약 목록 상자 폼 */}
          <TouchableOpacity
            style={styles.circleSubBtn}
            onPress={() => router.push("/medicine-list")}
          >
            <Ionicons name="document-text" size={28} color="#BBE6E8" />
          </TouchableOpacity>

          {/* 중앙 버튼: 셔터 (이중 원형 구조) */}
          <TouchableOpacity
            style={styles.shutterButton}
            onPress={takePictureAndSend}
          >
            <View style={styles.shutterButtonInner} />
          </TouchableOpacity>

          {/* 오른쪽 버튼: 카메라 회전 */}
          <TouchableOpacity
            style={styles.circleSubBtn}
            onPress={toggleCameraFacing}
          >
            <Ionicons name="refresh" size={28} color="#BBE6E8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. 하단 여백 바 (시안의 하단 민트색 영역) */}
      <View style={styles.bottomBar} />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  topControlBar: {
    height: 128,
    backgroundColor: "#BBE6E8",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  backBtn: {
    justifyContent: "center",
    alignItems: "center",
  },
  actualLogoText: {
    width: 150,
    height: 145,
    resizeMode: "contain",
  },
  cameraContainer: {
    flex: 1,
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  insideLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99,
  },

  // ⭐️ 가이드라인 정중앙 배치를 위한 스타일
  guideContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
    // 하단 버튼 레이어와 겹쳐서 답답해 보이지 않게 위쪽으로 살짝 올리기 오프셋 설정
    paddingBottom: 60,
  },
  guideBox: {
    width: 300,
    height: 250,
    borderWidth: 2,
    borderColor: "#9CD2D5", // 원래 맞추셨던 예쁜 가이드라인 민트색 선
    borderRadius: 16,
  },
  guideText: {
    marginTop: 25,
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
    lineHeight: 20,
    // 어두운 배경/카메라 화면에서도 글씨가 잘 보이도록 그림자 효과 살짝 추가!
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    paddingBottom: 25,
    zIndex: 10, // 가이드라인보다 앞에 오도록 설정
  },
  circleSubBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  shutterButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  shutterButtonInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#fff",
  },
  bottomBar: {
    height: 80,
    backgroundColor: "#BBE6E8",
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
});
