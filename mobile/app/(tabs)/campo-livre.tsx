import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Alert, Platform, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";
import * as MailComposer from "expo-mail-composer";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native";
import { COLORS } from "@/constants/colors";
import { MensagemFormatada } from "@/components/CodeBlock";
import { falar, pararVoz } from "@/services/voice";
import { enviarParaIA, AIMessage } from "@/services/ai";
import { getConfig, getConversa, saveConversa, clearConversa, Mensagem, AppConfig } from "@/services/storage";
import { CAMPO_LIVRE_SYSTEM } from "@/constants/prompts";
import SideMenu from "@/components/SideMenu";
import { detectarHtml, abrirHtmlNoBrowser, compartilharHtml } from "@/components/HtmlViewer";
import { importarArquivoLocal } from "@/services/fileImport";

const FS = FileSystem as any;

const TAMANHOS = [
  { label: "Conciso", tokens: 1000 },
  { label: "Normal", tokens: 3000 },
  { label: "Detalhado", tokens: 6000 },
  { label: "Máximo", tokens: 12000 },
];

export default function CampoLivre() {
  const insets = useSafeAreaInsets();
  const [msgs, setMsgs] = useState<Mensagem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cfg, setCfg] = useState<AppConfig | null>(null);
  const [tamanho, setTamanho] = useState(1);
  const [vozResposta, setVozResposta] = useState(false);
  const [falando, setFalando] = useState(false);
  const [arquivoAnexado, setArquivoAnexado] = useState<{ nome: string; conteudo: string } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    getConfig().then(setCfg);
    getConversa().then(setMsgs);
  }, []);

  async function enviar() {
    const textInput = input.trim();
    if (!textInput && !arquivoAnexado) return;
    if (loading) return;

    let conteudo = textInput;
    if (arquivoAnexado) {
      conteudo = conteudo
        ? `${conteudo}\n\n[Arquivo: ${arquivoAnexado.nome}]\n${arquivoAnexado.conteudo}`
        : `[Arquivo: ${arquivoAnexado.nome}]\n${arquivoAnexado.conteudo}`;
    }

    const novaMsgUser: Mensagem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      role: "user", content: conteudo, data: Date.now(),
    };
    const novasMsgs = [...msgs, novaMsgUser];
    setMsgs(novasMsgs);
    setInput("");
    setArquivoAnexado(null);
    setLoading(true);

    try {
      const historico: AIMessage[] = novasMsgs.slice(-20).map(m => ({ role: m.role, content: m.content }));
      const result = await enviarParaIA(CAMPO_LIVRE_SYSTEM, "", historico);
      const respContent = result.erro ? `Erro: ${result.erro}` : result.texto;
      const assistMsg: Mensagem = {
        id: (Date.now() + 1).toString() + Math.random().toString(36).substr(2, 9),
        role: "assistant", content: respContent, data: Date.now(),
      };
      const finalMsgs = [...novasMsgs, assistMsg];
      setMsgs(finalMsgs);
      await saveConversa(finalMsgs);
      if (!result.erro && vozResposta && cfg) {
        setFalando(true);
        await falar(result.texto, cfg.vozVelocidade);
        setFalando(false);
      }
    } catch (e: any) {
      Alert.alert("Erro", e.message);
    } finally {
      setLoading(false);
    }
  }

  async function importarArquivo() {
    if (Platform.OS === "web") { Alert.alert("Não disponível", "Use o app no celular."); return; }
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, type: ["*/*"] });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const config = cfg ?? await getConfig();
      const geminiKey = [config.chave1, config.chave2, config.chave3, config.chave4].find(k => k?.startsWith("AIza"));
      const imp = await importarArquivoLocal(asset, geminiKey);
      setArquivoAnexado({ nome: imp.nome, conteudo: imp.conteudo });
    } catch (e: any) {
      Alert.alert("Erro ao importar", e?.message ?? "Não foi possível ler o arquivo.");
    }
  }

  async function exportarTxt() {
    if (msgs.length === 0) { Alert.alert("Conversa vazia"); return; }
    if (Platform.OS === "web") { Alert.alert("Use o app no celular."); return; }
    const nomeAI = cfg?.nomeAssistente || "Jasmim";
    const textExport = msgs
      .map(m => `${m.role === "user" ? "Você" : nomeAI} [${new Date(m.data).toLocaleString("pt-BR")}]:\n${m.content}`)
      .join("\n\n---\n\n");
    try {
      const path = `${FS.documentDirectory}conversa_${Date.now()}.txt`;
      await FS.writeAsStringAsync(path, textExport, { encoding: "utf8" });
      await Sharing.shareAsync(path, { mimeType: "text/plain", dialogTitle: "Salvar / Compartilhar Conversa" });
    } catch { Alert.alert("Erro ao exportar"); }
  }

  async function enviarEmail() {
    if (msgs.length === 0) { Alert.alert("Conversa vazia"); return; }
    const disponivel = await MailComposer.isAvailableAsync();
    if (!disponivel) {
      Alert.alert(
        "E-mail não disponível",
        "Configure uma conta de e-mail no dispositivo para usar esta função. Alternativamente, use o botão de compartilhamento para enviar via Gmail.",
        [{ text: "OK" }, { text: "Compartilhar", onPress: exportarTxt }]
      );
      return;
    }
    const nomeAI = cfg?.nomeAssistente || "Jasmim";
    const textExport = msgs
      .map(m => `${m.role === "user" ? "Você" : nomeAI}:\n${m.content}`)
      .join("\n\n---\n\n");
    await MailComposer.composeAsync({
      subject: `Conversa Campo Livre — ${new Date().toLocaleDateString("pt-BR")}`,
      body: textExport,
    });
  }

  async function copiarConversa() {
    if (msgs.length === 0) { Alert.alert("Conversa vazia"); return; }
    const nomeAI = cfg?.nomeAssistente || "Jasmim";
    const textExport = msgs
      .map(m => `${m.role === "user" ? "Você" : nomeAI}:\n${m.content}`)
      .join("\n\n---\n\n");
    await Clipboard.setStringAsync(textExport);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  async function limparConversa() {
    Alert.alert("Limpar conversa?", "Todas as mensagens serão apagadas.", [
      { text: "Cancelar" },
      { text: "Limpar", style: "destructive", onPress: async () => { await clearConversa(); setMsgs([]); } },
    ]);
  }

  async function copiarMensagem(texto: string) {
    await Clipboard.setStringAsync(texto);
  }

  async function toggleVoz(texto: string) {
    if (falando) { await pararVoz(); setFalando(false); }
    else if (cfg) { setFalando(true); await falar(texto, cfg.vozVelocidade); setFalando(false); }
  }

  function formatarHora(ts: number) {
    return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  const msgsInvertidas = [...msgs].reverse();
  const modeloInfo = cfg?.chave1 ? `Chave própria · ${cfg.chave1Modelo || "auto"}` : `Demo · ${cfg?.chaveDemoModelo || "llama-3.3-70b"}`;

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding" keyboardVerticalOffset={0}>

      {/* ── Header ───────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.hamburger} onPress={() => setMenuOpen(true)}>
          <Ionicons name="menu" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Campo Livre</Text>
          <Text style={styles.sub}>Chat com {cfg?.nomeAssistente || "Jasmim"}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setVozResposta(!vozResposta)}>
            <Ionicons
              name={vozResposta ? "volume-high" : "volume-mute-outline"}
              size={20}
              color={vozResposta ? COLORS.primary : COLORS.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={copiarConversa}>
            <Ionicons name={copiado ? "checkmark" : "copy-outline"} size={20} color={copiado ? COLORS.primary : COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={enviarEmail}>
            <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={exportarTxt}>
            <Ionicons name="share-outline" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={limparConversa}>
            <Ionicons name="trash-outline" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Tamanho da resposta ──────────────────────────────── */}
      <View style={styles.tamanhoBar}>
        <Text style={styles.tamanhoLabel}>Resposta:</Text>
        {TAMANHOS.map((t, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.tamanhoBtn, tamanho === i && styles.tamanhoBtnAtivo]}
            onPress={() => setTamanho(i)}
          >
            <Text style={[styles.tamanhoText, tamanho === i && styles.tamanhoTextAtivo]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.msgCount} numberOfLines={1}>{msgs.length} msg{msgs.length !== 1 ? "s" : ""}</Text>
      </View>

      {/* ── Lista de mensagens ───────────────────────────────── */}
      <FlatList
        ref={flatRef}
        data={msgsInvertidas}
        inverted
        keyExtractor={item => item.id}
        style={styles.msgs}
        contentContainerStyle={{ padding: 12, paddingBottom: 4 }}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={loading ? (
          <View style={styles.digitando}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.digitandoText}>Jasmim está pensando...</Text>
          </View>
        ) : null}
        ListFooterComponent={msgs.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={52} color={COLORS.textDim} />
            <Text style={styles.emptyTitle}>Campo Livre</Text>
            <Text style={styles.emptyDesc}>
              Converse livremente com a Jasmim sobre qualquer tema jurídico.{"\n"}
              Pode colar textos, pedir análises, discutir estratégias processuais, pedir rascunhos de petições e muito mais.{"\n\n"}
              Se pedir código HTML, use o botão {'"Ver HTML"'} que aparece na resposta para visualizá-lo renderizado.
            </Text>
          </View>
        ) : null}
        renderItem={({ item: m }) => {
          const temHtml = m.role === "assistant" && detectarHtml(m.content);
          return (
            <View style={[styles.msgBubble, m.role === "user" ? styles.msgUser : styles.msgAssist]}>
              {m.role === "assistant" && (
                <View style={styles.msgHeader}>
                  <Text style={styles.msgAuthor}>Jasmim</Text>
                  <View style={styles.msgActions}>
                    <TouchableOpacity style={styles.msgActionBtn} onPress={() => toggleVoz(m.content)}>
                      <Ionicons name="volume-high-outline" size={14} color={COLORS.textDim} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.msgActionBtn} onPress={() => copiarMensagem(m.content)}>
                      <Ionicons name="copy-outline" size={14} color={COLORS.textDim} />
                    </TouchableOpacity>
                    <Text style={styles.msgHora}>{formatarHora(m.data)}</Text>
                  </View>
                </View>
              )}
              {m.role === "user"
                ? <Text style={styles.msgTextoUser}>{m.content}</Text>
                : <MensagemFormatada texto={m.content} />
              }
              {/* Botão HTML — aparece quando a IA gerou HTML */}
              {temHtml && (
                <TouchableOpacity
                  style={styles.htmlBtn}
                  onPress={() => abrirHtmlNoBrowser(m.content, "Prévia HTML")}
                >
                  <Ionicons name="globe-outline" size={14} color={COLORS.info} />
                  <Text style={styles.htmlBtnText}>Abrir HTML no navegador</Text>
                  <Ionicons name="arrow-forward" size={14} color={COLORS.info} />
                </TouchableOpacity>
              )}
              {m.role === "user" && (
                <View style={styles.msgUserFooter}>
                  <TouchableOpacity onPress={() => copiarMensagem(m.content)}>
                    <Ionicons name="copy-outline" size={13} color="#4a8a6a" />
                  </TouchableOpacity>
                  <Text style={styles.msgHoraUser}>{formatarHora(m.data)}</Text>
                </View>
              )}
            </View>
          );
        }}
      />

      {/* ── Arquivo anexado ──────────────────────────────────── */}
      {arquivoAnexado && (
        <View style={styles.arquivoBox}>
          <Ionicons name="document-text-outline" size={14} color={COLORS.primary} />
          <Text style={styles.arquivoNome} numberOfLines={1}>{arquivoAnexado.nome}</Text>
          <TouchableOpacity onPress={() => setArquivoAnexado(null)}>
            <Ionicons name="close-circle" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Área de input ────────────────────────────────────── */}
      <View style={[styles.inputArea, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity style={styles.inputBtn} onPress={importarArquivo}>
          <Ionicons name="attach-outline" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Escreva sua mensagem — código HTML, perguntas jurídicas, qualquer assunto..."
          placeholderTextColor={COLORS.textDim}
          value={input}
          onChangeText={setInput}
          multiline
          onSubmitEditing={enviar}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() && !arquivoAnexado) && styles.sendBtnDisabled]}
          onPress={enviar}
          disabled={loading || (!input.trim() && !arquivoAnexado)}
        >
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="send" size={18} color="#fff" />
          }
        </TouchableOpacity>
      </View>

      {/* ── Info do modelo ───────────────────────────────────── */}
      <View style={[styles.modelBar, { paddingBottom: insets.bottom > 0 ? 0 : 4 }]}>
        <Text style={styles.modelBarText}>{modeloInfo}</Text>
        {msgs.length > 0 && (
          <TouchableOpacity onPress={limparConversa}>
            <Text style={styles.limparText}>Limpar</Text>
          </TouchableOpacity>
        )}
      </View>

      <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.bgCard },
  hamburger: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  title: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  sub: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  headerActions: { flexDirection: "row", gap: 4 },
  iconBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: COLORS.bgCard },
  tamanhoBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, gap: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.bgCard },
  tamanhoLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600", marginRight: 2 },
  tamanhoBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: COLORS.border },
  tamanhoBtnAtivo: { borderColor: COLORS.primary, backgroundColor: "#0f2d1f" },
  tamanhoText: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600" },
  tamanhoTextAtivo: { color: COLORS.primary },
  msgCount: { marginLeft: "auto", fontSize: 11, color: COLORS.textDim },
  msgs: { flex: 1 },
  empty: { alignItems: "center", marginTop: 50, padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text, marginBottom: 10, marginTop: 14 },
  emptyDesc: { fontSize: 13, color: COLORS.textMuted, textAlign: "center", lineHeight: 20 },
  msgBubble: { marginBottom: 12, borderRadius: 14, padding: 12, maxWidth: "92%" },
  msgUser: { alignSelf: "flex-end", backgroundColor: "#1a3a2a", borderBottomRightRadius: 4 },
  msgAssist: { alignSelf: "flex-start", backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderBottomLeftRadius: 4, maxWidth: "96%" },
  msgHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  msgAuthor: { fontSize: 11, fontWeight: "700", color: COLORS.primary },
  msgActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  msgActionBtn: { padding: 3 },
  msgHora: { fontSize: 10, color: COLORS.textDim },
  msgUserFooter: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 6, marginTop: 6 },
  msgHoraUser: { fontSize: 10, color: "#4a8a6a" },
  msgTextoUser: { color: COLORS.text, fontSize: 14, lineHeight: 21 },
  htmlBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  htmlBtnText: { flex: 1, fontSize: 12, color: COLORS.info, fontWeight: "700" },
  digitando: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12 },
  digitandoText: { color: COLORS.textMuted, fontSize: 13 },
  arquivoBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#0f2d1f", padding: 8, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: COLORS.border },
  arquivoNome: { flex: 1, fontSize: 12, color: COLORS.primary },
  inputArea: { flexDirection: "row", alignItems: "flex-end", gap: 8, padding: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.bgCard },
  inputBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  input: { flex: 1, backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, color: COLORS.text, fontSize: 14, maxHeight: 120 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  sendBtnDisabled: { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border },
  modelBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 6, backgroundColor: COLORS.bgCard, borderTopWidth: 1, borderTopColor: COLORS.border },
  modelBarText: { fontSize: 11, color: COLORS.textDim },
  limparText: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600" },
});
