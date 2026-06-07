import React, { useState, useEffect } from "react";
import {
  Modal, View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { testarTodasChaves, StatusChave } from "@/services/ai";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function StatusModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [testando, setTestando] = useState(false);
  const [resultados, setResultados] = useState<StatusChave[]>([]);
  const [online, setOnline] = useState<boolean | null>(null);
  const [lastRun, setLastRun] = useState<string>("");

  useEffect(() => {
    if (visible) testar();
  }, [visible]);

  async function testar() {
    setTestando(true);
    setResultados([]);
    try {
      const r = await fetch("https://api.groq.com", { method: "HEAD" });
      setOnline(r.status < 600);
    } catch {
      setOnline(false);
    }
    const res = await testarTodasChaves();
    setResultados(res);
    setLastRun(new Date().toLocaleTimeString("pt-BR"));
    setTestando(false);
  }

  function statusColor(s: StatusChave["status"]) {
    if (s === "ok") return "#2ecc71";
    if (s === "erro") return COLORS.danger;
    if (s === "sem_chave") return COLORS.textDim;
    return COLORS.warning;
  }

  function statusIcon(s: StatusChave["status"]) {
    if (s === "ok") return "checkmark-circle";
    if (s === "erro") return "close-circle";
    if (s === "sem_chave") return "ellipse-outline";
    return "hourglass-outline";
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Status do Sistema</Text>
            <Text style={styles.sub}>Teste suas chaves de API na hora</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Internet */}
          <View style={styles.card}>
            <View style={styles.row}>
              <Ionicons
                name={online === true ? "wifi" : online === false ? "wifi-outline" : "help-circle-outline"}
                size={22}
                color={online === true ? "#2ecc71" : online === false ? COLORS.danger : COLORS.textDim}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Conexão com a internet</Text>
                <Text style={[styles.cardSub, { color: online === true ? "#2ecc71" : online === false ? COLORS.danger : COLORS.textDim }]}>
                  {online === true ? "Online ✓" : online === false ? "Sem internet ✗" : "Verificando..."}
                </Text>
              </View>
            </View>
          </View>

          {/* Chaves */}
          <Text style={styles.sectionLabel}>Chaves de API</Text>
          {testando && resultados.length === 0 ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Testando todas as chaves...</Text>
              <Text style={styles.loadingHint}>Pode demorar alguns segundos</Text>
            </View>
          ) : (
            resultados.map((r, i) => (
              <View key={i} style={[styles.card, styles.chaveCard]}>
                <View style={styles.row}>
                  {r.status === "testando"
                    ? <ActivityIndicator size={22} color={COLORS.warning} />
                    : <Ionicons name={statusIcon(r.status) as any} size={22} color={statusColor(r.status)} />
                  }
                  <View style={{ flex: 1 }}>
                    <View style={styles.chaveHeader}>
                      <Text style={styles.cardTitle}>{r.slot}</Text>
                      {r.nome !== "—" && (
                        <View style={[styles.badge, { backgroundColor: r.status === "ok" ? "#0d2218" : COLORS.bgInput }]}>
                          <Text style={[styles.badgeText, { color: r.status === "ok" ? COLORS.primary : COLORS.textMuted }]}>
                            {r.nome}
                          </Text>
                        </View>
                      )}
                    </View>
                    {r.modelo !== "—" && (
                      <Text style={styles.modeloText}>{r.modelo}</Text>
                    )}
                    <Text style={[styles.mensagemText, { color: statusColor(r.status) }]}>
                      {r.mensagem}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}

          {lastRun ? (
            <Text style={styles.lastRun}>Último teste: {lastRun}</Text>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={[styles.testBtn, testando && styles.testBtnDis]}
            onPress={testar}
            disabled={testando}
          >
            {testando
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="refresh" size={18} color="#fff" />
            }
            <Text style={styles.testBtnText}>{testando ? "Testando..." : "Testar Novamente"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title: { fontSize: 20, fontWeight: "800", color: COLORS.text },
  sub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: COLORS.bgInput, alignItems: "center", justifyContent: "center",
  },
  content: { padding: 16, gap: 10, paddingBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 4, marginBottom: 2 },
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: COLORS.border,
  },
  chaveCard: { borderRadius: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  cardSub: { fontSize: 12, marginTop: 2 },
  chaveHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  modeloText: { fontSize: 11, color: COLORS.textDim, marginTop: 2, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  mensagemText: { fontSize: 12, marginTop: 4, fontWeight: "600" },
  loadingBox: { alignItems: "center", padding: 32, gap: 12 },
  loadingText: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  loadingHint: { fontSize: 12, color: COLORS.textMuted },
  lastRun: { fontSize: 11, color: COLORS.textDim, textAlign: "center", marginTop: 8 },
  footer: {
    paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  },
  testBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 12, padding: 14,
  },
  testBtnDis: { opacity: 0.6 },
  testBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
