import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/colors";
import { useEffect, useState } from "react";
import { isPrimeiroAcesso, getConfig } from "@/services/storage";
import { router } from "expo-router";
import { View, ActivityIndicator } from "react-native";

function TabIcon({ name, color, size }: { name: any; color: string; size: number }) {
  return <Ionicons name={name} size={size} color={color} />;
}

export default function TabLayout() {
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    (async () => {
      const primeiro = await isPrimeiroAcesso();
      if (primeiro) { router.replace("/config-inicial"); return; }
      const cfg = await getConfig();
      if (cfg.loginConfigurado && cfg.senhaLogin) { router.replace("/login"); return; }
      setPronto(true);
    })();
  }, []);

  if (!pronto) return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={COLORS.primary} />
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textDim,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Consulta", tabBarIcon: ({ color, size }) => <TabIcon name="document-text-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="campo-livre" options={{ title: "Campo Livre", tabBarIcon: ({ color, size }) => <TabIcon name="chatbubbles-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="comunicacoes" options={{ title: "Comunicações", tabBarIcon: ({ color, size }) => <TabIcon name="notifications-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="pdpj" options={{ title: "PDPJ", tabBarIcon: ({ color, size }) => <TabIcon name="shield-checkmark-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="tramitacao" options={{ title: "Tramitação", tabBarIcon: ({ color, size }) => <TabIcon name="git-branch-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="playground" options={{ title: "Playground", tabBarIcon: ({ color, size }) => <TabIcon name="code-slash-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="config" options={{ title: "Config", tabBarIcon: ({ color, size }) => <TabIcon name="settings-outline" color={color} size={size} /> }} />
    </Tabs>
  );
}
