import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../supabaseClient";
import { useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const camIcon = require("../assets/images/camera.png");
const saveIcon = require("../assets/images/save.png");
const mapIcon = require("../assets/images/map.png");
const characterImg = require("../assets/images/char.png");
const logoTextImg = require("../assets/images/logo2.png");

export default function MainScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const [expiredPillList, setExpiredPillList] = useState<string[]>([]);

  const getTomorrowDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return `${tomorrow.getFullYear()}.${String(tomorrow.getMonth() + 1).padStart(2, "0")}.${String(tomorrow.getDate()).padStart(2, "0")}`;
  };

const loadPillsFromStorage = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let query = supabase
        .from("PillLogItems")
        .select("pill_name, expiration_date, PillLogs(user_id)");

      if (user) {
        query = query.eq("PillLogs.user_id", user.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data && data.length > 0) {
        const tomorrowStr = getTomorrowDateString(); // YYYY.MM.DD
        
        // 내일 만료되는 약들만 싹 필터링
        const urgentPills = data.filter((pill: any) => {
          const pillDate = pill.expiration_date ? pill.expiration_date.trim() : "";
          return pillDate === tomorrowStr;
        });

        if (urgentPills.length > 0) {
          // 🌟 2. 내일 만료되는 약의 이름들만 딱 골라서 배열로 주머니에 쏙 넣기!
          // 예: ["펙수클루정40mg", "타이레놀정"]
          const names = urgentPills.map((p: any) => p.pill_name);
          setExpiredPillList(names);
        } else {
          setExpiredPillList([]);
        }
      } else {
        setExpiredPillList([]);
      }
    } catch (error) {
      console.error("메인화면 백엔드 데이터 로드 에러:", error);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadPillsFromStorage();
    }
  }, [isFocused]);

 return (
    <View style={styles.landingContainer}>
      {/* 1. 상단 로고 텍스트 영역 */}
      <LinearGradient
        colors={['#BBE6E8', '#FFEB8D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.landingHeader} 
      >
        <Image source={logoTextImg} style={styles.actualLogoText} />

       {/* 🟢 2. 캐릭터 위치 및 개별 명시 알림 쪽지 겹치기 구역 */}
        <View style={[styles.characterAbsoluteContainer, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="box-none">
          {/* 캐릭터 펭귄 이미지 기본 출력 */}
          <Image source={characterImg} style={styles.actualCharacterImage} />

          {/* 💌 내일 만료되는 약 리스트가 1개라도 들어있으면 알림 박스 오픈! */}
          {expiredPillList.length > 0 && (
            <View style={{
              position: 'absolute',
              bottom: 20,           // 캐릭터 위에 붕 띄우는 높이
              backgroundColor: 'rgba(255, 240, 240, 0.99)', 
              borderWidth: 1.5,
              borderColor: '#FFC1C1', 
              borderRadius: 18, 
              paddingVertical: 12,  
              paddingHorizontal: 18, 
              flexDirection: 'column', // 🌟 한 줄씩 아래로 쌓이도록 열(Column) 방향 설정!
              alignItems: 'flex-start', // 왼쪽 정렬로 가독성 업
              justifyContent: 'center',
              elevation: 5,         
              shadowColor: "#000",  
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.18,
              shadowRadius: 6,
              maxWidth: SCREEN_WIDTH * 0.9, 
              zIndex: 9999,
            }}>
              {/* 🌟 배열에 담긴 약 이름들을 반복문(.map) 돌려서 하나씩 명시해 줍니다! */}
              {expiredPillList.map((pillName, index) => (
                <View 
                  key={`${pillName}-${index}`} 
                  style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center',
                    marginTop: index > 0 ? 6 : 0 // 두 번째 약부터 위쪽 여백 살짝 줘서 줄간격 띄우기
                  }}
                >
                  <Ionicons name="warning" size={16} color="#FF6B6B" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 15, color: '#333', fontWeight: '500' }} numberOfLines={1}>
                    <Text style={{ fontWeight: 'bold', color: '#1F355F' }}>{pillName}</Text>의 유통기한이 <Text style={{ color: '#FF4A4A', fontWeight: 'bold' }}>1일</Text> 남았습니다!
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 3. 상단과 하단 아치 사이 공간 확보 */}
        <View style={{ flex: 4 }} />

        {/* 4. 하단 레이어: 하얀색 큰 아치(원형) 본문 */}
        <View style={styles.archBody}>
          {/* 스캔(카메라) 버튼 */}
          <TouchableOpacity
            style={styles.mainScanBtn}
            onPress={() => router.push("/scan")}
          >
            <Image source={camIcon} style={styles.mainScanIcon} />    
          </TouchableOpacity>

          <View style={styles.subBtnRow}>
            {/* 1. 보관함(약 목록) 버튼 */}
            <TouchableOpacity
              style={styles.subMenuItem}
              onPress={() => router.push("/medicine-list")}
            >
              <View style={styles.iconWrapper}>
                <Image source={saveIcon} style={styles.subIconBtn} />
              </View>
              <Text style={styles.subMenuText}>보관함</Text>
            </TouchableOpacity>

            {/* 2. 폐기 지도 버튼 */}
            <TouchableOpacity
              style={styles.subMenuItem}
              onPress={() => router.push("/disposal-map")}
            >
              <View style={styles.iconWrapper}>
                <Image source={mapIcon} style={styles.subIconBtn} />
              </View>
              <Text style={styles.subMenuText}>폐기 지도</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  landingContainer: {
    flex: 1,
  },
  landingHeader: {
    flex: 4.8,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 75,
    backgroundColor: "transparent",
  },
  actualLogoText: {
    width: 350,
    height: 320,
    resizeMode: "stretch",
    marginTop: -45,
  },
  characterAbsoluteContainer: {
    position: "absolute",
    top: "38%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  actualCharacterImage: {
    width: 190,
    height: 190,
    resizeMode: "contain",
  },
  archBody: {
    flex: 35,
    backgroundColor: "#fff",
    borderTopLeftRadius: SCREEN_WIDTH * 0.8,
    borderTopRightRadius: SCREEN_WIDTH * 0.8,
    alignItems: "center",
    paddingHorizontal: 35,
    paddingTop: 100, 
    justifyContent: "flex-start", 
  },

  mainScanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: 110,
    height: 110,
    paddingVertical: 18,
    marginBottom: 25, 
    elevation: 3,
  },
  mainScanIcon: {
    width: 220,
    height: 220,
  
    resizeMode: "contain",
  },
  mainScanText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F355F",
  },

  
  subBtnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
  },
  subMenuItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  iconWrapper: {
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  subIconBtn: {
    width: 75,
    height: 75,
    resizeMode: "contain",
  },
  subMenuText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F355F",
    textAlign: "center",
  },
});
