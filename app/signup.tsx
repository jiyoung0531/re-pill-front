import { useRouter } from "expo-router";
import React, { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../supabaseClient";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const characterImg = require("../assets/images/char.png");

export default function SignUpScreen() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState("");
  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");

  const handleSignUp = async () => {
    if (!id || !password || !passwordCheck || !name || !birth) {
      Alert.alert("알림", "모든 정보를 입력해 주세요.");
      return;
    }

    if (password !== passwordCheck) {
      Alert.alert("알림", "비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: `${id}@repill.com`,
        password,
        options: {
          data: {
            login_id: id,
            name,
            birth,
          },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error("회원 정보를 생성하지 못했습니다.");

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        email: data.user.email,
        login_id: id,
        name,
        birth: birth.replaceAll(".", "-"),
      });

      if (profileError) throw profileError;

      Alert.alert("성공", "회원가입이 완료되었습니다.", [
        { text: "확인", onPress: () => router.replace("/") },
      ]);
    } catch (error: any) {
      console.error("signup error:", error);
      Alert.alert("회원가입 실패", error.message ?? "회원가입 중 오류가 발생했습니다.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <LinearGradient
        colors={["#BBE6E8", "#FFEB8D"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <View style={styles.archBodyBackground} pointerEvents="none" />
            <View style={styles.avatarContainer}>
              <Image source={characterImg} style={styles.characterImage} />
            </View>

            <View style={styles.formContainer}>
              <View style={styles.whiteInputWrapper}>
                <Text style={styles.inputLabel}>아이디</Text>
                <TextInput
                  style={styles.input}
                  value={id}
                  onChangeText={setId}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.whiteInputWrapper}>
                <Text style={styles.inputLabel}>비밀번호</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.whiteInputWrapper}>
                <Text style={styles.inputLabel}>비밀번호 확인</Text>
                <TextInput
                  style={styles.input}
                  value={passwordCheck}
                  onChangeText={setPasswordCheck}
                  secureTextEntry
                />
              </View>

              <View style={styles.mintBorderInputWrapper}>
                <Text style={styles.mintBorderInputLabel}>이름</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} />
              </View>

              <View style={styles.mintBorderInputWrapper}>
                <Text style={styles.mintBorderInputLabel}>생년월일</Text>
                <TextInput
                  style={styles.input}
                  value={birth}
                  onChangeText={setBirth}
                  placeholder="YYYY.MM.DD"
                  placeholderTextColor="#A8C9CB"
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity style={styles.signUpBtn} onPress={handleSignUp}>
                <Text style={styles.signUpBtnText}>회원가입</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 50,
  },
  archBodyBackground: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 418,
    backgroundColor: "#fff",
    borderTopLeftRadius: SCREEN_WIDTH * 0.8,
    borderTopRightRadius: SCREEN_WIDTH * 0.8,
  },
  avatarContainer: {
    marginTop: 55,
    marginBottom: -70,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  characterImage: {
    width: 170,
    height: 170,
    resizeMode: "contain",
  },
  formContainer: {
    width: "100%",
    paddingHorizontal: 40,
    zIndex: 2,
    marginTop: 37,
  },
  whiteInputWrapper: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 50,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: "#BBE6E8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6D8E91",
    marginRight: 8,
  },
  mintBorderInputWrapper: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 50,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: "#BBE6E8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  mintBorderInputLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#5C7A7C",
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1F355F",
    paddingVertical: 0,
  },
  signUpBtn: {
    width: "100%",
    backgroundColor: "#BBE6E8",
    borderRadius: 25,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  signUpBtnText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F355F",
  },
});
