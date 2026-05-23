import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { supabase } from "../supabaseClient";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,       
  TextInput,   
  Alert,
  Dimensions,
} from "react-native";

// 백엔드 서버 인스턴스 (수파베이스 사용하는 경우 주석 해제)
// import { supabase } from "../supabaseClient";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type ScanMode = "pill" | "envelope";

// 규격 정의 
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

  // 수정 팝업창 노출 여부 및 백엔드에서 받은 임시 데이터 저장
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editedResult, setEditedResult] = useState<ScanResult>({
    type: "pill",
    symptoms: "",
    extraInfo: "",
    expirationDate: "",
  });

  // ==========================================
  // 백엔드로부터 전달받을 가변 약 리스트 데이터 스택 제어
  // ==========================================
  const [scanResultsArray, setScanResultsArray] = useState<ScanResult[]>([]);
  const [currentPillIndex, setCurrentPillIndex] = useState(0);

  // 스캔 모드를 전환
  const toggleScanMode = () => {
    setScanMode((current) => (current === "pill" ? "envelope" : "pill"));
  };

  // 백엔드 통신용 함수 (사진 캡처 및 전송)
  const takePictureAndSend = async () => {
    if (cameraRef.current && !isProcessing) {
      try {
        setIsProcessing(true); // "AI 분석 중..." 로딩창 켜기

        // [백엔드 이미지 전송 프로토콜 예시]
        // ----------------------------------------------------
        // const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
        // const formData = new FormData();
        // formData.append("image", { uri: photo.uri, name: "photo.jpg", type: "image/jpeg" } as any);
        // formData.append("mode", scanMode);
        //
        // const response = await fetch("http://YOUR_BACKEND_IP:5000/api/ocr-scan", {
        //   method: "POST",
        //   body: formData,
        //   headers: { "Content-Type": "multipart/form-data" },
        // });
        // const responseData: ScanResult[] = await response.json(); // 백엔드가 분석해 준 약 5개 배열 응답 수급
        // ----------------------------------------------------

        // 임시 테스트용 비동기 시뮬레이터 (진짜 서버 연결 시 이 시뮬레이터 구역을 지우고 위의 response 데이터 바인딩)
        setTimeout(() => {
          setIsProcessing(false);

          // 서버가 분석해서 반환해 준 진짜 결과물 예시 데이터 (여러 개가 들어있는 진짜 가변 배열 구조)
          const mockServerResponse: ScanResult[] = scanMode === "pill"
            ? [
                { type: "pill", symptoms: "종합감기약 (타이레놀정 500mg)", extraInfo: "두통, 발열, 오한 완화\n⚠️ 아세트아미노펜 성분 중복 복용 주의!", expirationDate: "" },
              ]
            : [
                { type: "envelope", symptoms: "종합감기약 (타이레놀)", extraInfo: "두통, 발열, 오한 완화\n⚠️ 아세트아미노펜 성분 중복 복용 주의!", expirationDate: "2028.12.31까지" },
                { type: "envelope", symptoms: "소화제 (까스활명수)", extraInfo: "식욕부진, 위부팽만감 개선", expirationDate: "2027.05.20까지" },
                { type: "envelope", symptoms: "지사제 (스멕타)", extraInfo: "급만성 설사 증상 완화", expirationDate: "2026.11.15까지" },
                { type: "envelope", symptoms: "비타민D 영양제", extraInfo: "뼈 형성 및 골다공증 위험 감소", expirationDate: "2029.01.10까지" },
                { type: "envelope", symptoms: "알레르기 비염약", extraInfo: "재채기, 콧물, 가려움 완화", expirationDate: "2027.08.04까지" },
              ];

          // 1. 서버가 준 전체 리스트 배열을 상태에 온전히 세팅
          setScanResultsArray(mockServerResponse);
          setCurrentPillIndex(0); // 인덱스 초기화

          // 2. 입력 수정 인풋창(editedResult)에 0번째(첫 번째) 약 데이터를 먼저 매핑팅
          setEditedResult(mockServerResponse[0]);
          setIsEditModalVisible(true); // 수정 팝업 오픈

        }, 2000);

      } catch (error) {
        console.error(error);
        Alert.alert("연결 실패", "서버 연결에 실패했습니다.");
        setIsProcessing(false);
      }
    }
  };

  // 팝업창에서 저장시 실행
  const handleFinalSave = async () => {
    try {
      // [정석 백엔드 DB 저장 프로토콜]
      // 유저가 수정한 최종본인 'editedResult' 객체를 루프를 돌며 백엔드 API 또는 Supabase에 직접 Insert 처리합니다.
      // ----------------------------------------------------------------------
      // const { error } = await supabase.from("medicine").insert([{
      //   pill_name: editedResult.symptoms,
      //   effect_info: editedResult.extraInfo,
      //   expiry_date: editedResult.expirationDate,
      //   is_taken: false
      // }]);
      // if (error) throw error;
      // ----------------------------------------------------------------------

      // 릴레이 제어 검증: 아직 배열상 검증 및 저장이 안 끝난 다음 약 데이터가 존재한다면?
      if (currentPillIndex < scanResultsArray.length - 1) {
        const nextIndex = currentPillIndex + 1;
        setCurrentPillIndex(nextIndex);

        // 레이아웃 팝업은 가만히 둔 채, 인풋 내용물(editedResult)만 다음 순번의 실제 데이터로 교체
        setEditedResult({
          type: scanResultsArray[nextIndex].type,
          symptoms: scanResultsArray[nextIndex].symptoms,
          extraInfo: scanResultsArray[nextIndex].extraInfo,
          expirationDate: scanResultsArray[nextIndex].expirationDate,
        });

      } else {
        // 배열 내부의 마지막 의약품 정보까지 전부 서버 적재 처리가 끝난 경우
        setIsEditModalVisible(false);
        Alert.alert("저장 완료", "스캔된 모든 의약품 정보가 저장되었습니다.");
        
        router.push({
          pathname: "/medicine-list",
          params: { updatedPill: JSON.stringify(editedResult) } 
        });
      }

    } catch (e) {
      console.error(e);
      Alert.alert("에러", "저장 중 알 수 없는 오류가 발생했습니다.");
    }
  };

  // 카메라 권한 체크
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

      {/* AI 분석 결과 수정 및 확인용 팝업창 (Modal) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {/* 인식 결과 확인 */}
            <Text style={styles.modalTitle}>
              🔍 인식 결과 확인 및 수정 ({currentPillIndex + 1} / {scanResultsArray.length})
            </Text>
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
                <Text style={styles.saveBtnText}>
                  {currentPillIndex < scanResultsArray.length - 1 ? "보관함에 저장" : "최종 완료"}
                </Text>
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
    paddingTop: 49,
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