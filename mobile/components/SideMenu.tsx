import React, { useRef, useEffect, useState } from "react";
import {
  Animated, View, Text, TouchableOpacity, Pressable,
  StyleSheet, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import StatusModal from "@/components/StatusModal";

export const MENU_ITEMS = [
  {
    label: "Consulta Jurídica",
    path: "/(tabs)/",
    icon: "document-text-outline",
    desc: "Análise, redação e revisão de peças",
    color: COLORS.primary,
  },
  {
    label: "Campo Livre",
    path: "/(tabs)/campo-livre",
    icon: "chatbubbles-outline",
    desc: "Chat livre com o assistente",
    color: COLORS.info,
  },
  {
    label: "Comunicações",
    path: "/(tabs)/comunicacoes",
    icon: "notifications-outline",
    desc: "Bot Telegram · Webhook · DJe",
    color: "#e8916a",
  },
  {
    label: "Tramitação",
    path: "/(tabs)/tramitacao",
    icon: "git-branch-outline",
    desc: "Portais de consulta processual",
    color: COLORS.warning,
  },
  {
    label: "PDPJ",
    path: "/(tabs)/pdpj",
    icon: "shield-checkmark-outline",
    desc: "Portal Digital — Token de acesso",
    color: "#6ab0de",
  },
  {
    label: "Playground",
    path: "/(tabs)/playground",
    icon: "code-slash-outline",
    desc: "Editor · Snippets · Processar com IA",
    color: COLORS.accent,
  },
  {
    label: "Configurações",
    path: "/(tabs)/config",
    icon: "settings-outline",
    desc: "Chaves de API, voz, senha",
    color: COLORS.textMuted,
  },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

const DRAWER_WIDTH = 290;

export default function SideMenu({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pathname = usePathname();
  const [statusOpen, setStatusOpen] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  function navTo(path: string) {
    onClose();
    setTimeout(() => router.navigate(path as any), 50);
  }

  if (!visible && (slideAnim as any)._value <= -DRAWER_WIDTH + 1) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? "auto" : "none"}>
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.drawer,
          {
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={styles.drawerHeader}>
          <View style={styles.drawerLogo}>
            <Text style={styles.drawerLogoIcon}>⚖</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.drawerTitle}>Assistente Jurídico</Text>
            <Text style={styles.drawerSub}>Selecione um módulo</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.menuList}>
          {MENU_ITEMS.map((item) => {
            const isActive =
              pathname === item.path ||
              (item.path === "/(tabs)/" && (pathname === "/" || pathname === "/(tabs)"));
            return (
              <TouchableOpacity
                key={item.path}
                style={[styles.menuItem, isActive && styles.menuItemActive]}
                onPress={() => navTo(item.path)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.menuIcon,
                    { backgroundColor: isActive ? item.color : COLORS.bgInput },
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={isActive ? "#fff" : COLORS.textMuted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.menuLabel,
                      isActive && { color: item.color },
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text style={styles.menuDesc} numberOfLines={1}>
                    {item.desc}
                  </Text>
                </View>
                {isActive && (
                  <View style={[styles.activeDot, { backgroundColor: item.color }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.drawerFooter}>
          <TouchableOpacity style={styles.statusBtn} onPress={() => { onClose(); setTimeout(() => setStatusOpen(true), 300); }}>
            <Ionicons name="pulse-outline" size={18} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.statusBtnText}>Status do Sistema</Text>
              <Text style={styles.statusBtnSub}>Testar APIs na hora</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
          </TouchableOpacity>
          <Text style={styles.footerText}>Dados salvos localmente no dispositivo</Text>
        </View>
      </Animated.View>

      <StatusModal visible={statusOpen} onClose={() => setStatusOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: COLORS.bgCard,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: { elevation: 16 },
    }),
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  drawerLogo: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerLogoIcon: { fontSize: 22 },
  drawerTitle: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  drawerSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: COLORS.bgInput,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: 10 },
  menuList: { flex: 1, paddingHorizontal: 10 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 4,
  },
  menuItemActive: { backgroundColor: COLORS.bg },
  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  menuDesc: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  drawerFooter: {
    paddingHorizontal: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  statusBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: COLORS.bgInput, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  statusBtnText: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  statusBtnSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  footerText: { fontSize: 11, color: COLORS.textDim, textAlign: "center", paddingBottom: 4 },
});
