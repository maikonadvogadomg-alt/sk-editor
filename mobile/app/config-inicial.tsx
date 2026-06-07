import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/colors";
import { saveConfig } from "@/services/storage";
import { autoDetectProvider } from "@/services/ai";

export default function ConfigInicial() {
  const [passo, setPasso] = useState<1 | 2 | 3>(1);
  const [senha, setSenha] = useState("");
  const [senhaConfirm, setSenhaConfirm] = useState("");
  const [usarSenha, setUsarSenha] = useState(false);
  const [chave1, setChave1] = useState("");
  const [chave2, setChave2] = useState("");
  const [dbUrl, setDbUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const chave1Info = chave1 ? autoDetectProvider(chave1) : null;
  const chave2Info = chave2 ? autoDetectProvider(chave2) : null;

  async function concluir() {
    if (usarSenha && passo === 1) {
      if (senha.length < 4) { Alert.alert("Senha curta", "Use pelo menos 4 caracteres."); return; }
      if (senha !== senhaConfirm) { Alert.alert("Senhas diferentes", "Confirme a senha corretamente."); return; }
    }
    if (passo < 3) { setPasso((p) => (p + 1) as any); return; }

    setLoading(true);
    try {
      await saveConfig({
        primeiroAcesso: false,
        loginConfigurado: usarSenha,
        senhaLogin: usarSenha ? senha : "",
        chave1: chave1.trim(),
        chave2: chave2.trim(),
        databaseUrl: dbUrl.trim(),
        modeloAtivo: chave1.trim() ? "chave1" : "demo",
      });
      router.replace("/(tabs)");
    } catch {
      Alert.alert("Erro", "Não foi possível salvar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function pularConfig() {
    await saveConfig({ primeiroAcesso: false });
    router.replace("/(tabs)");
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>⚖️</Text>
          <Text style={styles.logoTitle}>Assistente Jurídico</Text>
          <Text style={styles.logoSub}>Configuração inicial</Text>
        </View>

        <View style={styles.steps}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={[styles.stepDot, passo >= s && styles.stepDotAtivo]}>
              <Text style={[styles.stepNum, passo >= s && styles.stepNumAtivo]}>{s}</Text>
            </View>
          ))}
          <View style={[styles.stepLine, passo >= 2 && styles.stepLineAtivo]} />
          <View style={[styles.stepLine2, passo >= 3 && styles.stepLineAtivo]} />
        </View>

        {passo === 1 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Segurança do App</Text>
            <Text style={styles.cardDesc}>Defina uma senha para proteger o app. Você pode pular se preferir acesso direto.</Text>

            <TouchableOpacity style={[styles.opcao, usarSenha && styles.opcaoAtiva]} onPress={() => setUsarSenha(true)}>
              <Ionicons name={usarSenha ? "radio-button-on" : "radio-button-off"} size={20} color={usarSenha ? COLORS.primary : COLORS.textMuted} />
              <Text style={styles.opcaoText}>Usar senha de acesso</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.opcao, !usarSenha && styles.opcaoAtiva]} onPress={() => setUsarSenha(false)}>
              <Ionicons name={!usarSenha ? "radio-button-on" : "radio-button-off"} size={20} color={!usarSenha ? COLORS.primary : COLORS.textMuted} />
              <Text style={styles.opcaoText}>Acesso direto (sem senha)</Text>
            </TouchableOpacity>

            {usarSenha && (
              <>
                <TextInput style={styles.input} placeholder="Senha (mínimo 4 caracteres)" placeholderTextColor={COLORS.textDim} value={senha} onChangeText={setSenha} secureTextEntry autoCapitalize="none" />
                <TextInput style={styles.input} placeholder="Confirmar senha" placeholderTextColor={COLORS.textDim} value={senhaConfirm} onChangeText={setSenhaConfirm} secureTextEntry autoCapitalize="none" />
              </>
            )}
          </View>
        )}

        {passo === 2 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Chaves de IA</Text>
            <Text style={styles.cardDesc}>Configure suas chaves de API. O app detecta o provedor automaticamente (Groq, Gemini, OpenAI, etc).</Text>

            <Text style={styles.label}>Chave Principal (Chave 1)</Text>
            <TextInput style={styles.input} placeholder="gsk_... ou AIza... ou sk-..." placeholderTextColor={COLORS.textDim} value={chave1} onChangeText={setChave1} autoCapitalize="none" autoCorrect={false} />
            {chave1Info ? <Text style={styles.detected}>Detectado: {chave1Info.nome} — {chave1Info.modelo}</Text> : null}

            <Text style={styles.label}>Chave Secundária — opcional</Text>
            <TextInput style={styles.input} placeholder="Segunda chave (provedor diferente)" placeholderTextColor={COLORS.textDim} value={chave2} onChangeText={setChave2} autoCapitalize="none" autoCorrect={false} />
            {chave2Info ? <Text style={styles.detected}>Detectado: {chave2Info.nome} — {chave2Info.modelo}</Text> : null}

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Provedores suportados:</Text>
              {[
                ["gsk_...", "Groq — GRATUITO (llama-3.3-70b)"],
                ["AIza...", "Google Gemini — GRATUITO"],
                ["sk-or-...", "OpenRouter"],
                ["sk-ant...", "Anthropic Claude"],
                ["pplx-...", "Perplexity (busca web)"],
                ["sk-...", "OpenAI GPT-4o"],
              ].map(([prefix, desc]) => (
                <Text key={prefix} style={styles.infoItem}>• {prefix}  {desc}</Text>
              ))}
            </View>
          </View>
        )}

        {passo === 3 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Banco de Dados (opcional)</Text>
            <Text style={styles.cardDesc}>Cole a URL do seu banco Neon (PostgreSQL) para sincronizar dados entre dispositivos. Se deixar vazio, tudo fica salvo localmente.</Text>

            <TextInput
              style={[styles.input, { minHeight: 80 }]}
              placeholder="postgresql://usuario:senha@host.neon.tech/banco?sslmode=require"
              placeholderTextColor={COLORS.textDim}
              value={dbUrl}
              onChangeText={setDbUrl}
              multiline autoCapitalize="none" autoCorrect={false}
            />

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Como criar banco Neon gratuito:</Text>
              <Text style={styles.infoItem}>1. Acesse neon.tech e crie uma conta</Text>
              <Text style={styles.infoItem}>2. Crie um projeto e copie a "Connection string"</Text>
              <Text style={styles.infoItem}>3. Cole aqui acima</Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.btnPrimary} onPress={concluir} disabled={loading}>
          <Text style={styles.btnPrimaryText}>{loading ? "Salvando..." : passo < 3 ? "Próximo" : "Concluir Configuração"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnPular} onPress={pularConfig}>
          <Text style={styles.btnPularText}>Pular configuração</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  logoBox: { alignItems: "center", marginBottom: 32 },
  logoIcon: { fontSize: 56 },
  logoTitle: { fontSize: 24, fontWeight: "800", color: COLORS.text, marginTop: 8 },
  logoSub: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  steps: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 28, position: "relative" },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.bgCard, borderWidth: 2, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", zIndex: 1 },
  stepDotAtivo: { borderColor: COLORS.primary, backgroundColor: "#1a3a2a" },
  stepNum: { fontSize: 13, fontWeight: "700", color: COLORS.textMuted },
  stepNumAtivo: { color: COLORS.primary },
  stepLine: { width: 60, height: 2, backgroundColor: COLORS.border, position: "absolute", left: "28%", top: 15 },
  stepLine2: { width: 60, height: 2, backgroundColor: COLORS.border, position: "absolute", left: "60%", top: 15 },
  stepLineAtivo: { backgroundColor: COLORS.primary },
  card: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text, marginBottom: 8 },
  cardDesc: { fontSize: 13, color: COLORS.textMuted, lineHeight: 20, marginBottom: 16 },
  opcao: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
  opcaoAtiva: { borderColor: COLORS.primary, backgroundColor: "#0f2d1f" },
  opcaoText: { color: COLORS.text, fontSize: 14 },
  input: { backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 14, marginTop: 10 },
  label: { fontSize: 12, color: COLORS.textMuted, marginTop: 14, marginBottom: 2, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  detected: { fontSize: 12, color: COLORS.primary, marginTop: 4 },
  infoBox: { backgroundColor: "#0f172a", borderRadius: 8, padding: 12, marginTop: 14, borderWidth: 1, borderColor: COLORS.border },
  infoTitle: { fontSize: 12, color: COLORS.textMuted, fontWeight: "700", marginBottom: 8 },
  infoItem: { fontSize: 12, color: COLORS.textDim, marginBottom: 4, lineHeight: 18 },
  btnPrimary: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 12 },
  btnPrimaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  btnPular: { alignItems: "center", padding: 12 },
  btnPularText: { color: COLORS.textDim, fontSize: 14 },
});
