import { useRouter } from "expo-router";
import React, { useState } from "react";
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
import { supabase } from "../supabaseClient";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const targetIcon = require("../assets/images/target.png");
const listIcon = require("../assets/images/list.png");
const pillIcon = require("../assets/images/pill.png");

interface BinItem {
  bin_name: string;
  address: string;
  distance: number;
  latitude?: number;
  longitude?: number;
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

  const fetchNearestBins = async (nextLatitude = Number(latitude), nextLongitude = Number(longitude)) => {
    if (!Number.isFinite(nextLatitude) || !Number.isFinite(nextLongitude)) {
      Alert.alert("입력 오류", "위도와 경도를 숫자로 입력해 주세요.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("disposal_bins")
        .select("bin_name,address,latitude,longitude");

      if (error) throw error;

      const formattedList = (data ?? [])
        .map((item: any) => ({
          bin_name: item.bin_name,
          address: item.address,
          latitude: item.latitude,
          longitude: item.longitude,
          distance: getDistanceMeters(nextLatitude, nextLongitude, item.latitude, item.longitude),
        }))
        .sort((a, b) => a.distance - b.distance);

      setBinList(formattedList);
      setTargetLocation(formattedList[0]?.bin_name ?? "");
    } catch (error: any) {
      console.error("fetch bins error:", error);
      Alert.alert("오류", error.message ?? "수거함 목록을 불러오지 못했습니다.");
    }
  };

  const handleAutoInput = () => {
    setLatitude(String(DEFAULT_LOCATION.latitude));
    setLongitude(String(DEFAULT_LOCATION.longitude));
    fetchNearestBins(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
  };

  const handleFindRoute = () => {
    if (!targetLocation) {
      Alert.alert("알림", "가까운 수거함을 먼저 조회해 주세요.");
      return;
    }

    Alert.alert("길찾기", `목적지: ${targetLocation}`);
  };

  const handleShowList = () => {
    fetchNearestBins();
  };

  return (
    <View style={styles.mainContainer}>
      <TouchableOpacity style={styles.questionButton} onPress={() => setInfoVisible(true)}>
        <Text style={styles.questionText}>?</Text>
      </TouchableOpacity>

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
        <Text style={styles.mapDummyText}>MAP AREA</Text>
        <Text style={styles.mapSubDummyText}>
          {binList[0] ? `가장 가까운 수거함: ${binList[0].bin_name}` : "수거함 목록을 조회해 주세요"}
        </Text>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.floatingListBtn} onPress={handleShowList}>
          <Image source={listIcon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.floatingLocationBtn} onPress={handleAutoInput}>
          <Image source={targetIcon} />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSheetContainer}>
        <View style={styles.archBody}>
          <View style={styles.formContainer}>
            <View style={styles.coordinateRow}>
              <View style={[styles.capsuleInputWrapper, styles.coordinateInput]}>
                <Text style={styles.inputLabel}>위도</Text>
                <TextInput
                  style={styles.input}
                  value={latitude}
                  onChangeText={setLatitude}
                  keyboardType="numeric"
                  placeholder="37.5665"
                  placeholderTextColor="#A8C9CB"
                />
              </View>

              <View style={[styles.capsuleInputWrapper, styles.coordinateInput]}>
                <Text style={styles.inputLabel}>경도</Text>
                <TextInput
                  style={styles.input}
                  value={longitude}
                  onChangeText={setLongitude}
                  keyboardType="numeric"
                  placeholder="126.978"
                  placeholderTextColor="#A8C9CB"
                />
              </View>
            </View>

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
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.capsuleBtn} onPress={handleAutoInput}>
              <Text style={styles.btnText}>내 위치</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.capsuleBtn} onPress={handleFindRoute}>
              <Text style={styles.btnText}>길찾기</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={binList}
            keyExtractor={(item) => `${item.bin_name}-${item.address}`}
            style={styles.binList}
            renderItem={({ item }) => (
              <View style={styles.binItem}>
                <Text style={styles.binName}>{item.bin_name}</Text>
                <Text style={styles.binAddress}>{item.address}</Text>
                <Text style={styles.binDistance}>{item.distance.toLocaleString()}m</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>조회된 수거함이 없습니다.</Text>}
          />

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
  mapDummyText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4A525A",
    letterSpacing: 2,
  },
  mapSubDummyText: {
    fontSize: 12,
    color: "#69717A",
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
    fontSize: 26,
    color: "#5C7A7C",
    fontWeight: "bold",
  },
  floatingListBtn: {
    position: "absolute",
    bottom: 20,
    left: 20,
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
  coordinateRow: {
    flexDirection: "row",
    gap: 10,
  },
  coordinateInput: {
    flex: 1,
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
  questionButton: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "#BBE6E8",
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
  },
  questionText: {
    color: "#5C7A7C",
    fontSize: 18,
    fontWeight: "bold",
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
