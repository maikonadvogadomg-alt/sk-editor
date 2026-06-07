import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import SideMenu from "@/components/SideMenu";

const TOKEN_KEY = "@pdpj_token";
const CPF_KEY = "@pdpj_cpf";

export default function Pdpj() {
  const insets = useSafeAreaInsets();
  const [token, setToken] = useState("");
  const [cpf, setCpf] = useState("");
  const [tokenSalvo, setTokenSalvo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "erro">("idle");
  const [msgStatus, setMsgStatus] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem(TOKEN_KEY);
      const c = await AsyncStorage.getItem(CPF_KEY);
      if (t) { setToken(t); setTokenSalvo(true); }
      if (c) setCpf(c);
    })();
  }, []);

  async function salvar() {
    if (!token.trim()) { Alert.alert("Token vazio", "Cole seu token PDPJ."); return; }
    await AsyncStorage.setItem(TOKEN_KEY, token.trim());
    await AsyncStorage.setItem(CPF_KEY, cpf.trim());
    setTokenSalvo(true);
    Alert.alert("Salvo!", "Token e CPF salvos localmente.");
  }

  async function testar() {
    const t = await AsyncStorage.getItem(TOKEN_KEY);
    if (!t) { Alert.alert("Sem token", "Salve um token primeiro."); return; }
    setLoading(true);
    setStatus("idle");
    try {
      const resp = await fetch("https://pdpj.jus.br/partes-publicas/v1/processos?size=1", {
        headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      });
      if (resp.ok) {
        setStatus("ok");
        setMsgStatus(`Conexão OK — Status ${resp.status}`);
      } else {
        setStatus("erro");
        setMsgStatus(`Erro ${resp.status} — Token inválido ou expirado`);
      }
    } catch (e: any) {
      setStatus("erro");
      setMsgStatus(e.message || "Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  async function limpar() {
    Alert.alert("Limpar token?", "O token salvo será removido.", [
      { text: "Cancelar" },
      {
        text: "Limpar", style: "destructive", onPress: async () => {
          await AsyncStorage.removeItem(TOKEN_KEY);
          await AsyncStorage.removeItem(CPF_KEY);
          setToken(""); setCpf(""); setTokenSalvo(false); setStatus("idle");
        }
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.hamburger} onPress={() => setMenuOpen(true)}>
          <Ionicons name="menu" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>PDPJ — Token de Acesso</Text>
          <Text style={styles.sub}>Portal Digital do Poder Judiciário</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Token JWT</Text>
          <TextInput
            style={[styles.input, { minHeight: 100 }]}
            placeholder="Cole aqui seu token PDPJ (começa com eyJ...)"
            placeholderTextColor={COLORS.textDim}
            value={token}
            onChangeText={setToken}
            multiline autoCapitalize="none" autoCorrect={false}
          />
          <Text style={styles.label}>CPF do titular (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="000.000.000-00"
            placeholderTextColor={COLORS.textDim}
            value={cpf}
            onChangeText={setCpf}
            keyboardType="numeric"
          />
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.btnSalvar} onPress={salvar}>
              <Ionicons name="save-outline" size={16} color="#fff" />
              <Text style={styles.btnSalvarText}>Salvar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnTestar} onPress={testar} disabled={loading}>
              {loading ? <ActivityIndicator size="small" color={COLORS.info} /> : <Ionicons name="wifi-outline" size={16} color={COLORS.info} />}
              <Text style={styles.btnTestarText}>Testar</Text>
            </TouchableOpacity>
            {tokenSalvo ? (
              <TouchableOpacity style={styles.btnLimpar} onPress={limpar}>
                <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
              </TouchableOpacity>
            ) : null}
          </View>
          {status !== "idle" ? (
            <View style={[styles.statusBox, status === "ok" ? styles.statusOk : styles.statusErro]}>
              <Ionicons name={status === "ok" ? "checkmark-circle" : "close-circle"} size={16} color={status === "ok" ? COLORS.primary : COLORS.danger} />
              <Text style={[styles.statusText, { color: status === "ok" ? COLORS.primary : COLORS.danger }]}>{msgStatus}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Como obter o token PDPJ</Text>
          <Text style={styles.infoStep}>1. Acesse pdpj.jus.br com seu certificado digital</Text>
          <Text style={styles.infoStep}>2. Vá em Perfil → Gerar Token JWT</Text>
          <Text style={styles.infoStep}>3. Copie o token completo e cole aqui</Text>
          <Text style={styles.infoStep}>4. O token expira em 24h — renove quando necessário</Text>
        </View>

        <View style={[styles.infoCard, { borderColor: "#2d3a4a" }]}>
          <Text style={styles.infoTitle}>Segurança</Text>
          <Text style={styles.infoText}>O token é salvo APENAS no seu dispositivo (AsyncStorage local). Não é enviado a nenhum servidor externo.</Text>
        </View>
      </ScrollView>
      <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 12, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.bgCard,
  },
  hamburger: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  title: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  sub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  content: { padding: 16, gap: 14 },
  card: { backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 12 },
  label: { fontSize: 12, color: COLORS.textMuted, marginTop: 12, marginBottom: 4, fontWeight: "600" },
  input: { backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 13 },
  btnRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  btnSalvar: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: COLORS.primary, borderRadius: 10, padding: 12 },
  btnSalvarText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  btnTestar: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#1e2a3a", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: COLORS.info },
  btnTestarText: { color: COLORS.info, fontWeight: "700", fontSize: 13 },
  btnLimpar: { width: 44, alignItems: "center", justifyContent: "center", backgroundColor: "#2a1a1a", borderRadius: 10, borderWidth: 1, borderColor: COLORS.danger },
  statusBox: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, padding: 10, borderRadius: 8 },
  statusOk: { backgroundColor: "#0f2d1f" },
  statusErro: { backgroundColor: "#2a1010" },
  statusText: { fontSize: 13, fontWeight: "600" },
  infoCard: { backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#2d3a2d" },
  infoTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text, marginBottom: 10 },
  infoStep: { fontSize: 13, color: COLORS.textMuted, marginBottom: 6, lineHeight: 20 },
  infoText: { fontSize: 13, color: COLORS.textMuted, lineHeight: 20 },
});
