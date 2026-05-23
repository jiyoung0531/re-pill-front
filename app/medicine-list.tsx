import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const dateIcon = require("../assets/images/date.png");

// 데이터 인터페이스 정의
interface PillData {
  id: string;
  type: "pill" | "bottle" | "powder"; 
  symptoms: string;          
  extraInfo: string;         
  expirationDate?: string;    
  duplicatedWarning: string; 
  is_routine: boolean;       
  is_taken: boolean;         
  routine_time?: "morning" | "lunch" | "dinner" | null; 
}

// [데이터 휘발 차단 전역 저장소]
let globalPillsMemo: PillData[] = [
  { id: "1", type: "pill", symptoms: "종합감기약 (타이레놀)", extraInfo: "두통, 발열, 오한 완화", expirationDate: "2028.12.31까지", duplicatedWarning: "⚠️ 아세트아미노펜 중복 복용 주의!", is_routine: true, is_taken: false, routine_time: "morning" },
  { id: "2", type: "bottle", symptoms: "소화제 (까스활명수)", extraInfo: "식욕부진, 위부팽만감 개선", duplicatedWarning: "특이사항 없음", is_routine: true, is_taken: false, routine_time: "lunch" },
  { id: "3", type: "powder", symptoms: "지사제 (스멕타)", extraInfo: "급만성 설사 증상 완화", expirationDate: "2026.10.15까지", duplicatedWarning: "⚠️ 다른 약과 2시간 간격 유지 권장", is_routine: false, is_taken: false, routine_time: null },
  { id: "4", type: "bottle", symptoms: "비타민D 영양제", extraInfo: "뼈 형성 및 골다공증위험 감소", expirationDate: "2028.01.01까지", duplicatedWarning: "특이사항 없음", is_routine: false, is_taken: false, routine_time: null },
  { id: "5", type: "pill", symptoms: "알레르기 비염약", extraInfo: "콧물, 재채기, 가려움증 완화", expirationDate: "2027.11.30까지", duplicatedWarning: "⚠️ 항히스타민제 포함 (졸음 유발 가능)", is_routine: false, is_taken: false, routine_time: null },
];

const logoTextImg = require("../assets/images/logo2.png"); 
const pillIconPng = require("../assets/images/pill.png");    
const bottleIconPng = require("../assets/images/bottle.png"); 
const powderIconPng = require("../assets/images/powder.png");
const bellIcon = require("../assets/images/bell.png");

