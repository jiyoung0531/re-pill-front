import { useRouter } from "expo-router";
import React, { useState } from "react";
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
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ⭐️ 백엔드 DB 연동용 임시 데이터 포맷 구성
interface PillData {
  id: string;
  type: "pill" | "bottle" | "powder"; // 시안 속 아이콘 구분을 위한 타입
  symptoms: string;                  // 약 이름 및 효과 (주요 증상)
  extraInfo: string;                 // 추가 간단 설명
  expirationDate?: string;            // 제조 기한 / 유효 기간
  duplicatedWarning: string;         // 중복 약 성질 경고 정보 등 (DB용)
  pillImageUrl: string;              // 약 사진 URL (지금은 회색 박스로 대체)
}

const dummyPills: PillData[] = [
  { id: "1", type: "pill", symptoms: "종합감기약 (타이레놀)", extraInfo: "두통, 발열, 오한 완화", expirationDate: "2028.12.31까지", duplicatedWarning: "⚠️ 아세트아미노펜 중복 복용 주의!", pillImageUrl: "" },
  { id: "2", type: "bottle", symptoms: "소화제 (까스활명수)", extraInfo: "식욕부진, 위부팽만감 개선", duplicatedWarning: "특이사항 없음", pillImageUrl: "" },
  { id: "3", type: "powder", symptoms: "지사제 (스멕타)", extraInfo: "급만성 설사 증상 완화", expirationDate: "2026.10.15까지", duplicatedWarning: "⚠️ 다른 약과 2시간 간격 유지 권장", pillImageUrl: "" },
  { id: "4", type: "bottle", symptoms: "비타민D 영양제", extraInfo: "뼈 형성 및 골다공증위험 감소", expirationDate: "2028.01.01까지", duplicatedWarning: "특이사항 없음", pillImageUrl: "" },
  { id: "5", type: "pill", symptoms: "알레르기 비염약", extraInfo: "콧물, 재채기, 가려움증 완화", expirationDate: "2027.11.30까지", duplicatedWarning: "⚠️ 항히스타민제 포함 (졸음 유발 가능)", pillImageUrl: "" },
];

// 에셋 이미지 경로 (프로젝트 환경에 맞게 매칭하세요)
const logoTextImg = require("../assets/images/logo2.png"); 
const pillIconPng = require("../assets/images/pill.png");    
const bottleIconPng = require("../assets/images/bottle.png"); 
const powderIconPng = require("../assets/images/powder.png");


export default function StorageScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPill, setSelectedPill] = useState<PillData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // 확대 버튼 클릭 시 팝업 열기
  const openDetailPopup = (pill: PillData) => {
    setSelectedPill(pill);
    setModalVisible(true);
  };

  // 약 타입별 임시 기호/텍스트 아이콘 리턴 (시안 이미지의 일러스트 매칭용 구역)
