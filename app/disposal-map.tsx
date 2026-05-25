import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps"; 
import * as Location from "expo-location"; 
import { supabase } from "../supabaseClient";
import { API_BASE_URL } from "../constants/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const targetIcon = require("../assets/images/target.png");
const listIcon = require("../assets/images/list.png");
const pillIcon = require("../assets/images/pill.png");
const SUPABASE_FUNCTIONS_BASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") || API_BASE_URL;

interface BinItem {
  bin_name: string;
  address: string;
  distance: number;
  latitude: number; 
  longitude: number; 
}

const DEFAULT_LOCATION = {
  latitude: 37.5665,
  longitude: 126.978,
};

const getDistanceMeters = (
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number
) => {
  const earthRadius = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(latitudeB - latitudeA);
  const dLon = toRad(longitudeB - longitudeA);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(latitudeA)) * Math.cos(toRad(latitudeB)) * Math.sin(dLon / 2) ** 2;

  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export default function MapScreen() {
  const router = useRouter();
  const [latitude, setLatitude] = useState(String(DEFAULT_LOCATION.latitude));
  const [longitude, setLongitude] = useState(String(DEFAULT_LOCATION.longitude));
  const [targetLocation, setTargetLocation] = useState("");
  const [binList, setBinList] = useState<BinItem[]>([]);
  const [infoVisible, setInfoVisible] = useState(false);
  const [showList, setShowList] = useState(true);

  const [targetBin, setTargetBin] = useState<BinItem | null>(null);

  const [mapRegion, setMapRegion] = useState({
    latitude: DEFAULT_LOCATION.latitude,
    longitude: DEFAULT_LOCATION.longitude,
    latitudeDelta: 0.007,
    longitudeDelta: 0.007,
  });

useEffect(() => {
  (async () => {
    // 1. 폰에 "위치 권한을 허용하시겠습니까?" 팝업을 강제로 띄우고 상태를 받아옵니다.
    let { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== "granted") {
      Alert.alert("권한 거부", "위치 권한을 허용해야 현재 위치 기준 수거함을 찾을 수 있습니다.");
      fetchNearestBins(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
      return;
    }

    // 3. 사용자가 [허용]을 누르면 아래로 내려가 진짜 GPS 좌표를 구합니다.
    let currentPosition = await Location.getCurrentPositionAsync({});
      const currentLat = currentPosition.coords.latitude;
      const currentLng = currentPosition.coords.longitude;

      setLatitude(String(currentLat));
      setLongitude(String(currentLng));
      
      setMapRegion({
        latitude: currentLat,
        longitude: currentLng,
        latitudeDelta: 0.007,
        longitudeDelta: 0.007,
      });

      fetchNearestBins(currentLat, currentLng);
    })();
  }, []);

  const fetchNearestBins = async (nextLatitude = Number(latitude), nextLongitude = Number(longitude)) => {
  if (!Number.isFinite(nextLatitude) || !Number.isFinite(nextLongitude)) {
    Alert.alert("입력 오류", "위치 좌표가 올바르지 않습니다.");
    return;
  }

  try {
    // 💥 [수정] 수파베이스 클라우드 펑션은 anon 키(입장권)를 헤더에 넣어줘야 문을 열어줍니다!
    const response = await fetch(
    `${SUPABASE_FUNCTIONS_BASE_URL}/functions/v1/find-pharmacy?lat=${nextLatitude}&lng=${nextLongitude}`,
  {
    method: "GET",
    headers: {
      Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ""}`,
    },
  }
);

    if (!response.ok) {
      throw new Error(`서버 응답 실패 (에러코드: ${response.status})`);
    }
    
    const data = await response.json(); 
    console.log("find-pharmacy response:", JSON.stringify(data, null, 2));

    const pharmacyList = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.pharmacies)
          ? data.pharmacies
          : Array.isArray(data?.results)
            ? data.results
            : [];

    // 백엔드가 주는 실제 데이터 가공
    const formattedList = pharmacyList.map((item: any) => ({
      bin_name: item.binName || item.bin_name || "수거함 약국", 
      address: item.address || "주소 정보 없음",
      latitude: parseFloat(item.latitude),
      longitude: parseFloat(item.longitude),
      distance: item.distanceKm ? Math.round(item.distanceKm * 1000) : (item.distance || 0), 
    })).filter((item: BinItem) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude));

    setBinList(formattedList);
    setTargetLocation(formattedList[0]?.bin_name ?? "");
    
    if (formattedList.length > 0) {
      setTargetBin(formattedList[0]); 
    }

    if (formattedList[0]) {
      setMapRegion({
        latitude: nextLatitude,
        longitude: nextLongitude,
        latitudeDelta: 0.007,
        longitudeDelta: 0.007,
      });
    }
  } catch (error: any) {
    console.error("fetch bins error:", error);
    Alert.alert("오류", error.message ?? "수거함 목록을 불러오지 못했습니다.");
  }
};

const handleMoveToNearestPharmacy = () => {
    if (!binList || binList.length === 0) {
      Alert.alert("알림", "가까운 수거함을 먼저 조회해 주세요.");
      return;
    }

    const nearest = binList[0];

    setTargetBin(nearest);
    setTargetLocation(nearest.bin_name);

    setMapRegion({
      latitude: nearest.latitude,
      longitude: nearest.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
  };

  const handleFindRoute = () => {
    if (!targetBin) {
      Alert.alert("알림", "가까운 수거함을 먼저 조회해 주세요.");
      return;
    }
    Alert.alert("길찾기", `목적지: ${targetBin.bin_name}`);
  };

  const handleShowList = () => {
    setShowList(!showList); 
    if (!showList) {
      fetchNearestBins(); 
    }
  };

  return (
    <View style={styles.mainContainer}>
      {/* ✂️ 우측 상단 물음표(?) 동그라미 버튼 코드를 삭제했습니다. */}

      <Modal
        animationType="fade"
        transparent
        visible={infoVisible}
        onRequestClose={() => setInfoVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBody}>
            <Image source={pillIcon} />
            <Text style={styles.modalTitle}>올바른 폐의약품 배출 방법</Text>

            <View style={styles.infoRow}>
              <Text style={styles.pillType}>알약</Text>
              <Text style={styles.pillDesc}>포장재를 제거하고 알약만 모아 배출해 주세요.</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.pillType}>물약</Text>
              <Text style={styles.pillDesc}>새지 않게 원래 병에 모아 배출해 주세요.</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.pillType}>가루약</Text>
              <Text style={styles.pillDesc}>포장지를 뜯지 말고 그대로 모아 배출해 주세요.</Text>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={() => setInfoVisible(false)}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.mapViewPlaceholder}>
        <MapView 
          style={StyleSheet.absoluteFillObject} 
          region={mapRegion}
          onRegionChangeComplete={setMapRegion}
          showsUserLocation={true} 
        >
          {binList.map((bin, index) => (
            <Marker
              key={`${bin.bin_name}-${index}`}
              coordinate={{ latitude: bin.latitude, longitude: bin.longitude }}
              title={bin.bin_name}
              description={bin.address}
              pinColor={index === 0 ? "orange" : "red"} 
              onPress={() => {
                setTargetBin(bin);
                setTargetLocation(bin.bin_name);
              }}
            />
          ))}
        </MapView>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.floatingListBtn} onPress={handleShowList}>
          <Image source={listIcon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.floatingLocationBtn} onPress={handleMoveToNearestPharmacy}>
          <Image source={targetIcon} />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSheetContainer}>
        <View style={styles.archBody}>
          <View style={styles.formContainer}>
            <View style={styles.capsuleInputWrapper}>
              <Text style={styles.inputLabel}>수거함</Text>
              <TextInput
                style={styles.input}
                placeholder="가까운 수거함 자동 표시"
                placeholderTextColor="#A8C9CB"
                value={targetLocation}
                onChangeText={setTargetLocation}
              />
            </View>

            {/* 🆕 [수거함] 창 바로 밑에 [올바른 폐기 방법] 버튼 추가 */}
            <TouchableOpacity 
              style={styles.infoLinkButton} 
              onPress={() => setInfoVisible(true)}
            >
              <Text style={styles.infoLinkButtonText}>올바른 폐기 방법</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.capsuleBtn} onPress={handleMoveToNearestPharmacy}>
              <Text style={styles.btnText}>내 위치</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.capsuleBtn} onPress={handleFindRoute}>
              <Text style={styles.btnText}>길찾기</Text>
            </TouchableOpacity>
          </View>

          {showList && (
            <FlatList
              data={binList}
              keyExtractor={(item) => `${item.bin_name}-${item.address}`}
              style={styles.binList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.binItem}
                  onPress={() => {
                    setTargetBin(item);
                    setTargetLocation(item.bin_name);
                    setMapRegion({
                      latitude: item.latitude,
                      longitude: item.longitude,
                      latitudeDelta: 0.005,
                      longitudeDelta: 0.005,
                    });
                  }}
                >
                  <Text style={styles.binName}>{item.bin_name}</Text>
                  <Text style={styles.binAddress}>{item.address}</Text>
                  <Text style={styles.binDistance}>{item.distance.toLocaleString()}m</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>조회된 수거함이 없습니다.</Text>}
            />
          )}

          <Text style={styles.bottomLogoText}>RE:PILL</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#BBE6E8",
  },
  mapViewPlaceholder: {
    flex: 1,
    backgroundColor: "#0F1012",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
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
    zIndex: 10,
  },
  backButtonText: {
    fontSize: 26,
    color: "#5C7A7C",
    fontWeight: "bold",
  },
  floatingListBtn: {
    position: "absolute",
    bottom: 20,
    left: 20,
    zIndex: 10,
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
    zIndex: 10,
  },
  bottomSheetContainer: {
    backgroundColor: "#BBE6E8",
    width: "100%",
    paddingBottom: Platform.OS === "ios" ? 24 : 16,
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
    backgroundColor: "#fff",
  },
  /* 🆕 [올바른 폐기 방법] 버튼 전용 스타일 추가 */
  infoLinkButton: {
    width: "100%",
    height: 44,
    backgroundColor: "#F4FAFA", // 수거함 창 및 버튼들과 어울리는 밝은 민트톤 배후색
    borderWidth: 1,
    borderColor: "#BBE6E8",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10, // 수거함 입력창과의 간격 유지
  },
  infoLinkButtonText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#5C7A7C", // 기존 메인 텍스트 컬러 통일
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
    marginBottom: 12,
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
  binList: {
    width: "100%",
    maxHeight: 150,
  },
  binItem: {
    borderTopWidth: 1,
    borderTopColor: "#E8F3F4",
    paddingVertical: 8,
  },
  binName: {
    color: "#1F355F",
    fontSize: 13,
    fontWeight: "bold",
  },
  binAddress: {
    color: "#5C7A7C",
    fontSize: 12,
    marginTop: 2,
  },
  binDistance: {
    color: "#FFA629",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 2,
  },
  emptyText: {
    color: "#7AA0A2",
    fontSize: 12,
    textAlign: "center",
    paddingVertical: 12,
  },
  bottomLogoText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#7D92B6",
    letterSpacing: 1,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: {
    width: SCREEN_WIDTH * 0.85,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    width: "100%",
  },
  pillType: {
    width: 50,
    fontWeight: "bold",
    color: "#5C7A7C",
    backgroundColor: "#BBE6E8",
    textAlign: "center",
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 10,
    overflow: "hidden",
  },
  pillDesc: {
    flex: 1,
    fontSize: 15,
    color: "#666",
    lineHeight: 18,
  },
  closeButton: {
    marginTop: 15,
    backgroundColor: "#5C7A7C",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
});
