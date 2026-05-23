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
  Modal,       // ⭐️ 수정을 위한 팝업 모달 추가
  TextInput,   // ⭐️ 직접 입력 및 수정을 위한 인풋 추가
  Alert,
  Dimensions,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ⭐️ 스캔 모드 타입 정의
type ScanMode = "pill" | "envelope";

// ⭐️ 백엔드와 주고받을 데이터 규격 정의 (명세서 일치형)
interface ScanResult {
  type: "pill" | "envelope";
  symptoms: string;          // 백엔드 명세서의 'symptoms' (약 이름 및 주요 증상)
  extraInfo: string;         // 백엔드 명세서의 'extraInfo' (약효 및 효능 설명)
  expirationDate: string;    // 백엔드 명세서의 'expirationDate' (유통기한)
}

const logoTextImg = require("../assets/images/logo2.png");

export default function ScanScreen() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const router = useRouter();

  // 현재 스캔 모드 상태 (기본값: 알약 자체 찍기)
  const [scanMode, setScanMode] = useState<ScanMode>("pill");

  // ⭐️ [추가 상태] 수정 팝업창 노출 여부 및 백엔드에서 받은 임시 데이터 저장 변수
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editedResult, setEditedResult] = useState<ScanResult>({
    type: "pill",
    symptoms: "",
    extraInfo: "",
    expirationDate: "",
  });

  // 알약 ↔ 약봉투 모드를 전환하는 함수
  const toggleScanMode = () => {
    setScanMode((current) => (current === "pill" ? "envelope" : "pill"));
  };

  // 백엔드 통신용 함수 (사진 캡처 및 전송)
  // 백엔드 통신용 함수 (★시연 및 UI 테스트용 더미 모드★)
  const takePictureAndSend = async () => {
    if (cameraRef.current && !isProcessing) {
      try {
        setIsProcessing(true); // "AI 분석 중..." 로딩창 켜기

        // ⭐️ 실제 서버 통신 대신 2.5초 동안 로딩이 도는 것처럼 시뮬레이션합니다!
        setTimeout(() => {
          setIsProcessing(false); // 2.5초 뒤 로딩창 끄기

          // ⭐️ 백엔드에서 받아올 데이터 규격과 똑같은 가짜 데이터를 만들어 줍니다.
          const dummyResult: ScanResult = scanMode === "pill" 
            ? {
                type: "pill",
                symptoms: "종합감기약 (타이레놀정 500mg)",
                extraInfo: "두통, 발열, 오한 완화 및 통증 경감",
                expirationDate: "", // 알약은 유통기한 공백 처리
              }
            : {
                type: "envelope",
                symptoms: "성북구보건소 처방 약봉투",
                extraInfo: "아침, 점심, 저녁 식후 30분 복용 (소염진통제 포함)",
                expirationDate: "2026.12.31까지", // 약봉투는 유통기한 매핑
              };

          // ⭐️ 가짜 데이터를 수정 상태에 넣고 팝업창을 엽니다!
          setEditedResult(dummyResult);
          setIsEditModalVisible(true); // 수정 팝업 오픈!

        }, 2500); // 2500ms = 2.5초 동안 로딩 가동

      } catch (error) {
        console.error(error);
        Alert.alert("연결 실패", "서버 연결에 실패했습니다.");
        setIsProcessing(false);
      }
    }
  };

  // ⭐️ 팝업창에서 최종 확인/수정 후 '보관함에 저장' 버튼 누를 때 실행되는 함수
  const handleFinalSave = async () => {
    try {
      setIsEditModalVisible(false);

      
      // [백엔드 연동 전] 지금 당장 해커톤 시연 및 프론트 단독 테스트용
      // ==========================================================
      Alert.alert("저장 완료", "약 보관함에 안전하게 등록되었습니다.");
      router.push({
        pathname: "/medicine-list",
        params: { updatedPill: JSON.stringify(editedResult) } // 가짜 데이터 전달
      });

    
      // [백엔드 연동 후]  실제 백엔드 DB에 최종본 저장할 때 사용하는 정석 코드
      // (백엔드에서 "보관함 저장 API" 주소가 나오면 아래 주석을 풀고 위 코드를 주석처리 하세요!)
      // ==========================================================
      /*
      setIsProcessing(true); // 저장하는 동안 잠깐 로딩 켜기
      
      const saveUrl = "http://192.168.0.100:5000/api/storage"; // 백엔드가 줄 저장 주소
      const response = await fetch(saveUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedResult), // 유저가 수정한 최종 symptoms, extraInfo 등을 JSON으로 전송!
      });

      if (response.ok) {
        Alert.alert("저장 완료", "약 보관함에 데이터가 성공적으로 저장되었습니다.");
        // 백엔드 DB에 잘 들어갔으니, 보관함 화면으로 깔끔하게 이동!
        router.push("/storage"); 
      } else {
        Alert.alert("저장 실패", "서버에 저장하는 중 오류가 발생했습니다.");
      }
      setIsProcessing(false);
      */

    } catch (e) {
      console.error(e);
      Alert.alert("에러", "저장 중 알 수 없는 오류가 발생했습니다.");
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
      {/* 1. 상단 컨트롤 바 */}
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

        {/* 네모칸 가이드 레이어 */}
        <View style={styles.guideContainer} pointerEvents="none">
          <View 
            style={[
              styles.guideBox, 
              scanMode === "envelope" && styles.guideBoxEnvelope
            ]} 
          />
          <Text style={styles.guideText}>
            {scanMode === "pill"
              ? "약의 정보가 잘 보이도록\n칸 안에 맞춰 찍어주세요"
              : "약봉투의 처방 정보가 잘 보이도록\n넓은 칸 안에 맞춰 찍어주세요"}
          </Text>
        </View>

        {/* 3. 시안 전면 컨트롤 뷰 */}
        <View style={styles.cameraOverlay} pointerEvents="box-none">
          {/* 왼쪽 버튼: 약 목록 상자 폼 */}
          <TouchableOpacity
            style={styles.circleSubBtn}
            onPress={() => router.push("/medicine-list")}
          >
            <Ionicons name="document-text" size={28} color="#BBE6E8" />
          </TouchableOpacity>

          {/* 중앙 버튼: 셔터 */}
          <TouchableOpacity
            style={styles.shutterButton}
            onPress={takePictureAndSend}
          >
            <View style={styles.shutterButtonInner} />
          </TouchableOpacity>

          {/* 오른쪽 버튼: 스캔 모드 전환 */}
          <TouchableOpacity
            style={styles.circleSubBtn}
            onPress={toggleScanMode}
          >
            <Ionicons 
              name={scanMode === "pill" ? "reader-outline" : "ellipse-outline"} 
              size={28} 
              color="#BBE6E8" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. 하단 여백 바 */}
      <View style={styles.bottomBar} />

      {/* ⭐️ [핵심 기능] AI 분석 결과 수정 및 확인용 팝업창 (Modal) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🔍 인식 결과 확인 및 수정</Text>
            <Text style={styles.modalSubText}>텍스트가 부정확하다면 직접 터치해 수정해 주세요.</Text>

            {/* 약 이름 / 주요 증상 수정 칸 */}
            <Text style={styles.fieldLabel}>약 이름 / 주요 증상</Text>
            <TextInput
              style={styles.modalInput}
              value={editedResult.symptoms}
              onChangeText={(text) => setEditedResult({ ...editedResult, symptoms: text })}
              placeholder="약 이름을 입력하세요"
            />

            {/* 약효 및 효능 설명 수정 칸 */}
            <Text style={styles.fieldLabel}>약효 및 효능 설명</Text>
            <TextInput
              style={[styles.modalInput, styles.multilineInput]}
              value={editedResult.extraInfo}
              onChangeText={(text) => setEditedResult({ ...editedResult, extraInfo: text })}
              multiline
              placeholder="효능 정보를 입력하세요"
            />

            {/* 유통기한 수정 칸 */}
            <Text style={styles.fieldLabel}>유통 기한</Text>
            <TextInput
              style={styles.modalInput}
              value={editedResult.expirationDate}
              onChangeText={(text) => setEditedResult({ ...editedResult, expirationDate: text })}
              placeholder="예: 2026.12.31까지 (없으면 공백)"
            />

            {/* 팝업창 하단 버튼 행 */}
            <View style={styles.modalButtonRow}>
              <TouchableOpacity 
                style={[styles.popupBtn, styles.cancelBtn]} 
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>취소</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.popupBtn, styles.saveBtn]} 
                onPress={handleFinalSave}
              >
                <Text style={styles.saveBtnText}>보관함에 저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99,
  },
  guideContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
    paddingBottom: 60,
  },
  guideBox: {
    width: 260,
    height: 200,
    borderWidth: 2,
    borderColor: "#9CD2D5",
    borderRadius: 16,
  },
  guideBoxEnvelope: {
    width: 310,
    height: 340,
    borderColor: "#FFD384",
  },
  guideText: {
    marginTop: 25,
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
    lineHeight: 22,
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
    zIndex: 10,
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

  // ⭐️ [팝업창 관련 전용 스타일 디자인]
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: SCREEN_WIDTH * 0.88,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F355F",
    marginBottom: 6,
    textAlign: "center",
  },
  modalSubText: {
    fontSize: 13,
    color: "#7A9A9C",
    marginBottom: 20,
    textAlign: "center",
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5C7A7C",
    marginBottom: 6,
    paddingLeft: 4,
  },
  modalInput: {
    backgroundColor: "#F4FAFA",
    borderWidth: 1,
    borderColor: "#E2F2F3",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: "#333",
    marginBottom: 14,
  },
  multilineInput: {
    height: 70,
    textAlignVertical: "top",
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  popupBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#ECEFF1",
    marginRight: 10,
  },
  cancelBtnText: {
    color: "#607D8B",
    fontWeight: "600",
  },
  saveBtn: {
    backgroundColor: "#5C7A7C",
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },
});