import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { API_BASE_URL } from "../constants/api";
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
type PillShape = "원형" | "타원형" | "장방형";
type PillColor = "흰색" | "노란색" | "분홍색";

const PILL_SHAPE_OPTIONS: { label: string; value: PillShape }[] = [
  { label: "원형 ⚪", value: "원형" },
  { label: "타원형 🥚", value: "타원형" },
  { label: "장방형 💊", value: "장방형" },
];

const PILL_COLOR_OPTIONS: { label: string; value: PillColor }[] = [
  { label: "흰색", value: "흰색" },
  { label: "노란색", value: "노란색" },
  { label: "분홍색", value: "분홍색" },
];

interface ScanResult {
  type: "pill" | "envelope" | "syrup" | "powder";
  symptoms: string;
  extraInfo: string;
  warningInfo?: string;
  expirationDate: string;
}

const calculateRecommendedExpiry = (pillType: string): string => {
  const expiry = new Date();
  const normalizedType = pillType.toLowerCase();

  if (normalizedType.includes("syrup") || pillType.includes("물약")) {
    expiry.setDate(expiry.getDate() + 28);
  } else if (normalizedType.includes("powder") || pillType.includes("가루약")) {
    expiry.setDate(expiry.getDate() + 21);
  } else {
    expiry.setMonth(expiry.getMonth() + 2);
  }

  const year = expiry.getFullYear();
  const month = String(expiry.getMonth() + 1).padStart(2, "0");
  const day = String(expiry.getDate()).padStart(2, "0");

  return `${year}.${month}.${day}`;
};

const hasRecognizedMedicine = (pill: ScanResult): boolean => {
  const text = `${pill.symptoms ?? ""} ${pill.extraInfo ?? ""}`.trim();
  if (!text) return false;

  return !["알 수 없음", "미인식", "인식 실패", "unknown", "none"].some((word) =>
    text.toLowerCase().includes(word.toLowerCase())
  );
};

const getExpirationDateForResult = (pill: ScanResult): string => {
  if (pill.expirationDate?.trim()) return pill.expirationDate;
  if (!hasRecognizedMedicine(pill)) return "";

  return calculateRecommendedExpiry(`${pill.type} ${pill.symptoms} ${pill.extraInfo}`);
};