export default function StorageScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); 

  // 상태 관리 변수
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPill, setSelectedPill] = useState<PillData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [pills, setPills] = useState<PillData[]>(globalPillsMemo);
  const [isLoading, setIsLoading] = useState(false);

  const [currentDateStr, setCurrentDateStr] = useState("");
  const [isManualModalVisible, setIsManualModalVisible] = useState(false);
  
  // 수동 입력 필드 상태 변수
  const [manualPill, setManualPill] = useState({
    symptoms: "",
    extraInfo: "",
    expirationDate: "",
    type: "pill" as "pill" | "bottle" | "powder"
  });

  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const date = String(today.getDate()).padStart(2, "0");
    setCurrentDateStr(`${year}.${month}.${date}`);
  }, []);

  useEffect(() => {
    globalPillsMemo = pills;
  }, [pills]);

  // 최신순 목록 조회 (GET)
  const fetchStorageList = async () => {
    try {
      setIsLoading(true);
      const apiUrl = "http://192.168.0.100:5000/api/storage"; 
      const response = await fetch(apiUrl);
      const data = await response.json();
      if (data.pillList) setPills(data.pillList); 
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // fetchStorageList(); 
  }, []);

  // 카메라 데이터 수신 및 중복 방지 
  useEffect(() => {
    if (params.updatedPill) {
      try {
        const newPill = JSON.parse(params.updatedPill as string);
        const isAlreadyAdded = globalPillsMemo.some(
          (p) => p.symptoms === newPill.symptoms && p.extraInfo === newPill.extraInfo
        );

        if (!isAlreadyAdded) {
          const formattedPill: PillData = {
            id: String(Date.now()), 
            type: newPill.type || "pill",
            symptoms: newPill.symptoms,
            extraInfo: newPill.extraInfo,
            expirationDate: newPill.expirationDate,
            duplicatedWarning: newPill.duplicatedWarning || "특이사항 없음",
            is_routine: false, 
            is_taken: false, 
            routine_time: null, 
          };
          const updatedList = [formattedPill, ...globalPillsMemo];
          globalPillsMemo = updatedList;
          setPills(updatedList);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [params.updatedPill]);

  // 시간대 선택 Alert
  const handleToggleRoutine = (pillId: string) => {
    const targetPill = pills.find((p) => p.id === pillId);
    if (!targetPill) return;

    if (targetPill.is_routine) {
      updateRoutineState(pillId, false, null);
      Alert.alert("알림 해제", "매일 복용 루틴에서 제외되었습니다.");
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

  // 루틴 처리 API 구역
  const updateRoutineState = async (pillId: string, isRoutine: boolean, timeZone: "morning" | "lunch" | "dinner" | null) => {
    setPills((prev) =>
      prev.map((p) => (p.id === pillId ? { ...p, is_routine: isRoutine, routine_time: timeZone } : p))
    );
    if (selectedPill && selectedPill.id === pillId) {
      setSelectedPill((prev) => prev ? { ...prev, is_routine: isRoutine, routine_time: timeZone } : null);
    }
  };

  // 복용 완료 토글 API 구역
  const handleToggleTaken = async (pillId: string) => {
    const targetPill = pills.find((p) => p.id === pillId);
    if (!targetPill) return;
    const nextStatus = !targetPill.is_taken;
    setPills((prev) =>
      prev.map((p) => (p.id === pillId ? { ...p, is_taken: nextStatus } : p))
    );
  };

  // 수동 등록
  const handleManualSave = () => {
    if (!manualPill.symptoms.trim()) {
      Alert.alert("입력 오류", "최소한 약 이름은 입력해 주셔야 합니다!");
      return;
    }

    const newManualPill: PillData = {
      id: String(Date.now()),
      type: manualPill.type,
      symptoms: manualPill.symptoms,
      extraInfo: manualPill.extraInfo || "사용자 직접 등록 의약품",
      expirationDate: manualPill.expirationDate ? `${manualPill.expirationDate}까지` : "기한 정보 없음",
      duplicatedWarning: "특이사항 없음",
      is_routine: false,
      is_taken: false,
      routine_time: null,
    };

    const updatedList = [newManualPill, ...globalPillsMemo];
    globalPillsMemo = updatedList;
    setPills(updatedList);

    // 상태 초기화 및 닫기
    setManualPill({ symptoms: "", extraInfo: "", expirationDate: "", type: "pill" });
    setIsManualModalVisible(false);
    Alert.alert("등록 완료", "직접 입력하신 약이 보관함에 안전하게 추가되었습니다!");
  }; 


  const handleDeletePill = (pillId: string) => {
    Alert.alert(
      "약 삭제 확인",
      "정말로 이 약을 보관함에서 완전히 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        { 
          text: "삭제", 
          style: "destructive", 
          onPress: async () => {
            setModalVisible(false);
            const filteredList = pills.filter((p) => p.id !== pillId);
            globalPillsMemo = filteredList; // 전역 데이터 필터 삭제
            setPills(filteredList);         // 화면 상태 동기화
            setSelectedPill(null);

            // 🚀 실제 백엔드 연동 DELETE 구역 (나중에 서버 완성되면 이 블록 주석만 푸세요!)
            try {
              /*
              const response = await fetch("http://192.168.0.100:5000/api/storage", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: pillId }),
              });
              if (!response.ok) {
                Alert.alert("오류", "서버 약 삭제 통신에 실패했습니다.");
              }
              */
            } catch (error) {
              console.error("삭제 통신 에러:", error);
            }
          }
        }
      ]
    );
  };

  const openDetailPopup = (pill: PillData) => {
    setSelectedPill(pill);
    setModalVisible(true);
  };

  const renderPillIcon = (type: string) => {
    let sourceImg;
    switch (type) {
      case "pill": sourceImg = pillIconPng; break;
      case "bottle": sourceImg = bottleIconPng; break;
      case "powder": sourceImg = powderIconPng; break;
      default: sourceImg = pillIconPng;
    }
    return <Image source={sourceImg} style={styles.pillIconImg} />;
  };

  const renderItem = ({ item }: { item: PillData }) => (
    <View style={styles.pillCard}>
      <View style={styles.cardLeftSection}>
        <View style={styles.pillIconContainer}>{renderPillIcon(item.type)}</View>
        <View style={styles.cardTextWrapper}>
          <View style={styles.symptomsOutline}>
            <Text style={styles.symptomsText} numberOfLines={1}>{item.symptoms}</Text>
          </View>
          <Text style={styles.extraInfoText}>{item.extraInfo}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.expandBtn} onPress={() => openDetailPopup(item)}>
        <Text style={styles.expandBtnText}>↖↘</Text>
      </TouchableOpacity>
    </View>
  );

  const morningPill = pills.find((p) => p.is_routine && p.routine_time === "morning");
  const lunchPill = pills.find((p) => p.is_routine && p.routine_time === "lunch");
  const dinnerPill = pills.find((p) => p.is_routine && p.routine_time === "dinner");

  return (
    <View style={styles.mainContainer}>
      <View style={styles.fixedHeader}>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.headerLogoWrapper}>
          <Image source={logoTextImg} style={styles.actualLogoText} />
        </View>
        
        <TouchableOpacity 
          style={styles.headerAddButton} 
          onPress={() => setIsManualModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.headerAddButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={pills.filter((p) => p.symptoms.includes(searchQuery))}
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
                  <Text style={styles.dateText}>{currentDateStr || "날짜 로딩 중..."}</Text>
                </View>
                <TouchableOpacity style={styles.bellBtn}>
                  <Image source={bellIcon} style={styles.bellIconStyle} />
                </TouchableOpacity>
              </View>

              <View style={styles.mealRoutineRow}>
                {/* 1. 아침 박스 */}
                <TouchableOpacity 
                  style={[styles.mealBox, morningPill?.is_taken && styles.mealBoxCompleted]}
                  onPress={() => morningPill && handleToggleTaken(morningPill.id)}
                  disabled={!morningPill}
                >
                  <Text style={styles.mealTitle}>아침</Text>
                  <Text style={styles.mealPillName} numberOfLines={2}>
                    {morningPill ? morningPill.symptoms.split(" ")[0] : "등록 없음"}
                  </Text>
                  {morningPill && (
                    <View style={[styles.statusBadge, morningPill.is_taken && styles.statusBadgeCompleted]}>
                      <Text style={[styles.statusBadgeText, morningPill.is_taken && styles.statusBadgeTextCompleted]}>
                        {morningPill.is_taken ? "복용완료" : "미복용"}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* 2. 점심 박스 */}
                <TouchableOpacity 
                  style={[styles.mealBox, lunchPill?.is_taken && styles.mealBoxCompleted]}
                  onPress={() => lunchPill && handleToggleTaken(lunchPill.id)}
                  disabled={!lunchPill}
                >
                  <Text style={styles.mealTitle}>점심</Text>
                  <Text style={styles.mealPillName} numberOfLines={2}>
                    {lunchPill ? lunchPill.symptoms.split(" ")[0] : "등록 없음"}
                  </Text>
                  {lunchPill && (
                    <View style={[styles.statusBadge, lunchPill.is_taken && styles.statusBadgeCompleted]}>
                      <Text style={[styles.statusBadgeText, lunchPill.is_taken && styles.statusBadgeTextCompleted]}>
                        {lunchPill.is_taken ? "복용완료" : "미복용"}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* 3. 저녁 박스 */}
                <TouchableOpacity 
                  style={[styles.mealBox, dinnerPill?.is_taken && styles.mealBoxCompleted]}
                  onPress={() => dinnerPill && handleToggleTaken(dinnerPill.id)}
                  disabled={!dinnerPill}
                >
                  <Text style={styles.mealTitle}>저녁</Text>
                  <Text style={styles.mealPillName} numberOfLines={2}>
                    {dinnerPill ? dinnerPill.symptoms.split(" ")[0] : "등록 없음"}
                  </Text>
                  {dinnerPill && (
                    <View style={[styles.statusBadge, dinnerPill.is_taken && styles.statusBadgeCompleted]}>
                      <Text style={[styles.statusBadgeText, dinnerPill.is_taken && styles.statusBadgeTextCompleted]}>
                        {dinnerPill.is_taken ? "복용완료" : "미복용"}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
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
              <Text style={styles.searchIcon}>🔍</Text>
            </View>
          </>
        }
      />

      {/* 상세 정보 모달 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentBox}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseBtnText}>✕</Text>
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

            {/*  패널 내부 레이아웃 */}
            <View style={styles.modalDbDetailPanel}>
              <View>
                <Text style={styles.dbContentTextMain}>[약효정보]</Text>
                <Text style={styles.dbContentTextSub}>{selectedPill?.extraInfo}</Text>
                
                <Text style={styles.dbContentTextMain}>{"\n"}[의약품 안전성 정보 (DB)]</Text>
                <Text style={styles.dbWarningText}>{selectedPill?.duplicatedWarning}</Text>
              </View>

              {/* 루틴 조절 버튼과 약 완전 취소(삭제) 레이아웃 */}
              {selectedPill && (
                <View style={styles.modalActionRow}>
                  <TouchableOpacity 
                    style={[styles.routineToggleBtn, selectedPill.is_routine && styles.routineToggleBtnActive]}
                    onPress={() => handleToggleRoutine(selectedPill.id)}
                  >
                    <Text style={[styles.routineToggleBtnText, selectedPill.is_routine && styles.routineToggleBtnTextActive]}>
                      {selectedPill.is_routine ? "⏰ 루틴 해제" : "🔔 루틴 등록"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.deletePillBtn}
                    onPress={() => handleDeletePill(selectedPill.id)}
                  >
                    <Text style={styles.deletePillBtnText}>약 삭제</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isManualModalVisible} // 헤더 우측 ＋ 버튼을 누르면 이 친구가 켜집니다!
        onRequestClose={() => setIsManualModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentBox}>
            <Text style={styles.manualModalTitle}>✍️ 의약품 직접 등록</Text>
            <Text style={styles.modalSubText}>카메라 인식이 어려울 때 직접 정보를 입력해 주세요.</Text>

            <Text style={styles.fieldLabel}>약 이름 / 주요 증상 (필수)</Text>
            <TextInput
              style={styles.modalInput}
              value={manualPill.symptoms}
              onChangeText={(text) => setManualPill({ ...manualPill, symptoms: text })}
              placeholder="예: 타이레놀, 소화제 등"
              placeholderTextColor="#BAC7C8"
            />

            <Text style={styles.fieldLabel}>약효 및 효능 설명</Text>
            <TextInput
              style={styles.modalInput}
              value={manualPill.extraInfo}
              onChangeText={(text) => setManualPill({ ...manualPill, extraInfo: text })}
              placeholder="예: 두통약, 식후 복용 등"
              placeholderTextColor="#BAC7C8"
            />

            <Text style={styles.fieldLabel}>유통 기한</Text>
            <TextInput
              style={styles.modalInput}
              value={manualPill.expirationDate}
              onChangeText={(text) => setManualPill({ ...manualPill, expirationDate: text })}
              placeholder="예: 2026.12.31"
              placeholderTextColor="#BAC7C8"
            />

            {/* 팝업창 하단 버튼 레이어 */}
            <View style={styles.modalButtonRow}>
              <TouchableOpacity 
                style={[styles.popupBtn, styles.cancelBtn]} 
                onPress={() => setIsManualModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>취소</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.popupBtn, styles.saveBtn]} 
                onPress={handleManualSave}
              >
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
  fixedHeader: { height: 100, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 40, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#EAEAEA" },
  backButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: "#BBE6E8", alignItems: "center", justifyContent: "center" },
  backButtonText: { fontSize: 18, color: "#5C7A7C", fontWeight: "bold" },
  headerLogoWrapper: { flex: 1, alignItems: "center" },
  actualLogoText: { width: 145, height: 140, resizeMode: "contain" },
  headerRightSpacer: { width: 40 },
  scrollContentContainer: { paddingHorizontal: 24, paddingBottom: 40 },
  
  dashboardCard: { backgroundColor: "#fff", borderRadius: 24, padding: 22, marginTop: 20, width: "100%", elevation: 2 },
  dateInputRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  dateCapsule: { flex: 1, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: "#BBE6E8", justifyContent: "center", paddingHorizontal: 16 },
  dateText: { color: "#5C7A7C", fontSize: 15, fontWeight: "600" },
  
  bellBtn: { marginLeft: 14, marginRight: 3 },
  bellIconStyle: { width: 50, height: 50, resizeMode: "contain" },
  
  mealRoutineRow: { flexDirection: "row", justifyContent: "space-between" },
  
  mealBox: { flex: 0.31, backgroundColor: "#E0F4F5", borderRadius: 18, padding: 12, borderWidth: 1.5, borderColor: "transparent", alignItems: 'center', minHeight: 110, justifyContent: 'space-between' },
  mealBoxCompleted: { backgroundColor: "#F0F4F4", borderColor: "#E0E5E5" },
  mealTitle: { fontSize: 15, fontWeight: "bold", color: "#466365", marginTop: 4 },
  mealPillName: { fontSize: 13, fontWeight: "700", color: "#2C3E50", marginVertical: 6, textAlign: 'center', lineHeight: 16 },
  statusBadge: { backgroundColor: "#FFE082", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginBottom: 4 },
  statusBadgeCompleted: { backgroundColor: "#C8E6C9" },
  statusBadgeText: { fontSize: 10, color: "#F57C00", fontWeight: "bold" },
  statusBadgeTextCompleted: { color: "#388E3C" },
  
  searchBarContainer: { backgroundColor: "#fff", height: 44, borderRadius: 22, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginTop: 16, marginBottom: 20 },
  searchInput: { flex: 1, fontSize: 14, color: "#5C7A7C" },
  searchIcon: { fontSize: 16, color: "#5C7A7C" },
  pillCard: { backgroundColor: "#fff", borderRadius: 20, height: 85, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 12 },
  cardLeftSection: { flexDirection: "row", alignItems: "center", flex: 0.9 },
  cardTextWrapper: { flex: 1 },
  symptomsOutline: { borderWidth: 1.5, borderColor: "#5A72A5", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2, alignSelf: "flex-start", maxWidth: "95%" },
  symptomsText: { fontSize: 13.8, fontWeight: "600", color: "#3B4E75" },
  extraInfoText: { fontSize: 13.5, color: "#FFA629", marginTop: 4, fontWeight: "500" },
  expandBtn: { padding: 6 },
  expandBtnText: { fontSize: 14, color: "#5A72A5", fontWeight: "bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.4)", justifyContent: "center", alignItems: "center" },
  modalContentBox: { width: SCREEN_WIDTH * 0.85, backgroundColor: "#fff", borderRadius: 24, padding: 20, position: "relative" },
  modalCloseBtn: { position: "absolute", top: 14, right: 14, backgroundColor: "#7D92B6", width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", zIndex: 10 },
  modalCloseBtnText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  modalTopRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, marginTop: 10 },
  modalImageDummy: { width: 80, height: 80, backgroundColor: "#C4C4C4", borderRadius: 16, alignItems: "center", justifyContent: "center", marginRight: 14 },
  imageDummyText: { fontSize: 12, color: "#fff", fontWeight: "600" },
  modalMetaWrapper: { flex: 1 },
  modalIconAndTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  modalSymptomsOutline: { borderWidth: 1.5, borderColor: "#5A72A5", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2, flex: 1 },
  modalSymptomsText: { fontSize: 13, fontWeight: "600", color: "#3B4E75" },
  expirationDateText: { fontSize: 13, color: "#FFA629", fontWeight: "500", paddingLeft: 4 },
  

  modalDbDetailPanel: { borderWidth: 1.5, borderColor: "#5A72A5", borderRadius: 18, padding: 16, minHeight: 280, justifyContent: 'space-between' },
  dbContentTextMain: { fontSize: 13, fontWeight: "bold", color: "#3B4E75" },
  dbContentTextSub: { fontSize: 12, color: "#555", marginTop: 4, lineHeight: 16 },
  dbWarningText: { fontSize: 12, color: "#D32F2F", fontWeight: "600", marginTop: 4, lineHeight: 16 },
  pillIconImg: { width: 40, height: 43, resizeMode: "contain" },
  pillIconContainer: { marginRight: 12, justifyContent: "center", alignItems: "center" },
  modalPillIconContainer: { marginRight: 8, justifyContent: "center", alignItems: "center" },
  dateIcon: { marginRight: 5 },
  
 
  modalActionRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 14, width: '100%' },
  routineToggleBtn: { flex: 0.52, backgroundColor: "#E0F4F5", borderRadius: 12, height: 40, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#BBE6E8" },
  routineToggleBtnActive: { backgroundColor: "#ECEFF1", borderColor: "#CFD8DC" },
  routineToggleBtnText: { color: "#466365", fontWeight: "bold", fontSize: 13 },
  routineToggleBtnTextActive: { color: "#607D8B" },
  
  deletePillBtn: { flex: 0.44, backgroundColor: "#FFEBEE", borderRadius: 12, height: 40, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#FFCDD2" },
  deletePillBtnText: { color: "#C62828", fontWeight: "bold", fontSize: 13 },
  headerAddButton: {width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: "#BBE6E8", alignItems: "center", justifyContent: "center" },
  headerAddButtonText: { fontSize: 22, color: "#5C7A7C", fontWeight: "bold" },
  manualModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F355F",
    marginBottom: 6,
    textAlign: "center",
  },
  modalSubText: {
    fontSize: 12,
    color: "#7AA0A2",
    marginBottom: 20,
    textAlign: "center",
  },

  // ✍️ [추가] 입력창(TextInput) 레이아웃
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
    backgroundColor: "#FCFDFD", // 부드러운 인풋 배경색 가미
  },

  // 🗂️ [추가] 하단 버튼 행 레이아웃 구조
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  popupBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#F5F8F8", // 연한 그레이빛 취소 배경
    marginRight: 10,
  },
  cancelBtnText: {
    color: "#7AA0A2",
    fontWeight: "bold",
    fontSize: 15,
  },
  saveBtn: {
    backgroundColor: "#BBE6E8", // RE:PILL 메인 포인트 민트 컬러와 일치화
  },
  saveBtnText: {
    color: "#1F355F",
    fontWeight: "bold",
    fontSize: 15,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#5C7A7C",
    marginBottom: 6,
    marginTop: 5,
  },
});