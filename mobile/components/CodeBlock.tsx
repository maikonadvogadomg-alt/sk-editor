import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/colors";

interface Props {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language }: Props) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    await Clipboard.setStringAsync(code);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.lang}>{language || "código"}</Text>
        <TouchableOpacity onPress={copiar} style={styles.copyBtn}>
          <Ionicons name={copiado ? "checkmark" : "copy-outline"} size={14} color={copiado ? COLORS.primary : COLORS.textMuted} />
          <Text style={[styles.copyText, copiado && { color: COLORS.primary }]}>{copiado ? "Copiado!" : "Copiar"}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal style={styles.scroll}>
        <Text style={styles.code} selectable>{code}</Text>
      </ScrollView>
    </View>
  );
}

export function MensagemFormatada({ texto, style }: { texto: string; style?: any }) {
  const partes = texto.split(/(```[\s\S]*?```)/g);

  return (
    <View>
      {partes.map((parte, i) => {
        const codeMatch = parte.match(/^```(\w+)?\n?([\s\S]+?)\n?```$/);
        if (codeMatch) {
          const lang = codeMatch[1] || "";
          const code = codeMatch[2] || "";
          return <CodeBlock key={i} code={code} language={lang} />;
        }
        const inlineParts = parte.split(/(`[^`]+`)/g);
        return (
          <Text key={i} style={[{ color: COLORS.text, fontSize: 14, lineHeight: 22 }, style]}>
            {inlineParts.map((ip, j) => {
              if (ip.startsWith("`") && ip.endsWith("`")) {
                return <Text key={j} style={styles.inlineCode}>{ip.slice(1, -1)}</Text>;
              }
              return ip;
            })}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0d1117", borderRadius: 8,
    borderWidth: 1, borderColor: "#30363d",
    marginVertical: 8, overflow: "hidden",
  },
  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: "#161b22", borderBottomWidth: 1, borderBottomColor: "#30363d",
  },
  lang: { color: "#7d8590", fontSize: 11, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  copyText: { color: COLORS.textMuted, fontSize: 11 },
  scroll: { padding: 12 },
  code: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 13, color: "#e6edf3", lineHeight: 20 },
  inlineCode: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 13,
    backgroundColor: "#1e293b", color: "#f8fafc",
    borderRadius: 4, paddingHorizontal: 4,
  },
});
