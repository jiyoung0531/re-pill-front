import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
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
const dateIcon = require("../assets/images/date.png");
const logoTextImg = require("../assets/images/logo2.png");
const pillIconPng = require("../assets/images/pill.png");
const bottleIconPng = require("../assets/images/bottle.png");
const powderIconPng = require("../assets/images/powder.png");
const bellIcon = require("../assets/images/bell.png");

type RoutineTime = "morning" | "lunch" | "dinner" | null;
type PillType = "pill" | "bottle" | "powder" | "envelope";

interface PillData {
  id: string;
  type: PillType;
  symptoms: string;
  extraInfo: string;
  expirationDate?: string;
  duplicatedWarning: string;
  is_routine: boolean;
  is_taken: boolean;
  routine_time?: RoutineTime;
}

interface PillLogItemRow {
  id: number;
  type: PillType | null;
  pill_name: string;
  extra_info: string | null;
  expiration_date: string | null;
  duplicated_warning: string | null;
  is_routine: boolean | null;
  is_taken: boolean | null;
  routine_time: RoutineTime;
  created_at: string | null;
}

const toPillData = (item: PillLogItemRow): PillData => ({
  id: String(item.id),
  type: item.type ?? "pill",
  symptoms: item.pill_name,
  extraInfo: item.extra_info ?? "",
  expirationDate: item.expiration_date ?? "",
  duplicatedWarning: item.duplicated_warning ?? "특이사항 없음",
  is_routine: item.is_routine ?? false,
  is_taken: item.is_taken ?? false,
  routine_time: item.routine_time ?? null,
});

