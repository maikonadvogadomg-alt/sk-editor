import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/colors";
import { verificarSenha, saveConfig } from "@/services/storage";

const TENTATIVAS_PARA_RESET = 5;

export default function Login() {
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(false);
  const [showSenha, setShowSenha] = useState(false);
  const [tentativas, setTentativas] = useState(0);

  async function entrar() {
    setLoading(true);
    setErro(false);
    const ok = await verificarSenha(senha);
    if (ok) {
      setTentativas(0);
      router.replace("/(tabs)");
    } else {
      setErro(true);
      setSenha("");
      setTentativas(t => t + 1);
    }
    setLoading(false);
  }

  function redefinirAcesso() {
    Alert.alert(
      "Redefinir acesso",
      `Você errou a senha ${tentativas} vez(es).\n\nIsso vai desativar a senha e abrir o app diretamente. Suas chaves e dados não serão apagados.\n\nDeseja continuar?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Redefinir senha",
          style: "destructive",
          onPress: async () => {
            await saveConfig({ loginConfigurado: false, senhaLogin: "" });
            router.replace("/(tabs)");
          },
        },
      ]
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.icon}>⚖️</Text>
      <Text style={styles.title}>Assistente Jurídico</Text>
      <Text style={styles.sub}>OAB 183712/MG — Maikon da Rocha Caldeira</Text>
      <Text style={[styles.sub, { marginBottom: 32, marginTop: 4 }]}>
        Digite sua senha para continuar
      </Text>

      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, erro && { borderColor: COLORS.danger }]}
          placeholder="Senha"
          placeholderTextColor={COLORS.textDim}
          value={senha}
          onChangeText={setSenha}
          secureTextEntry={!showSenha}
          autoCapitalize="none"
          onSubmitEditing={entrar}
          returnKeyType="go"
        />
        <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowSenha(v => !v)}>
          <Ionicons
            name={showSenha ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={COLORS.textMuted}
          />
        </TouchableOpacity>
      </View>

      {erro ? (
        <Text style={styles.erro}>Senha incorreta. Tente novamente.</Text>
      ) : null}

      <TouchableOpacity
        style={[styles.btn, loading && { opacity: 0.7 }]}
        onPress={entrar}
        disabled={loading}
      >
        <Ionicons name="lock-open-outline" size={18} color="#fff" />
        <Text style={styles.btnText}>{loading ? "Verificando..." : "Entrar"}</Text>
      </TouchableOpacity>

      {tentativas >= TENTATIVAS_PARA_RESET && (
        <TouchableOpacity style={styles.recuperarBtn} onPress={redefinirAcesso}>
          <Ionicons name="help-circle-outline" size={15} color={COLORS.textMuted} />
          <Text style={styles.recuperarText}>
            Esqueceu a senha? Redefinir acesso ({tentativas} tentativas)
          </Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: COLORS.bg,
    alignItems: "center", justifyContent: "center", padding: 32,
  },
  icon: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.text, marginBottom: 4 },
  sub: { fontSize: 12, color: COLORS.textMuted, textAlign: "center" },
  inputRow: {
    width: "100%", flexDirection: "row", alignItems: "center",
    marginBottom: 8, gap: 6,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, padding: 14,
    color: COLORS.text, fontSize: 16,
  },
  eyeBtn: {
    width: 46, height: 50, alignItems: "center", justifyContent: "center",
    backgroundColor: COLORS.bgCard, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  erro: { color: COLORS.danger, fontSize: 13, marginBottom: 10 },
  btn: {
    width: "100%", backgroundColor: COLORS.primary,
    borderRadius: 12, padding: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    marginTop: 8,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  recuperarBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 24, padding: 10,
  },
  recuperarText: { fontSize: 13, color: COLORS.textMuted, textDecorationLine: "underline" },
});