const renderPillIcon = (type: string, isModal: boolean = false) => {
    let sourceImg;

    switch (type) {
      case "pill":
        sourceImg = pillIconPng;
        break;
      case "bottle":
        sourceImg = bottleIconPng;
        break;
      case "powder":
        sourceImg = powderIconPng;
        break;
      default:
        sourceImg = pillIconPng; // 예외 처리용 기본값
  }
    return <Image source={sourceImg} style={styles.pillIconImg} />;
  };

  // 리스트의 각 아이템 렌더링 함수
  const renderItem = ({ item }: { item: PillData }) => (
    <View style={styles.pillCard}>
      <View style={styles.cardLeftSection}>
        <Text style={styles.pillIconEmoji}>{renderPillIcon(item.type)}</Text>
        <View style={styles.cardTextWrapper}>
          <View style={styles.symptomsOutline}>
            <Text style={styles.symptomsText} numberOfLines={1}>{item.symptoms}</Text>
          </View>
          <Text style={styles.extraInfoText}>{item.extraInfo}</Text>
        </View>
      </View>
      {/* ⭐️ 시안의 우측 상단 확대 버튼 축소판 */}
      <TouchableOpacity style={styles.expandBtn} onPress={() => openDetailPopup(item)}>
        <Text style={styles.expandBtnText}>↖↘</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      {/* 📌 고정 헤더 영역 (시안 상단 UI 100% 반영) */}
      <View style={styles.fixedHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerLogoWrapper}>
          <Image source={logoTextImg} style={styles.actualLogoText} />
        </View>
        <View style={styles.headerRightSpacer} />
      </View>

      {/* 📌 스크롤이 가능한 영역 시작 (FlatList 내부에 ListHeaderComponent 활용) */}
      <FlatList
        data={dummyPills.filter(p => p.symptoms.includes(searchQuery))}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        // 헤더 영역 바로 하단의 복용 대시보드와 검색창을 스크롤 최상단에 묶어 배치!
        ListHeaderComponent={
          <>
            {/* 아침, 점심 복용 체크 보드 현황 */}
            <View style={styles.dashboardCard}>
              <View style={styles.dateInputRow}>
                <Text style={styles.calendarIcon}>📅</Text>
                <View style={styles.dateCapsule}>
                  <Text style={styles.dateText}>2026.05.23</Text>
                </View>
                <TouchableOpacity style={styles.bellBtn}>
                  <Text style={styles.bellIcon}>🔔</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.mealRoutineRow}>
                <View style={styles.mealBox}>
                  <Text style={styles.mealTitle}>아침</Text>
                  <Text style={styles.mealPillName}>name: 감기약</Text>
                  <View style={styles.statusBadge}><Text style={styles.statusBadgeText}>복용완료</Text></View>
                </View>
                <View style={styles.mealBox}>
                  <Text style={styles.mealTitle}>점심</Text>
                  <Text style={styles.mealPillName}>name: 비타민</Text>
                  <View style={styles.statusBadge}><Text style={styles.statusBadgeText}>복용완료</Text></View>
                </View>
              </View>
            </View>

            {/* 검색 필터 바 */}
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

      {/* 📌 [시안 2번째 탭 완벽 재현] 상세 정보 팝업 모달 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentBox}>
            {/* 우측 상단 닫기 X 버튼 */}
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseBtnText}>✕</Text>
            </TouchableOpacity>

            {/* 상단: 이미지 + 기본 증상 텍스트 행 */}
            <View style={styles.modalTopRow}>
              <View style={styles.modalImageDummy}>
                <Text style={styles.imageDummyText}>약 사진</Text>
              </View>
              <View style={styles.modalMetaWrapper}>
                <View style={styles.modalIconAndTitleRow}>
                  <Text style={styles.modalPillIcon}>{selectedPill ? renderPillIcon(selectedPill.type) : ""}</Text>
                  <View style={styles.modalSymptomsOutline}>
                    <Text style={styles.modalSymptomsText} numberOfLines={1}>
                      {selectedPill?.symptoms}
                    </Text>
                  </View>
                </View>
                <Text style={styles.expirationDateText}>{selectedPill?.expirationDate}</Text>
              </View>
            </View>

            {/* 하단: 백엔드에서 긁어오는 상세 DB 정보 판넬 콘텐트 */}
            <View style={styles.modalDbDetailPanel}>
              <Text style={styles.dbContentTextMain}>[약효정보]</Text>
              <Text style={styles.dbContentTextSub}>{selectedPill?.extraInfo}</Text>
              
              <Text style={styles.dbContentTextMain}>{"\n"}[의약품 안전성 정보 (DB)]</Text>
              <Text style={styles.dbWarningText}>{selectedPill?.duplicatedWarning}</Text>
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
    backgroundColor: "#BBE6E8", // 앱의 시그니처 연민트 배경색 통일
  },
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
  backButtonText: {
    fontSize: 18,
    color: "#5C7A7C",
    fontWeight: "bold",
  },
  headerLogoWrapper: {
    flex: 1,
    alignItems: "center",
  },
  actualLogoText: {
    width: 145,
    height: 138,
    resizeMode: "contain",
  },
  headerRightSpacer: {
    width: 40, // 좌측 뒤로가기 버튼과 정렬 밸런스용 빈 공간
  },
  scrollContentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  dashboardCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    marginTop: 20,
    width: "100%",
  },
  dateInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  calendarIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  dateCapsule: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#BBE6E8",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  dateText: {
    color: "#5C7A7C",
    fontSize: 14,
  },
  bellBtn: {
    backgroundColor: "#D9EFF0",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  bellIcon: {
    fontSize: 16,
  },
  mealRoutineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  mealBox: {
    flex: 0.47,
    backgroundColor: "#E0F4F5",
    borderRadius: 16,
    padding: 12,
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#466365",
  },
  mealPillName: {
    fontSize: 11,
    color: "#5C7A7C",
    marginVertical: 4,
  },
  statusBadge: {
    backgroundColor: "#FFF2AC",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  statusBadgeText: {
    fontSize: 10,
    color: "#F6A800",
    fontWeight: "bold",
  },
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
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#5C7A7C",
  },
  searchIcon: {
    fontSize: 16,
    color: "#5C7A7C",
  },
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
  cardLeftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 0.9,
  },
  pillIconEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  cardTextWrapper: {
    flex: 1,
  },
  symptomsOutline: {
    borderWidth: 1.5,
    borderColor: "#5A72A5",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    alignSelf: "flex-start",
    maxWidth: "95%",
  },
  symptomsText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3B4E75",
  },
  extraInfoText: {
    fontSize: 11,
    color: "#FFA629",
    marginTop: 4,
    fontWeight: "500",
  },
  expandBtn: {
    padding: 6,
  },
  expandBtnText: {
    fontSize: 14,
    color: "#5A72A5",
    fontWeight: "bold",
  },
  // 📌 팝업 모달 레이어 전용 스타일시트
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)", // 뒷배경 어둡게 블러 처리 효과
    justifyContent: "center",
    alignItems: "center",
  },
  modalContentBox: {
    width: SCREEN_WIDTH * 0.85,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    position: "relative",
  },
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
  modalCloseBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  modalTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 10,
  },
  modalImageDummy: {
    width: 80,
    height: 80,
    backgroundColor: "#C4C4C4",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  imageDummyText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  modalMetaWrapper: {
    flex: 1,
  },
  modalIconAndTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  modalPillIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  modalSymptomsOutline: {
    borderWidth: 1.5,
    borderColor: "#5A72A5",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    flex: 1,
  },
  modalSymptomsText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3B4E75",
  },
  expirationDateText: {
    fontSize: 13,
    color: "#FFA629",
    fontWeight: "500",
    paddingLeft: 4,
  },
  modalDbDetailPanel: {
    borderWidth: 1.5,
    borderColor: "#5A72A5",
    borderRadius: 18,
    padding: 16,
    minHeight: 220,
  },
  dbContentTextMain: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#3B4E75",
  },
  dbContentTextSub: {
    fontSize: 12,
    color: "#555",
    marginTop: 4,
    lineHeight: 16,
  },
  dbWarningText: {
    fontSize: 12,
    color: "#D32F2F",
    fontWeight: "600",
    marginTop: 4,
    lineHeight: 16,
  },
  // 🎨 기존 modalPillIconImg와 cardPillIconImg를 지우고 하나로 통일!
  pillIconImg: {
    width: 38,         // 카드와 모달 양쪽에 다 잘 어울리는 황금 사이즈 30!
    height: 38,
    resizeMode: "contain",
  },
  pillIconContainer: {
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  modalPillIconContainer: {
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});