// 💡 [오류 수정] 오타가 났던 ${date} 부분을 명확하게 ${day} 변수로 바르게 고쳤습니다!
const calculateRecommendedExpiry = (pillType: string): string => {
  const today = new Date();

  if (pillType === "pill") {
    today.setMonth(today.getMonth() + 2); 
  } else if (pillType === "bottle") {
    today.setDate(today.getDate() + 28);  
  } else if (pillType === "powder") {
    today.setDate(today.getDate() + 21);  
  } else {
    today.setMonth(today.getMonth() + 2); 
  }

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}.${month}.${day}`;
};

export default function StorageScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPill, setSelectedPill] = useState<PillData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [pills, setPills] = useState<PillData[]>([]);
  const [currentDateStr, setCurrentDateStr] = useState("");
  const [isManualModalVisible, setIsManualModalVisible] = useState(false);
  
  const [manualPill, setManualPill] = useState({
    symptoms: "",
    extraInfo: "",
    expirationDate: "",
    type: "pill" as PillType,
  });

  useEffect(() => {
    if (isManualModalVisible) {
      const autoDate = calculateRecommendedExpiry(manualPill.type);
      setManualPill((prev) => ({ ...prev, expirationDate: autoDate }));
    }
  }, [manualPill.type, isManualModalVisible]);

  const fetchStorageList = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let query = supabase
        .from("PillLogItems")
        .select(
          "id,type,pill_name,extra_info,expiration_date,duplicated_warning,is_routine,is_taken,routine_time,created_at,PillLogs(user_id)"
        )
        .order("created_at", { ascending: false });

      if (user) {
        query = query.eq("PillLogs.user_id", user.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      setPills(((data ?? []) as unknown as PillLogItemRow[]).map(toPillData));
    } catch (error: any) {
      console.error("fetch storage error:", error);
      Alert.alert("오류", error.message ?? "약 보관함을 불러오지 못했습니다.");
    }
  };

  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const date = String(today.getDate()).padStart(2, "0");
    setCurrentDateStr(`${year}.${month}.${date}`);
  }, []);

  useEffect(() => {
    fetchStorageList();
  }, []);

  useEffect(() => {
    if (params.updatedPill) {
      fetchStorageList();
    }
  }, [params.updatedPill]);

  const updateLocalPill = (pillId: string, patch: Partial<PillData>) => {
    setPills((prev) => prev.map((pill) => (pill.id === pillId ? { ...pill, ...patch } : pill)));
    setSelectedPill((prev) => (prev?.id === pillId ? { ...prev, ...patch } : prev));
  };

  const updateRoutineState = async (pillId: string, isRoutine: boolean, timeZone: RoutineTime) => {
    const previous = pills;
    updateLocalPill(pillId, { is_routine: isRoutine, routine_time: timeZone });

    try {
      const { error } = await supabase
        .from("PillLogItems")
        .update({
          is_routine: isRoutine,
          routine_time: isRoutine ? timeZone : null,
        })
        .eq("id", Number(pillId));

      if (error) throw error;
    } catch (error: any) {
      setPills(previous);
      console.error("routine update error:", error);
      Alert.alert("오류", error.message ?? "루틴 변경에 실패했습니다.");
    }
  };

  const handleToggleRoutine = (pillId: string) => {
    const targetPill = pills.find((pill) => pill.id === pillId);
    if (!targetPill) return;

    if (targetPill.is_routine) {
      updateRoutineState(pillId, false, null);
      return;
    }

    Alert.alert(
      "복용 시간 선택",
      "이 약을 언제 복용하시겠습니까?",
      [
        { text: "아침", onPress: () => updateRoutineState(pillId, true, "morning") },
        { text: "점심", onPress: () => updateRoutineState(pillId, true, "lunch") },
        { text: "저녁", onPress: () => updateRoutineState(pillId, true, "dinner") },
        { text: "취소", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const handleToggleTaken = async (pillId: string) => {
    const targetPill = pills.find((pill) => pill.id === pillId);
    if (!targetPill) return;

    const nextStatus = !targetPill.is_taken;
    const previous = pills;
    updateLocalPill(pillId, { is_taken: nextStatus });

    try {
      const { error } = await supabase
        .from("PillLogItems")
        .update({ is_taken: nextStatus })
        .eq("id", Number(pillId));

      if (error) throw error;
    } catch (error: any) {
      setPills(previous);
      console.error("taken update error:", error);
      Alert.alert("오류", error.message ?? "복용 상태 변경에 실패했습니다.");
    }
  };

  const handleManualSave = async () => {
    if (!manualPill.symptoms.trim()) {
      Alert.alert("입력 오류", "약 이름을 입력해 주세요.");
      return;
    }

    try {
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

      const { error } = await supabase.from("PillLogItems").insert({
        pill_log_id: log?.id ?? null,
        pill_name: manualPill.symptoms,
        type: manualPill.type,
        extra_info: manualPill.extraInfo || "사용자 직접 등록 의약품",
        expiration_date: manualPill.expirationDate,
        duplicated_warning: "특이사항 없음",
        is_routine: false,
        is_taken: false,
        routine_time: null,
      });

      if (error) throw error;

      setManualPill({ symptoms: "", extraInfo: "", expirationDate: "", type: "pill" });
      setIsManualModalVisible(false);
      await fetchStorageList();
      Alert.alert("등록 완료", "약이 보관함에 추가되었습니다.");
    } catch (error: any) {
      console.error("manual save error:", error);
      Alert.alert("오류", error.message ?? "약 등록에 실패했습니다.");
    }
  };

  const handleDeletePill = (pillId: string) => {
    Alert.alert("약 삭제 확인", "이 약을 보관함에서 삭제할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          const previous = pills;
          setModalVisible(false);
          setSelectedPill(null);
          setPills((prev) => prev.filter((pill) => pill.id !== pillId));

          try {
            const { error } = await supabase.from("PillLogItems").delete().eq("id", Number(pillId));
            if (error) throw error;
          } catch (error: any) {
            setPills(previous);
            console.error("delete pill error:", error);
            Alert.alert("오류", error.message ?? "약 삭제에 실패했습니다.");
          }
        },
      },
    ]);
  };

  const openDetailPopup = (pill: PillData) => {
    setSelectedPill(pill);
    setModalVisible(true);
  };

  const renderPillIcon = (type: PillType) => {
    const sourceImg =
      type === "bottle" || type === "envelope"
        ? bottleIconPng
        : type === "powder"
          ? powderIconPng
          : pillIconPng;

    return <Image source={sourceImg} style={styles.pillIconImg} />;
  };

  const renderItem = ({ item }: { item: PillData }) => (
    <View style={styles.pillCard}>
      <View style={styles.cardLeftSection}>
        <View style={styles.pillIconContainer}>{renderPillIcon(item.type)}</View>
        <View style={styles.cardTextWrapper}>
          <View style={styles.symptomsOutline}>
            <Text style={styles.symptomsText} numberOfLines={1}>
              {item.symptoms}
            </Text>
          </View>
          <Text style={styles.extraInfoText} numberOfLines={1}>
            {item.extraInfo}
          </Text>
        </View>
      </View>
      <TouchableOpacity style={styles.expandBtn} onPress={() => openDetailPopup(item)}>
        <Text style={styles.expandBtnText}>⤢</Text>
      </TouchableOpacity>
    </View>
  );

  const morningPill = pills.find((pill) => pill.is_routine && pill.routine_time === "morning");
  const lunchPill = pills.find((pill) => pill.is_routine && pill.routine_time === "lunch");
  const dinnerPill = pills.find((pill) => pill.is_routine && pill.routine_time === "dinner");

  const filteredPills = pills.filter((pill) => pill.symptoms.includes(searchQuery));

  return (
    <View style={styles.mainContainer}>
      <View style={styles.fixedHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerLogoWrapper}>
          <Image source={logoTextImg} style={styles.actualLogoText} />
        </View>

        <TouchableOpacity style={styles.headerAddButton} onPress={() => setIsManualModalVisible(true)}>
          <Text style={styles.headerAddButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredPills}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.dashboardCard}>
              <View style={styles.dateInputRow}>
                <Image source={dateIcon} style={styles.dateIcon} />
                <View style={styles.dateCapsule}>
                  <Text style={styles.dateText}>{currentDateStr}</Text>
                </View>
                <TouchableOpacity style={styles.bellBtn}>
                  <Image source={bellIcon} style={styles.bellIconStyle} />
                </TouchableOpacity>
              </View>

              <View style={styles.mealRoutineRow}>
                {[
                  ["아침", morningPill],
                  ["점심", lunchPill],
                  ["저녁", dinnerPill],
                ].map(([label, pill]) => {
                  const item = pill as PillData | undefined;
                  return (
                    <TouchableOpacity
                      key={label as string}
                      style={[styles.mealBox, item?.is_taken && styles.mealBoxCompleted]}
                      onPress={() => item && handleToggleTaken(item.id)}
                      disabled={!item}
                    >
                      <Text style={styles.mealTitle}>{label as string}</Text>
                      <Text style={styles.mealPillName} numberOfLines={2}>
                        {item ? item.symptoms.split(" ")[0] : "등록 없음"}
                      </Text>
                      {item && (
                        <View style={[styles.statusBadge, item.is_taken && styles.statusBadgeCompleted]}>
                          <Text style={[styles.statusBadgeText, item.is_taken && styles.statusBadgeTextCompleted]}>
                            {item.is_taken ? "복용완료" : "미복용"}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.searchBarContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="search"
                placeholderTextColor="#A8C9CB"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <Text style={styles.searchIcon}>⌕</Text>
            </View>
          </>
        }
        ListEmptyComponent={<Text style={styles.emptyText}>보관된 약이 없습니다.</Text>}
      />

      {/* 1️⃣ 상세 정보 확인 모달창 */}
      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentBox}>
            {/* 💥 [복구 완료] 첫 번째 사진 속 깨졌던 X 버튼 텍스트와 스타일 연결 복원! */}
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseBtnText}>x</Text>
            </TouchableOpacity>

            <View style={styles.modalTopRow}>
              <View style={styles.modalImageDummy}>
                <Text style={styles.imageDummyText}>약 사진</Text>
              </View>
              <View style={styles.modalMetaWrapper}>
                <View style={styles.modalIconAndTitleRow}>
                  <View style={styles.modalPillIconContainer}>
                    {selectedPill ? renderPillIcon(selectedPill.type) : null}
                  </View>
                  <View style={styles.modalSymptomsOutline}>
                    <Text style={styles.modalSymptomsText} numberOfLines={1}>
                      {selectedPill?.symptoms}
                    </Text>
                  </View>
                </View>
                <Text style={styles.expirationDateText}>{selectedPill?.expirationDate || "기한 정보 없음"}</Text>
              </View>
            </View>

            <View style={styles.modalDbDetailPanel}>
              <View>
                <Text style={styles.dbContentTextMain}>[효능정보]</Text>
                <Text style={styles.dbContentTextSub}>{selectedPill?.extraInfo}</Text>

                <Text style={styles.dbContentTextMain}>{"\n"}[중복/주의 정보]</Text>
                <Text style={styles.dbWarningText}>{selectedPill?.duplicatedWarning}</Text>
              </View>

              {selectedPill && (
                <View style={styles.modalActionRow}>
                  <TouchableOpacity
                    style={[styles.routineToggleBtn, selectedPill.is_routine && styles.routineToggleBtnActive]}
                    onPress={() => handleToggleRoutine(selectedPill.id)}
                  >
                    <Text
                      style={[
                        styles.routineToggleBtnText,
                        selectedPill.is_routine && styles.routineToggleBtnTextActive,
                      ]}
                    >
                      {selectedPill.is_routine ? "루틴 해제" : "루틴 등록"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.deletePillBtn} onPress={() => handleDeletePill(selectedPill.id)}>
                    <Text style={styles.deletePillBtnText}>약 삭제</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* 2️⃣ 수동 직접 등록 모달창 */}
      <Modal
        animationType="fade" // 💥 [복구 완료] 두 번째 사진 피드백 반영! 대각선 팝업 느낌을 내는 fade 원본 뼈대로 롤백!
        transparent
        visible={isManualModalVisible}
        onRequestClose={() => setIsManualModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentBox}>
            {/* 💥 [추가 복구] 직접 등록 창에도 쉽게 닫을 수 있도록 우측 상단 X 단추 레이아웃을 똑같이 적용해 두었습니다! */}
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setIsManualModalVisible(false)}>
              <Text style={styles.modalCloseBtnText}>x</Text>
            </TouchableOpacity>

            <Text style={styles.manualModalTitle}>의약품 직접 등록</Text>
            <Text style={styles.modalSubText}>카메라 인식이 어려우면 직접 입력해 주세요.</Text>

            <Text style={styles.fieldLabel}>약 종류 선택</Text>
            <View style={styles.typeButtonGroup}>
              <TouchableOpacity
                style={[styles.typeButton, manualPill.type === "pill" && styles.activeTypeButton]}
                onPress={() => setManualPill({ ...manualPill, type: "pill" })}
              >
                <Text style={[styles.typeButtonText, manualPill.type === "pill" && styles.activeTypeButtonText]}> 알약</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeButton, manualPill.type === "bottle" && styles.activeTypeButton]}
                onPress={() => setManualPill({ ...manualPill, type: "bottle" })}
              >
                <Text style={[styles.typeButtonText, manualPill.type === "bottle" && styles.activeTypeButtonText]}> 물약</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeButton, manualPill.type === "powder" && styles.activeTypeButton]}
                onPress={() => setManualPill({ ...manualPill, type: "powder" })}
              >
                <Text style={[styles.typeButtonText, manualPill.type === "powder" && styles.activeTypeButtonText]}> 가루약</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>약 이름 / 주요 증상</Text>
            <TextInput
              style={styles.modalInput}
              value={manualPill.symptoms}
              onChangeText={(text) => setManualPill({ ...manualPill, symptoms: text })}
              placeholder="예: 타이레놀"
              placeholderTextColor="#BAC7C8"
            />

            <Text style={styles.fieldLabel}>효능 설명</Text>
            <TextInput
              style={styles.modalInput}
              value={manualPill.extraInfo}
              onChangeText={(text) => setManualPill({ ...manualPill, extraInfo: text })}
              placeholder="예: 두통 완화"
              placeholderTextColor="#BAC7C8"
            />

            <Text style={styles.fieldLabel}>유통 기한 (종류 선택 시 자동 입력)</Text>
            <TextInput
              style={styles.modalInput}
              value={manualPill.expirationDate}
              onChangeText={(text) => setManualPill({ ...manualPill, expirationDate: text })}
              placeholder="예: 2026.12.31"
              placeholderTextColor="#BAC7C8"
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={[styles.popupBtn, styles.cancelBtn]} onPress={() => setIsManualModalVisible(false)}>
                <Text style={styles.cancelBtnText}>취소</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.popupBtn, styles.saveBtn]} onPress={handleManualSave}>
                <Text style={styles.saveBtnText}>보관함에 추가</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#BBE6E8" },
  fixedHeader: {
    height: 100,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 40,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#BBE6E8",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: { fontSize: 26, color: "#5C7A7C", fontWeight: "bold" },
  headerLogoWrapper: { flex: 1, alignItems: "center" },
  actualLogoText: { width: 145, height: 140, resizeMode: "contain" },
  headerAddButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#BBE6E8",
    alignItems: "center",
    justifyContent: "center",
  },
  headerAddButtonText: { fontSize: 22, color: "#5C7A7C", fontWeight: "bold" },
  scrollContentContainer: { paddingHorizontal: 24, paddingBottom: 40 },
  dashboardCard: { backgroundColor: "#fff", borderRadius: 24, padding: 22, marginTop: 20, width: "100%", elevation: 2 },
  dateInputRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  dateCapsule: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: "#BBE6E8",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  dateText: { color: "#5C7A7C", fontSize: 15, fontWeight: "600" },
  bellBtn: { marginLeft: 14, marginRight: 3 },
  bellIconStyle: { width: 50, height: 50, resizeMode: "contain" },
  dateIcon: { marginRight: 5 },
  mealRoutineRow: { flexDirection: "row", justifyContent: "space-between" },
  mealBox: {
    flex: 0.31,
    backgroundColor: "#E0F4F5",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
    alignItems: "center",
    minHeight: 110,
    justifyContent: "space-between",
  },
  mealBoxCompleted: { backgroundColor: "#F0F4F4", borderColor: "#E0E5E5" },
  mealTitle: { fontSize: 15, fontWeight: "bold", color: "#466365", marginTop: 4 },
  mealPillName: { fontSize: 13, fontWeight: "700", color: "#2C3E50", marginVertical: 6, textAlign: "center", lineHeight: 16 },
  statusBadge: { backgroundColor: "#FFE082", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginBottom: 4 },
  statusBadgeCompleted: { backgroundColor: "#C8E6C9" },
  statusBadgeText: { fontSize: 10, color: "#F57C00", fontWeight: "bold" },
  statusBadgeTextCompleted: { color: "#388E3C" },
  searchBarContainer: {
    backgroundColor: "#fff",
    height: 44,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
  },
  searchInput: { flex: 1, fontSize: 16, color: "#5C7A7C" },
  searchIcon: { fontSize: 32, color: "#5C7A7C" },
  emptyText: { textAlign: "center", color: "#5C7A7C", fontWeight: "600", marginTop: 20 },
  pillCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    height: 85,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  cardLeftSection: { flexDirection: "row", alignItems: "center", flex: 0.9 },
  cardTextWrapper: { flex: 1 },
  symptomsOutline: {
    borderWidth: 1.5,
    borderColor: "#5A72A5",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    alignSelf: "flex-start",
    maxWidth: "95%",
  },
  symptomsText: { fontSize: 13.8, fontWeight: "600", color: "#3B4E75" },
  extraInfoText: { fontSize: 13.5, color: "#FFA629", marginTop: 4, fontWeight: "500" },
  expandBtn: { padding: 6 },
  expandBtnText: { fontSize: 30, color: "#5A72A5", fontWeight: "bold" },
  pillIconImg: { width: 40, height: 43, resizeMode: "contain" },
  pillIconContainer: { marginRight: 12, justifyContent: "center", alignItems: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.4)", justifyContent: "center", alignItems: "center" },
  modalContentBox: { width: SCREEN_WIDTH * 0.85, backgroundColor: "#fff", borderRadius: 24, padding: 20, position: "relative" },
  modalCloseBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: "#7D92B6",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  modalCloseBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  modalTopRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, marginTop: 10 },
  modalImageDummy: {
    width: 80,
    height: 80,
    backgroundColor: "#C4C4C4",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  imageDummyText: { fontSize: 12, color: "#fff", fontWeight: "600" },
  modalMetaWrapper: { flex: 1 },
  modalIconAndTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  modalPillIconContainer: { marginRight: 8, justifyContent: "center", alignItems: "center" },
  modalSymptomsOutline: {
    borderWidth: 1.5,
    borderColor: "#5A72A5",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    flex: 1,
  },
  modalSymptomsText: { fontSize: 13, fontWeight: "600", color: "#3B4E75" },
  expirationDateText: { fontSize: 13, color: "#FFA629", fontWeight: "500", paddingLeft: 4 },
  modalDbDetailPanel: {
    borderWidth: 1.5,
    borderColor: "#5A72A5",
    borderRadius: 18,
    padding: 16,
    minHeight: 280,
    justifyContent: "space-between",
  },
  dbContentTextMain: { fontSize: 13, fontWeight: "bold", color: "#3B4E75" },
  dbContentTextSub: { fontSize: 12, color: "#555", marginTop: 4, lineHeight: 16 },
  dbWarningText: { fontSize: 12, color: "#D32F2F", fontWeight: "600", marginTop: 4, lineHeight: 16 },
  modalActionRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 14, width: "100%" },
  routineToggleBtn: {
    flex: 0.52,
    backgroundColor: "#E0F4F5",
    borderRadius: 12,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BBE6E8",
  },
  routineToggleBtnActive: { backgroundColor: "#ECEFF1", borderColor: "#CFD8DC" },
  routineToggleBtnText: { color: "#466365", fontWeight: "bold", fontSize: 13 },
  routineToggleBtnTextActive: { color: "#607D8B" },
  deletePillBtn: {
    flex: 0.44,
    backgroundColor: "#FFEBEE",
    borderRadius: 12,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  deletePillBtnText: { color: "#C62828", fontWeight: "bold", fontSize: 13 },
  manualModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F355F",
    marginBottom: 6,
    textAlign: "center",
  },
  modalSubText: { fontSize: 12, color: "#7AA0A2", marginBottom: 20, textAlign: "center" },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#5C7A7C",
    marginBottom: 6,
    marginTop: 5,
  },
  modalInput: {
    width: "100%",
    height: 44,
    borderWidth: 1.5,
    borderColor: "#E8F3F4",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#FCFDFD",
  },
  modalButtonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  popupBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtn: { backgroundColor: "#F5F8F8", marginRight: 10 },
  cancelBtnText: { color: "#7AA0A2", fontWeight: "bold", fontSize: 15 },
  saveBtn: { backgroundColor: "#BBE6E8" },
  saveBtnText: { color: "#1F355F", fontWeight: "bold", fontSize: 15 },
  typeButtonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 4,
  },
  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginHorizontal: 4,
    backgroundColor: "#F8FAFC",
  },
  typeButtonText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  
  activeTypeButton: {
    borderColor: "#1F355F",
    backgroundColor: "#1F355F",
  },
  activeTypeButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});
