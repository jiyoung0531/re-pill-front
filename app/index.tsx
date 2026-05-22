import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
import LoadingScreen from "../components/LoadingScreen";

export default function IndexScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1 }}>
      <LoadingScreen
        onLoginSuccess={() => {
          router.replace("/main");
        }}
      />
    </View>
  );
}