export default function ScanScreen() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [facing] = useState<"back" | "front">("back");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const router = useRouter();

  const [scanMode, setScanMode] = useState<ScanMode>("pill");
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  
  // 🌟 [부활!] 알약 정밀 식별을 위한 필수 상태값 그룹
  const [isPillIdentifyModalVisible, setIsPillIdentifyModalVisible] = useState(false);
  const [pillEngraving, setPillEngraving] = useState("");
  const [selectedPillShape, setSelectedPillShape] = useState<PillShape>("원형");
  const [selectedPillColor, setSelectedPillColor] = useState<PillColor>("흰색");
  const [isIdentifyingPill, setIsIdentifyingPill] = useState(false);

  const [scanResultsArray, setScanResultsArray] = useState<ScanResult[]>([]);
  const [currentPillIndex, setCurrentPillIndex] = useState(0);
  const [editedResult, setEditedResult] = useState<ScanResult>({
    type: "pill",
    symptoms: "",
    extraInfo: "",
    warningInfo: "",
    expirationDate: "",
  });

  const toggleScanMode = () => {
    setScanMode((current) => (current === "pill" ? "envelope" : "pill"));
  };

  const setResultForEditing = (pill: ScanResult) => {
    setEditedResult({
      ...pill,
      warningInfo: pill.warningInfo ?? "",
      expirationDate:
        pill.type === "envelope"
          ? pill.expirationDate ?? ""
          : getExpirationDateForResult(pill),
    });
  };

  const takePictureAndSend = async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
      const formData = new FormData();

      // 아까 맞춘 것처럼 백엔드 연동 Key 규격을 "image"로 통일합니다.
      formData.append("image", {
        uri: photo.uri,
        name: "photo.jpg",
        type: "image/jpeg",
      } as any);

      // 💥 1. 낱개 알약 스캔 모드일 때 동작
      if (scanMode === "pill") {
        const engravingResponse = await fetch(`${API_BASE_URL}/ocr/engraving`, {
          method: "POST",
          body: formData,
        });

        if (!engravingResponse.ok) {
          throw new Error("알약 각인 인식 응답에 실패했습니다.");
        }

        const engravingJson = await engravingResponse.json();
        
        // 백엔드에서 받아온 글자를 칸에 심고 정밀 식별 팝업창 열기
        setPillEngraving(engravingJson.engraving ?? "");
        setSelectedPillShape("원형");
        setSelectedPillColor("흰색");
        setIsPillIdentifyModalVisible(true);
        return;
      }

      // 💥 2. 기존 약봉투 스캔 모드일 때 동작
      const response = await fetch(`${API_BASE_URL}/ocr/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("백엔드 OCR 분석 응답에 실패했습니다.");
      }

      const responseJson = await response.json();

      console.log("=== [디버깅] 서버가 보내준 전체 응답 ===");
      console.log(JSON.stringify(responseJson, null, 2));

      const medicineNames = responseJson.medicineNames ?? [];

      const infoResponse = await fetch(`${API_BASE_URL}/medicine-info`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          medicineNames,
        }),
      });

      const infoJson = await infoResponse.json();

      const popupMedicines: ScanResult[] = infoJson.medicines.map((medicine: any) => ({
        type: medicine.type ?? scanMode,
        symptoms: medicine.symptoms ?? "",
        extraInfo: medicine.extraInfo ?? "",
        warningInfo: medicine.warningInfo ?? "",
        expirationDate: medicine.expirationDate ?? "",
      }));

      if (popupMedicines.length === 0) {
        throw new Error("약봉투의 글자가 인식되지 않았습니다. 밝은 곳에서 다시 촬영해 주세요.");
      }

      setScanResultsArray(popupMedicines);
      setCurrentPillIndex(0);
      setResultForEditing(popupMedicines[0]);
      setIsEditModalVisible(true);

    } catch (error: any) {
      console.error("scan error:", error);
      Alert.alert("인식 실패", error.message ?? "정보를 가져오지 못했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 🌟 [부활!] 외형 매칭 완료 후 백엔드 조회 및 보관함 이동 함수
  const handleFinalPillIdentification = async () => {
    const engraving = pillEngraving.trim();

    if (!engraving) {
      Alert.alert("각인 확인", "알약 각인을 입력해 주세요.");
      return;
    }

    try {
      setIsIdentifyingPill(true);

      const response = await fetch(`${API_BASE_URL}/pill/identify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          engraving,
          shape: selectedPillShape,
          color: selectedPillColor,
        }),
      });

      if (!response.ok) {
        throw new Error("알약 정밀 식별 응답에 실패했습니다.");
      }

      const pillJson = await response.json();
      const expirationDate = calculateRecommendedExpiry("pill");

      setIsPillIdentifyModalVisible(false);
      
      // 약 보관함 화면으로 진짜 마스터 데이터 전송
      router.push({
        pathname: "/medicine-list",
        params: {
          updatedPill: JSON.stringify({
            type: "pill",
            pillName: pillJson.pill_name ?? "",
            symptoms: pillJson.pill_name ?? "",
            effectInfo: pillJson.effect_info ?? "",
            extraInfo: pillJson.effect_info ?? "",
            warningInfo: pillJson.warning_info ?? "",
            duplicatedWarning: pillJson.warning_info ?? "",
            expirationDate,
          }),
        },
      });
    } catch (error: any) {
      console.error("pill identify error:", error);
      Alert.alert("식별 실패", error.message ?? "알약 정보를 가져오지 못했습니다.");
    } finally {
      setIsIdentifyingPill(false);
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
    const splitResult = splitWarning(editedResult.extraInfo);
    const extraInfo = splitResult.extraInfo;
    const warning = editedResult.warningInfo?.trim()
      ? editedResult.warningInfo.trim()
      : splitResult.warning;

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
        setResultForEditing(scanResultsArray[nextIndex]);
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

      {/* 🧾 1. 기존 약봉투 결과 확인 모달 */}
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

            <Text style={styles.fieldLabel}>주의사항</Text>
            <TextInput
              style={[styles.modalInput, styles.multilineInput]}
              value={editedResult.warningInfo ?? ""}
              onChangeText={(text) => setEditedResult({ ...editedResult, warningInfo: text })}
              multiline
              placeholder="주의사항을 입력하세요"
            />

            <Text style={styles.fieldLabel}>유통 기한</Text>
            <TextInput
              style={styles.modalInput}
              value={editedResult.expirationDate}
              onChangeText={(text) => setEditedResult({ ...editedResult, expirationDate: text })}
              placeholder="유통기한을 입력하세요"
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

      {/* 🌟 [부활!] 2. 낱개 알약 전용 정밀 외형 선택 모달 */}
      <Modal
        animationType="fade"
        transparent
        visible={isPillIdentifyModalVisible}
        onRequestClose={() => setIsPillIdentifyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* 💥 우측 상단 절대 좌표 X 닫기 단추 디자인 완전 주입 */}
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setIsPillIdentifyModalVisible(false)}
              disabled={isIdentifyingPill}
            >
              <Text style={styles.modalCloseText}>x</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>알약 정밀 식별</Text>
            <Text style={styles.modalSubText}>각인과 외형을 확인한 뒤 약을 찾아 주세요.</Text>

            <Text style={styles.fieldLabel}>각인</Text>
            <TextInput
              style={styles.modalInput}
              value={pillEngraving}
              onChangeText={setPillEngraving}
              placeholder="인식된 각인을 입력하세요"
              autoCapitalize="characters"
              editable={!isIdentifyingPill}
            />

            <Text style={styles.fieldLabel}>모양</Text>
            <View style={styles.segmentRow}>
              {PILL_SHAPE_OPTIONS.map((option) => {
                const isSelected = selectedPillShape === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.segmentBtn, isSelected && styles.segmentBtnSelected]}
                    onPress={() => setSelectedPillShape(option.value)}
                    disabled={isIdentifyingPill}
                  >
                    <Text style={[styles.segmentText, isSelected && styles.segmentTextSelected]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>색상</Text>
            <View style={styles.segmentRow}>
              {PILL_COLOR_OPTIONS.map((option) => {
                const isSelected = selectedPillColor === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.segmentBtn, isSelected && styles.segmentBtnSelected]}
                    onPress={() => setSelectedPillColor(option.value)}
                    disabled={isIdentifyingPill}
                  >
                    <Text style={[styles.segmentText, isSelected && styles.segmentTextSelected]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.finalIdentifyBtn, isIdentifyingPill && styles.disabledBtn]}
              onPress={handleFinalPillIdentification}
              disabled={isIdentifyingPill}
            >
              {isIdentifyingPill ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.finalIdentifyBtnText}>이 외형으로 약 찾기 🔍</Text>
              )}
            </TouchableOpacity>
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
  modalCloseBtn: { position: "absolute", top: 16, right: 20, zIndex: 10, width: 30, height: 30, justifyContent: "center", alignItems: "center" },
  modalCloseText: { fontSize: 24, color: "#1F355F", fontWeight: "bold" },
  segmentRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4, marginBottom: 12 },
  segmentBtn: { flex: 1, borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 8, paddingVertical: 10, alignItems: "center", marginHorizontal: 4, backgroundColor: "#F8FAFC" },
  segmentBtnSelected: { borderColor: "#1F355F", backgroundColor: "#1F355F" },
  segmentText: { fontSize: 13, color: "#64748B", fontWeight: "500" },
  segmentTextSelected: { color: "#FFFFFF", fontWeight: "bold" },
  finalIdentifyBtn: { backgroundColor: "#5B7576", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 20 },
  finalIdentifyBtnText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  disabledBtn: { backgroundColor: "#CBD5E1" },
});
