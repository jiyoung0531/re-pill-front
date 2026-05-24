import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../supabaseClient";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const logoTextImg = require("../assets/images/logo2.png");

type ScanMode = "pill" | "envelope";

interface ScanResult {
  type: "pill" | "envelope";
  symptoms: string;
  extraInfo: string;
  expirationDate: string;
}

export default function ScanScreen() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [facing] = useState<"back" | "front">("back");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const router = useRouter();

  const [scanMode, setScanMode] = useState<ScanMode>("pill");
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [scanResultsArray, setScanResultsArray] = useState<ScanResult[]>([]);
  const [currentPillIndex, setCurrentPillIndex] = useState(0);
  const [editedResult, setEditedResult] = useState<ScanResult>({
    type: "pill",
    symptoms: "",
    extraInfo: "",
    expirationDate: "",
  });

  const toggleScanMode = () => {
    setScanMode((current) => (current === "pill" ? "envelope" : "pill"));
  };

 const takePictureAndSend = async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
      
      // 1. 백엔드로 보낼 FormData 포장하기
      const formData = new FormData();
      formData.append("file", {
        uri: photo.uri,
        name: "photo.jpg",
        type: "image/jpeg",
      } as any);

      // 2. [🔥 팀원분 요청 주소로 반영] 배포된 Supabase Edge Function URL로 fetch 요청!
      const response = await fetch(
        "https://mjcczeqcqlnsaapabdlc.supabase.co/functions/v1/medicine-api/ocr/analyze",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("백엔드 서버의 OCR 분석 응답에 실패했습니다.");
      }

      // 3. 서버가 가공해서 돌려준 데이터(JSON 배열) 받기
      const data = await response.json();

      const responseData = Array.isArray(data) ? data : data ? [data] : [];
      if (responseData.length === 0) throw new Error("인식 결과가 비어 있습니다.");

      // 4. 받아온 데이터를 팝업 모달창 상태에 바인딩
      setScanResultsArray(responseData);
      setCurrentPillIndex(0);
      setEditedResult(responseData[0]);
      setIsEditModalVisible(true);
    } catch (error: any) {
      console.error("scan error:", error);
      Alert.alert("연결 실패", error.message ?? "서버 연결에 실패했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  const splitWarning = (extraInfo: string) => {
    if (!extraInfo.includes("주의") && !extraInfo.includes("⚠️")) {
      return { extraInfo, warning: "특이사항 없음" };
    }

    const delimiter = extraInfo.includes("⚠️") ? "⚠️" : "주의";
    const [effect, warning] = extraInfo.split(delimiter);

    return {
      extraInfo: effect.trim(),
      warning: warning ? `⚠️ ${delimiter === "주의" ? "주의" : ""}${warning.trim()}` : "특이사항 없음",
    };
  };

  const saveCurrentPill = async () => {
    const { extraInfo, warning } = splitWarning(editedResult.extraInfo);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const today = new Date().toISOString().slice(0, 10);
    const { data: log, error: logError } = await supabase
      .from("PillLogs")
      .insert({ user_id: user?.id ?? null, prepared_date: today })
      .select("id")
      .single();

    if (logError) throw logError;

    const { error: itemError } = await supabase.from("PillLogItems").insert({
      pill_log_id: log?.id ?? null,
      pill_name: editedResult.symptoms,
      type: editedResult.type,
      extra_info: extraInfo,
      expiration_date: editedResult.expirationDate,
      duplicated_warning: warning,
      is_routine: false,
      is_taken: false,
      routine_time: null,
    });

    if (itemError) throw itemError;

    return { extraInfo, warning };
  };

  const handleFinalSave = async () => {
    try {
      const { extraInfo, warning } = await saveCurrentPill();

      if (currentPillIndex < scanResultsArray.length - 1) {
        const nextIndex = currentPillIndex + 1;
        setCurrentPillIndex(nextIndex);
        setEditedResult(scanResultsArray[nextIndex]);
        return;
      }

      setIsEditModalVisible(false);
      Alert.alert("저장 완료", "약 정보가 보관함에 저장되었습니다.");
      router.push({
        pathname: "/medicine-list",
        params: {
          updatedPill: JSON.stringify({
            type: editedResult.type,
            symptoms: editedResult.symptoms,
            extraInfo,
            expirationDate: editedResult.expirationDate,
            duplicatedWarning: warning,
          }),
        },
      });
    } catch (error: any) {
      console.error("save pill error:", error);
      Alert.alert("오류", error.message ?? "약 저장 중 오류가 발생했습니다.");
    }
  };

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>re:pill 사용을 위해 카메라 권한이 필요합니다.</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>권한 허용하기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <View style={styles.topControlBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={26} color="#1F355F" />
        </TouchableOpacity>
        <Image source={logoTextImg} style={styles.actualLogoText} />
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef} />

        {isProcessing && (
          <View style={styles.insideLoading}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>AI 분석 중...</Text>
          </View>
        )}

        <View style={styles.guideContainer} pointerEvents="none">
          <View style={[styles.guideBox, scanMode === "envelope" && styles.guideBoxEnvelope]} />
          <Text style={styles.guideText}>
            {scanMode === "pill"
              ? "약 정보가 잘 보이도록\n칸 안에 맞춰 촬영해 주세요"
              : "약봉투의 처방 정보가 잘 보이도록\n칸 안에 맞춰 촬영해 주세요"}
          </Text>
        </View>

        <View style={styles.cameraOverlay} pointerEvents="box-none">
          <TouchableOpacity style={styles.circleSubBtn} onPress={() => router.push("/medicine-list")}>
            <Ionicons name="document-text" size={28} color="#BBE6E8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.shutterButton} onPress={takePictureAndSend}>
            <View style={styles.shutterButtonInner} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.circleSubBtn} onPress={toggleScanMode}>
            <Ionicons
              name={scanMode === "pill" ? "reader-outline" : "ellipse-outline"}
              size={28}
              color="#BBE6E8"
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomBar} />

      <Modal
        animationType="slide"
        transparent
        visible={isEditModalVisible}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              인식 결과 확인 및 수정 ({currentPillIndex + 1} / {scanResultsArray.length})
            </Text>
            <Text style={styles.modalSubText}>텍스트가 부정확하면 직접 수정해 주세요.</Text>

            <Text style={styles.fieldLabel}>약 이름 / 주요 증상</Text>
            <TextInput
              style={styles.modalInput}
              value={editedResult.symptoms}
              onChangeText={(text) => setEditedResult({ ...editedResult, symptoms: text })}
              placeholder="약 이름을 입력하세요"
            />

            <Text style={styles.fieldLabel}>효능 설명</Text>
            <TextInput
              style={[styles.modalInput, styles.multilineInput]}
              value={editedResult.extraInfo}
              onChangeText={(text) => setEditedResult({ ...editedResult, extraInfo: text })}
              multiline
              placeholder="효능 정보를 입력하세요"
            />

            <Text style={styles.fieldLabel}>유통 기한</Text>
            <TextInput
              style={styles.modalInput}
              value={editedResult.expirationDate}
              onChangeText={(text) => setEditedResult({ ...editedResult, expirationDate: text })}
              placeholder="예: 2026.12.31"
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={[styles.popupBtn, styles.cancelBtn]} onPress={() => setIsEditModalVisible(false)}>
                <Text style={styles.cancelBtnText}>취소</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.popupBtn, styles.saveBtn]} onPress={handleFinalSave}>
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
  loadingText: {
    color: "#fff",
    marginTop: 10,
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
  permissionText: {
    textAlign: "center",
    marginBottom: 20,
  },
  permissionBtn: {
    backgroundColor: "#5C7A7C",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  permissionBtnText: {
    color: "#fff",
    fontWeight: "bold",
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
