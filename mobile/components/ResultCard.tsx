import React, { useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Platform, ActivityIndicator, Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Audio as AvAudio } from "expo-av";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { falar, pararVoz } from "@/services/voice";
import { saveSnippet, getConfig } from "@/services/storage";
import { enviarParaIA } from "@/services/ai";
import { SYSTEM_JURIDICO } from "@/constants/prompts";

const FS = FileSystem as any;

interface Props {
  texto: string;
  provedor?: string;
  vozAtiva?: boolean;
  vozVelocidade?: number;
  cabecalhoTemplate?: string;
  onEditar?: () => void;
  onResultadoChange?: (novo: string) => void;
}

function textoParaRtf(texto: string): string {
  const escapado = texto
    .replace(/\\/g, "\\\\")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\n/g, "\\par\n");
  return (
    `{\\rtf1\\ansi\\ansicpg1252\\deff0\\deflang1046\n` +
    `{\\fonttbl{\\f0\\froman\\fprq2\\fcharset0 Times New Roman;}}\n` +
    `{\\colortbl;\\red0\\green0\\blue0;}\n` +
    `\\viewkind4\\uc1\\pard\\f0\\fs24\\lang1046 ${escapado}\\par\n}`
  );
}

export function ResultCard({
  texto,
  provedor,
  vozVelocidade = 1.1,
  cabecalhoTemplate,
  onEditar,
  onResultadoChange,
}: Props) {
  const insets = useSafeAreaInsets();
  const [falando, setFalando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [exportando, setExportando] = useState(false);

  // Editor em tela cheia
  const [showEditor, setShowEditor] = useState(false);
  const [textoEditado, setTextoEditado] = useState(texto);

  // Mini chat de refinamento
  const [chatCmd, setChatCmd] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Ditado no mini chat
  const [gravandoChat, setGravandoChat] = useState(false);
  const [vozLoadingChat, setVozLoadingChat] = useState(false);
  const recordingRef = useRef<AvAudio.Recording | null>(null);

  const textoAtual = texto;

  // ── Texto final que vai nos exports (com cabeçalho do template se houver) ──
  function textoParaExport(): string {
    if (cabecalhoTemplate) {
      return `${cabecalhoTemplate}\n\n${"─".repeat(50)}\n\n${textoAtual}`;
    }
    return textoAtual;
  }

  // ── Voz ────────────────────────────────────────────────────────
  async function toggleVoz() {
    if (falando) { await pararVoz(); setFalando(false); }
    else { setFalando(true); await falar(textoAtual, vozVelocidade); setFalando(false); }
  }

  // ── Copiar ─────────────────────────────────────────────────────
  async function copiar() {
    await Clipboard.setStringAsync(textoParaExport());
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  // ── Salvar snippet ─────────────────────────────────────────────
  async function salvarSnippet() {
    const titulo = `${new Date().toLocaleDateString("pt-BR")} — ${textoAtual.slice(0, 50)}`;
    await saveSnippet(titulo, textoAtual);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  }

  // ── Exportar TXT ───────────────────────────────────────────────
  async function exportarTxt() {
    if (Platform.OS === "web") { Alert.alert("Use o app no celular para exportar."); return; }
    setExportando(true);
    try {
      const conteudo = textoParaExport();
      const path = `${FS.documentDirectory}resultado_${Date.now()}.txt`;
      await FS.writeAsStringAsync(path, conteudo, { encoding: "utf8" });
      await Sharing.shareAsync(path, { mimeType: "text/plain", dialogTitle: "Exportar TXT" });
    } catch { Alert.alert("Erro", "Não foi possível exportar."); }
    finally { setExportando(false); }
  }

  // ── Exportar PDF ────────────────────────────────────────────────
  async function exportarPdf() {
    if (Platform.OS === "web") { Alert.alert("Use o app no celular para exportar."); return; }
    setExportando(true);
    try {
      const conteudo = textoParaExport();
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
        <style>
          body{font-family:'Times New Roman',serif;font-size:12pt;line-height:1.5;
               margin:3cm 2cm 2cm 3cm;color:#000;}
          p{text-indent:4cm;margin:0 0 6pt 0;}
        </style></head><body>
        ${conteudo.split("\n").map(l => l.trim() ? `<p>${l}</p>` : "<p>&nbsp;</p>").join("")}
      </body></html>`;
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const dest = `${FS.documentDirectory}peticao_${Date.now()}.pdf`;
      await FS.moveAsync({ from: uri, to: dest });
      await Sharing.shareAsync(dest, { mimeType: "application/pdf", dialogTitle: "Exportar PDF", UTI: "com.adobe.pdf" });
    } catch { Alert.alert("Erro", "Não foi possível exportar PDF."); }
    finally { setExportando(false); }
  }

  // ── Exportar Word (RTF) ─────────────────────────────────────────
  async function exportarWord() {
    if (Platform.OS === "web") { Alert.alert("Use o app no celular para exportar."); return; }
    setExportando(true);
    try {
      const conteudo = textoParaExport();
      const rtf = textoParaRtf(conteudo);
      const path = `${FS.documentDirectory}resultado_${Date.now()}.rtf`;
      await FS.writeAsStringAsync(path, rtf, { encoding: "utf8" });
      await Sharing.shareAsync(path, {
        mimeType: "application/rtf",
        dialogTitle: "Exportar Word (.rtf)",
        UTI: "public.rtf",
      });
    } catch { Alert.alert("Erro", "Não foi possível exportar."); }
    finally { setExportando(false); }
  }

  // ── Editor em tela cheia ────────────────────────────────────────
  function abrirEditor() {
    setTextoEditado(texto);
    setShowEditor(true);
  }

  function confirmarEdicao() {
    if (onResultadoChange) onResultadoChange(textoEditado);
    setShowEditor(false);
  }

  // ── Mini chat — comando de voz ──────────────────────────────────
  async function iniciarDitadoChat() {
    if (Platform.OS === "web") return;
    try {
      await AvAudio.requestPermissionsAsync();
      await AvAudio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await AvAudio.Recording.createAsync(AvAudio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setGravandoChat(true);
    } catch (e: any) { Alert.alert("Microfone", "Não foi possível acessar: " + e.message); }
  }

  async function pararDitadoChat() {
    setGravandoChat(false);
    setVozLoadingChat(true);
    try {
      if (!recordingRef.current) return;
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      if (!uri) return;
      const c = await getConfig();
      const chave = c.chave1 || c.chaveDemo;
      if (!chave) { Alert.alert("Sem chave", "Configure uma chave de API nas configurações."); return; }
      const formData = new FormData();
      formData.append("file", { uri, type: "audio/m4a", name: "cmd.m4a" } as any);
      formData.append("model", "whisper-large-v3");
      formData.append("language", "pt");
      formData.append("response_format", "json");
      const resp = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${chave}` },
        body: formData,
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.text) setChatCmd(data.text);
      } else {
        Alert.alert("Erro na transcrição", `Status: ${resp.status}`);
      }
    } catch (e: any) { console.warn("Erro ditado chat:", e); }
    finally { setVozLoadingChat(false); }
  }

  // ── Mini chat — enviar comando ──────────────────────────────────
  async function enviarComando() {
    if (!chatCmd.trim()) return;
    setChatLoading(true);
    try {
      const prompt =
        `Você recebeu o seguinte texto jurídico gerado:\n\n${textoAtual}\n\n` +
        `─────────────────────────────────────────────\n\n` +
        `Agora execute este comando sobre o texto acima:\n"${chatCmd.trim()}"\n\n` +
        `Apresente o resultado completo e formatado.`;
      const result = await enviarParaIA(SYSTEM_JURIDICO, prompt);
      if (result.erro) {
        Alert.alert("Erro da IA", result.erro);
      } else {
        if (onResultadoChange) onResultadoChange(result.texto);
        setChatCmd("");
      }
    } catch (e: any) { Alert.alert("Erro", e.message); }
    finally { setChatLoading(false); }
  }

  if (!texto) return null;

  return (
    <View style={styles.card}>
      {/* ── Cabeçalho do card ─────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.dot} />
          <Text style={styles.headerLabel}>Resultado</Text>
          {provedor ? <Text style={styles.provBadge}>{provedor}</Text> : null}
          {cabecalhoTemplate ? (
            <View style={styles.tplBadge}>
              <Ionicons name="copy-outline" size={10} color={COLORS.purple} />
              <Text style={styles.tplBadgeText}>Template ativo</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.btn} onPress={toggleVoz} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name={falando ? "stop-circle" : "volume-high-outline"} size={20} color={falando ? COLORS.danger : COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={copiar} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name={copiado ? "checkmark" : "copy-outline"} size={20} color={copiado ? COLORS.primary : COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={salvarSnippet} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name={salvo ? "bookmark" : "bookmark-outline"} size={20} color={salvo ? COLORS.warning : COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnEdit]} onPress={abrirEditor} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="expand-outline" size={20} color={COLORS.info} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Botões de exportar ────────────────────────────────────── */}
      <View style={styles.exportRow}>
        <TouchableOpacity style={styles.exportBtn} onPress={exportarTxt} disabled={exportando}>
          {exportando
            ? <ActivityIndicator size="small" color={COLORS.textMuted} />
            : <Ionicons name="document-text-outline" size={15} color={COLORS.textMuted} />
          }
          <Text style={styles.exportLabel}>Baixar TXT</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.exportBtn, styles.exportBtnPdf]} onPress={exportarPdf} disabled={exportando}>
          <Ionicons name="document-outline" size={15} color="#e85c5c" />
          <Text style={[styles.exportLabel, { color: "#e85c5c" }]}>Baixar PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.exportBtn, styles.exportBtnWord]} onPress={exportarWord} disabled={exportando}>
          <Ionicons name="document-outline" size={15} color="#4a90d9" />
          <Text style={[styles.exportLabel, { color: "#4a90d9" }]}>Baixar Word</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.exportBtn, styles.exportBtnExpand]} onPress={abrirEditor}>
          <Ionicons name="create-outline" size={15} color={COLORS.info} />
          <Text style={[styles.exportLabel, { color: COLORS.info }]}>Editar</Text>
        </TouchableOpacity>

        {onEditar ? (
          <TouchableOpacity style={styles.exportBtn} onPress={onEditar}>
            <Ionicons name="arrow-undo-outline" size={15} color={COLORS.textMuted} />
            <Text style={styles.exportLabel}>Usar como entrada</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ── Texto do resultado ────────────────────────────────────── */}
      <ScrollView style={styles.scroll} nestedScrollEnabled showsVerticalScrollIndicator>
        <Text style={styles.texto} selectable>{texto}</Text>
      </ScrollView>

      {/* ── Linha divisória ───────────────────────────────────────── */}
      <View style={styles.divider} />

      {/* ── Mini chat de refinamento ──────────────────────────────── */}
      <View style={styles.chatArea}>
        <Text style={styles.chatTitle}>
          <Ionicons name="sparkles-outline" size={12} color={COLORS.accent} />
          {"  "}Refinamento — comando ou correção rápida:
        </Text>
        <View style={styles.chatRow}>
          <TextInput
            style={[styles.chatInput, { maxHeight: 90 }]}
            placeholder='Ex: "Adicione fundamentação", "Encurte", "Reescreva em tom formal"...'
            placeholderTextColor={COLORS.textDim}
            value={chatCmd}
            onChangeText={setChatCmd}
            multiline
          />
          {/* Voz no mini chat */}
          <TouchableOpacity
            style={[styles.chatMicBtn, gravandoChat && styles.chatMicBtnAtivo]}
            onPressIn={iniciarDitadoChat}
            onPressOut={pararDitadoChat}
          >
            {vozLoadingChat
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name={gravandoChat ? "mic" : "mic-outline"} size={18} color="#fff" />
            }
          </TouchableOpacity>
          {/* Enviar comando */}
          <TouchableOpacity
            style={[styles.chatSendBtn, (!chatCmd.trim() || chatLoading) && styles.chatBtnDis]}
            onPress={enviarComando}
            disabled={!chatCmd.trim() || chatLoading}
          >
            {chatLoading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="send" size={17} color="#fff" />
            }
          </TouchableOpacity>
        </View>
        {chatLoading && (
          <Text style={styles.chatLoadingText}>IA processando o comando...</Text>
        )}
      </View>

      {/* ══════════════════════════════════════════════════════════════
          MODAL: EDITOR EM TELA CHEIA
      ══════════════════════════════════════════════════════════════ */}
      <Modal visible={showEditor} animationType="slide" presentationStyle="fullScreen">
        <View style={[styles.editorModal, { paddingTop: insets.top + 8 }]}>
          {/* Header do editor */}
          <View style={styles.editorHeader}>
            <Text style={styles.editorTitle}>Editar Resultado</Text>
            <View style={styles.editorHeaderActions}>
              <TouchableOpacity style={styles.editorExportBtn} onPress={exportarTxt} disabled={exportando}>
                <Ionicons name="document-text-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.editorExportLabel}>TXT</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.editorExportBtn, { borderColor: "#e85c5c40" }]} onPress={exportarPdf} disabled={exportando}>
                <Ionicons name="document-outline" size={16} color="#e85c5c" />
                <Text style={[styles.editorExportLabel, { color: "#e85c5c" }]}>PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.editorExportBtn, { borderColor: "#4a90d940" }]} onPress={exportarWord} disabled={exportando}>
                <Ionicons name="document-outline" size={16} color="#4a90d9" />
                <Text style={[styles.editorExportLabel, { color: "#4a90d9" }]}>Word</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editorCancelBtn} onPress={() => setShowEditor(false)}>
                <Ionicons name="close" size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Área de edição */}
          <TextInput
            style={styles.editorInput}
            value={textoEditado}
            onChangeText={setTextoEditado}
            multiline
            textAlignVertical="top"
            autoFocus
            scrollEnabled
          />

          {/* Contador e botão salvar */}
          <View style={[styles.editorFooter, { paddingBottom: insets.bottom + 12 }]}>
            <Text style={styles.editorCharCount}>{textoEditado.length.toLocaleString("pt-BR")} caracteres</Text>
            <View style={styles.editorFooterBtns}>
              <TouchableOpacity style={styles.editorDiscardBtn} onPress={() => setShowEditor(false)}>
                <Text style={styles.editorDiscardText}>Descartar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editorSaveBtn} onPress={confirmarEdicao}>
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.editorSaveText}>Confirmar edição</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primary + "50",
    overflow: "hidden",
    marginTop: 14,
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: "#0f2d1f",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: COLORS.primary },
  headerLabel: { color: COLORS.text, fontWeight: "800", fontSize: 14 },
  provBadge: {
    backgroundColor: "#1e3a2f",
    color: COLORS.primary,
    fontSize: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: "hidden",
    fontWeight: "700",
  },
  tplBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${COLORS.purple}20`,
    borderWidth: 1,
    borderColor: `${COLORS.purple}40`,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tplBadgeText: { fontSize: 10, color: COLORS.purple, fontWeight: "700" },
  headerActions: { flexDirection: "row", gap: 2 },
  btn: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  btnEdit: { backgroundColor: `${COLORS.info}15` },
  // Exportar
  exportRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: "#1a2540",
  },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.bgInput,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exportBtnPdf: {
    borderColor: "#e85c5c40",
    backgroundColor: "#2d1010",
  },
  exportBtnWord: {
    borderColor: "#4a90d940",
    backgroundColor: "#0d1f30",
  },
  exportBtnExpand: {
    borderColor: `${COLORS.info}40`,
    backgroundColor: `${COLORS.info}10`,
  },
  exportLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: "700" },
  // Texto resultado
  scroll: {
    maxHeight: 420,
    padding: 14,
    paddingTop: 16,
  },
  texto: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 24,
  },
  // Divider
  divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 12 },
  // Mini chat
  chatArea: { padding: 12, paddingTop: 10 },
  chatTitle: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  chatRow: { flexDirection: "row", gap: 6, alignItems: "flex-end" },
  chatInput: {
    flex: 1,
    backgroundColor: COLORS.bgInput,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 20,
  },
  chatMicBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent + "cc",
    alignItems: "center",
    justifyContent: "center",
  },
  chatMicBtnAtivo: { backgroundColor: COLORS.danger },
  chatSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  chatBtnDis: { backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.border },
  chatLoadingText: { fontSize: 11, color: COLORS.textDim, marginTop: 6, textAlign: "center" },
  // Modal Editor
  editorModal: { flex: 1, backgroundColor: COLORS.bg },
  editorHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  editorTitle: { fontSize: 17, fontWeight: "800", color: COLORS.text },
  editorHeaderActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  editorExportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editorExportLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: "700" },
  editorCancelBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  editorInput: {
    flex: 1,
    backgroundColor: COLORS.bgInput,
    margin: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 23,
    textAlignVertical: "top",
  },
  editorFooter: {
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 10,
  },
  editorCharCount: { fontSize: 11, color: COLORS.textDim, textAlign: "right" },
  editorFooterBtns: { flexDirection: "row", gap: 10 },
  editorDiscardBtn: {
    flex: 1,
    padding: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  editorDiscardText: { color: COLORS.textMuted, fontSize: 14, fontWeight: "600" },
  editorSaveBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 13,
  },
  editorSaveText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
