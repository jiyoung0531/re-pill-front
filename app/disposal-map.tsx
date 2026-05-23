import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  Image,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const targetIcon = require('../assets/images/target.png');
const listIcon = require('../assets/images/list.png');

export default function MapScreen() {
  const router = useRouter();

  // 입력값 상태 관리
  const [myLocation, setMyLocation] = useState("");
  const [targetLocation, setTargetLocation] = useState("");

  // [데모용 치트키 1] 내위치 자동입력 시뮬레이션
  const handleAutoInput = () => {
    setMyLocation("서울시 성북구 화랑로 81"); // 시연용 더미 주소 입력
    setTargetLocation("성북구보건소 약품 수거함 (가장 가까움)");
  };

  // [데모용 치트키 2] 길찾기 버튼 클릭 시
  const handleFindRoute = () => {
    if (!myLocation.trim()) {
      alert("내 위치를 먼저 입력하거나 자동입력 버튼을 눌러주세요!");
      return;
    }
    alert(`📍 길찾기 시작\n출발: ${myLocation}\n도착: ${targetLocation || "가까운 수거함"}\n\n(백엔드 API 연동 시 실제 경로 안내로 전환됩니다.)`);
  };

  // [데모용 치트키 3] 목록 버튼 클릭 시
  const handleShowList = () => {
    alert("인근 500m 내에 3개의 폐의약품 수거함(보건소, 주민센터, 지정약국)이 검색되었습니다.");
  };

  return (
    <View style={styles.mainContainer}>
      
      {/* 📌 1. 지도 뷰 영역 (시안의 상단 거대한 검은색/어두운 영역 반영) */}
      {/* 실제 react-native-maps나 네이버/카카오 지도 API 연동 시 이 View 내부를 교체하게 됩니다. */}
      <View style={styles.mapViewPlaceholder}>
        <Text style={styles.mapDummyText}>🗺️ MAP AREA</Text>
        <Text style={styles.mapSubDummyText}>(API 연동 시 실제 지도가 렌더링됩니다)</Text>

        {/* 좌측 상단: 뒤로가기 버튼 */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        {/* 지도 위 플로팅 버튼 1: 좌측 하단 목록 버튼 */}
        <TouchableOpacity style={styles.floatingListBtn} onPress={handleShowList}>
          <Image source={listIcon}/>
        </TouchableOpacity>

        {/* 지도 위 플로팅 버튼 2: 우측 하단 내위치 트래킹 아이콘 버튼 */}
        <TouchableOpacity style={styles.floatingLocationBtn} onPress={handleAutoInput}>
          <Image source={targetIcon} />
        </TouchableOpacity>
      </View>

      {/* 📌 2. 하단 레이어: 연민트 바닥 위에 얹어진 하얀색 라운드 아치 폼 박스 */}
      <View style={styles.bottomSheetContainer}>
        <View style={styles.archBody}>
          
          {/* 인풋창 랩퍼 구역 */}
          <View style={styles.formContainer}>
            
            {/* 내위치 입력창 */}
            <View style={styles.capsuleInputWrapper}>
              <Text style={styles.inputLabel}>내위치:</Text>
              <TextInput
                style={styles.input}
                placeholder="지정 안 됨"
                placeholderTextColor="#A8C9CB"
                value={myLocation}
                onChangeText={setMyLocation}
              />
            </View>

            {/* 수거할 위치 입력창 */}
            <View style={styles.capsuleInputWrapper}>
              <Text style={styles.inputLabel}>수거할 위치:</Text>
              <TextInput
                style={styles.input}
                placeholder="내위치 입력 시 가까운 수거함 자동 매칭"
                placeholderTextColor="#A8C9CB"
                value={targetLocation}
                onChangeText={setTargetLocation}
              />
            </View>

          </View>

          {/* 하단 기능성 버튼 행 */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.capsuleBtn} onPress={handleAutoInput}>
              <Text style={styles.btnText}>내위치 자동입력</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.capsuleBtn} onPress={handleFindRoute}>
              <Text style={styles.btnText}>길찾기</Text>
            </TouchableOpacity>
          </View>

          {/* 최하단 시그니처 텍스트 로고 마킹 */}
          <Text style={styles.bottomLogoText}>RE:PILL</Text>

        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#BBE6E8", // 앱의 시그니처 연민트 배경색
  },
  // 🗺️ 상단 고정 지도 영역 디자인 (시안 반영)
  mapViewPlaceholder: {
    flex: 1,
    backgroundColor: "#0F1012", // 시안 속 어두운 느낌의 완벽 가짜 지도 백그라운드
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  mapDummyText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4A525A",
    letterSpacing: 2,
  },
  mapSubDummyText: {
    fontSize: 12,
    color: "#333A42",
    marginTop: 6,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  backButtonText: {
    fontSize: 20,
    color: "#5C7A7C",
    fontWeight: "bold",
  },
  floatingListBtn: {
    position: "absolute",
    bottom: 20,
    left: 20,
  },
  floatingListBtnText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#5C7A7C",
  },
  floatingLocationBtn: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#fff",
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  floatingLocationIcon: {
    fontSize: 16,
  },
  
  // 🤍 하단 라운드 아치 패널 폼 섹션 (시안 100% 매칭)
  bottomSheetContainer: {
    backgroundColor: "#BBE6E8",
    width: "100%",
    paddingBottom: Platform.OS === "ios" ? 24 : 16, // 노치 디자인 최하단 패딩 세이프티
  },
  archBody: {
    backgroundColor: "#fff",
    marginHorizontal: 14,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 16,
    alignItems: "center",
  },
  formContainer: {
    width: "100%",
    marginBottom: 14,
  },
  capsuleInputWrapper: {
    width: "100%",
    height: 50,
    borderWidth: 1.5,
    borderColor: "#BBE6E8",
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#A8C9CB",
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: "#5C7A7C",
    paddingVertical: 0,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 18,
  },
  capsuleBtn: {
    flex: 0.48,
    height: 42,
    backgroundColor: "#BBE6E8",
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
  },
  bottomLogoText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#7D92B6",
    letterSpacing: 1,
    marginTop: 4,
  },

});