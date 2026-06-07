import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Platform, Modal,
  FlatList, Switch, KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";
import * as MailComposer from "expo-mail-composer";

import { Audio as AvAudio } from "expo-av";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { falar, pararVoz } from "@/services/voice";
import { enviarParaIA } from "@/services/ai";
import {
  getConfig, saveConfig, addHistorico, getHistorico, getSnippets,
  getEmentas, saveEmenta, deleteEmenta,
  getTemplates, saveTemplate, deleteTemplate,
  getWordFormat, saveWordFormat, getPromptsLib, savePromptLib, deletePromptLib,
  HistoricoItem, Snippet, AppConfig, Ementa, Template, WordFormat,
  PromptLib, DEFAULT_WORD_FORMAT,
} from "@/services/storage";
import { SYSTEM_JURIDICO, PROMPTS } from "@/constants/prompts";
import SideMenu from "@/components/SideMenu";
import { detectarHtml, abrirHtmlNoBrowser, compartilharHtml } from "@/components/HtmlViewer";
import { importarArquivoLocal } from "@/services/fileImport";

// ── FileSystem compat (expo-file-system v19 type shim) ───────────────────
const FS = FileSystem as any;

// ── Tipos ────────────────────────────────────────────────────────────────
type Acao = keyof typeof PROMPTS;
const MODOS: { id: Acao; label: string; icon: string }[] = [
  { id: "corrigir",    label: "Corrigir Texto",   icon: "checkmark-circle-outline" },
  { id: "redacao",     label: "Redação Jurídica",  icon: "sparkles-outline" },
  { id: "lacunas",     label: "Verificar Lacunas", icon: "search-outline" },
];
const OUTRAS: { id: Acao; label: string; icon: string }[] = [
  { id: "resumir",     label: "Resumir",           icon: "document-outline" },
  { id: "revisar",     label: "Revisar",            icon: "checkmark-done-outline" },
  { id: "refinar",     label: "Refinar",            icon: "sparkles-outline" },
  { id: "simplificar", label: "Linguagem Simples",  icon: "chatbubble-outline" },
  { id: "minuta",      label: "Gerar Minuta",       icon: "pencil-outline" },
  { id: "analisar",    label: "Analisar",           icon: "flask-outline" },
];
const FONTES = ["Times New Roman", "Arial", "Calibri", "Helvetica", "Georgia"];

// ── Gerar RTF com formatação ABNT ─────────────────────────────────────────
function textoParaRtf(texto: string, fmt: WordFormat): string {
  const CM_TO_TWIPS = 567;
  const ptHalfPts = fmt.tamanho * 2;
  const lineSpacingTwips = Math.round(fmt.espacamento * 240);
  const indentTwips = Math.round(fmt.recuoParagrafo * CM_TO_TWIPS);
  const mSup = Math.round(fmt.margemSuperior * CM_TO_TWIPS);
  const mInf = Math.round(fmt.margemInferior * CM_TO_TWIPS);
  const mEsq = Math.round(fmt.margemEsquerda * CM_TO_TWIPS);
  const mDir = Math.round(fmt.margemDireita * CM_TO_TWIPS);

  const escapado = texto
    .replace(/\\/g, "\\\\")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .split("\n")
    .map(linha => linha.trim() === "" ? "\\par" : `\\fi${indentTwips}\\sl${lineSpacingTwips}\\slmult1 ${linha}\\par`)
    .join("\n");

  return (
    `{\\rtf1\\ansi\\ansicpg1252\\deff0\\deflang1046\n` +
    `{\\fonttbl{\\f0\\froman\\fprq2\\fcharset0 ${fmt.fonte};}}\n` +
    `{\\colortbl;\\red0\\green0\\blue0;}\n` +
    `\\viewkind4\\uc1\n` +
    `\\margt${mSup}\\margb${mInf}\\margl${mEsq}\\margr${mDir}\n` +
    `\\pard\\f0\\fs${ptHalfPts}\\lang1046 ${escapado}\n}`
  );
}

// ── Componente principal ──────────────────────────────────────────────────
export default function Consulta() {
  const insets = useSafeAreaInsets();

  // ── Texto e processamento ───────────────────────────────────────────
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState("");
  const [loading, setLoading] = useState(false);
  const [acaoAtiva, setAcaoAtiva] = useState<Acao>("resumir");
  const [cfg, setCfg] = useState<AppConfig | null>(null);
  const [wordFmt, setWordFmt] = useState<WordFormat>(DEFAULT_WORD_FORMAT);
  const [provedor, setProvedor] = useState("");
  const [vozAtiva, setVozAtiva] = useState(false);
  const [falando, setFalando] = useState(false);
  const [textoEditado, setTextoEditado] = useState("");
  const [showEditorFullscreen, setShowEditorFullscreen] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [importando, setImportando] = useState(false);

  // ── Painel ativo (Entrada / Resultado) ──────────────────────────────
  const [painelAtivo, setPainelAtivo] = useState<"entrada" | "resultado">("entrada");

  // ── Menu lateral ─────────────────────────────────────────────────────
  const [menuOpen, setMenuOpen] = useState(false);

  // ── Ditado / Áudio ───────────────────────────────────────────────────
  const [gravando, setGravando] = useState(false);
  const [vozLoading, setVozLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const recordingRef = useRef<AvAudio.Recording | null>(null);

  // ── Biblioteca de Ementas ───────────────────────────────────────────
  const [ementas, setEmentas] = useState<Ementa[]>([]);
  const [selectedEmentaIds, setSelectedEmentaIds] = useState<Set<string>>(new Set());
  const [showBiblioteca, setShowBiblioteca] = useState(false);
  const [searchEmenta, setSearchEmenta] = useState("");
  const [showAddEmenta, setShowAddEmenta] = useState(false);
  const [novaTitulo, setNovaTitulo] = useState("");
  const [novaCategoria, setNovaCategoria] = useState("");
  const [novaTexto, setNovaTexto] = useState("");
  const [savingEmenta, setSavingEmenta] = useState(false);

  // ── Templates ────────────────────────────────────────────────────────
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [novoTplNome, setNovoTplNome] = useState("");
  const [novoTplConteudo, setNovoTplConteudo] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  // ── Biblioteca de Prompts ────────────────────────────────────────────
  const [promptsLib, setPromptsLib] = useState<PromptLib[]>([]);
  const [showPrompts, setShowPrompts] = useState(false);
  const [searchPrompt, setSearchPrompt] = useState("");
  const [showAddPrompt, setShowAddPrompt] = useState(false);
  const [novoPromptNome, setNovoPromptNome] = useState("");
  const [novoPromptTexto, setNovoPromptTexto] = useState("");
  const [promptExtra, setPromptExtra] = useState("");

  // ── Histórico e Snippets ─────────────────────────────────────────────
  const [showHistorico, setShowHistorico] = useState(false);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [showSnippets, setShowSnippets] = useState(false);
  const [snippets, setSnippets] = useState<Snippet[]>([]);

  // ── Formato Word ─────────────────────────────────────────────────────
  const [showWordFmt, setShowWordFmt] = useState(false);
  const [fmtEdit, setFmtEdit] = useState<WordFormat>(DEFAULT_WORD_FORMAT);

  // ── Init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    getConfig().then(c => { setCfg(c); setVozAtiva(!!c.vozAtiva); });
    getWordFormat().then(setWordFmt);
    getEmentas().then(setEmentas);
    getTemplates().then(setTemplates);
    getPromptsLib().then(setPromptsLib);
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────
  const temChave = !!(cfg?.chave1 || cfg?.chave2 || cfg?.chave3 || cfg?.chave4 || cfg?.chaveDemo);
  const modeloLabel = (() => {
    if (!cfg) return "Demo";
    if (cfg.modeloAtivo === "chave1" && cfg.chave1) return "Chave 1";
    if (cfg.modeloAtivo === "chave2" && cfg.chave2) return "Chave 2";
    if (cfg.modeloAtivo === "chave3" && cfg.chave3) return "Chave 3";
    if (cfg.modeloAtivo === "chave4" && cfg.chave4) return "Chave 4";
    return "Demo";
  })();
  const modeloNumChaves = [cfg?.chave1, cfg?.chave2, cfg?.chave3, cfg?.chave4].filter(Boolean).length;
  const qtdEmentasSel = selectedEmentaIds.size;

  // ── Prompt final ─────────────────────────────────────────────────────
  function buildPrompt(acao: Acao): string {
    let base = promptExtra.trim()
      ? `${promptExtra.trim()}\n\nTexto a processar:\n${texto}`
      : PROMPTS[acao].replace("{texto}", texto);

    const ementasSel = ementas.filter(e => selectedEmentaIds.has(e.id));
    if (ementasSel.length > 0) {
      const jText = ementasSel.map(e => `[${e.titulo}${e.categoria ? ` — ${e.categoria}` : ""}]\n${e.texto}`).join("\n\n");
      base += `\n\n===== JURISPRUDÊNCIAS =====\n${jText}\n\nIncorpore as jurisprudências acima de forma fundamentada.`;
    }
    if (selectedTemplate) {
      base += `\n\n===== TEMPLATE/MODELO =====\n${selectedTemplate.conteudo}\n\nSiga a estrutura do modelo ao gerar o texto.`;
    }
    return base;
  }

  // ── Processar ────────────────────────────────────────────────────────
  async function processar(acao?: Acao) {
    const a = acao ?? acaoAtiva;
    if (!texto.trim() && !promptExtra.trim()) {
      Alert.alert("Texto vazio", "Cole ou dicte algum texto primeiro.");
      return;
    }
    if (loading) return;
    setLoading(true);
    setResultado("");
    setProvedor("");
    try {
      const result = await enviarParaIA(SYSTEM_JURIDICO, buildPrompt(a));
      if (result.erro) {
        if (result.erro.includes("chave de IA")) {
          Alert.alert(
            "Chave de IA necessária",
            result.erro,
            [
              { text: "Cancelar", style: "cancel" },
              { text: "Ir para Configurações", onPress: () => router.push("/(tabs)/config") },
            ]
          );
        } else {
          Alert.alert("Erro de IA", result.erro);
        }
      } else {
        setResultado(result.texto);
        setTextoEditado(result.texto);
        setProvedor(result.provedor);
        setPainelAtivo("resultado");
        await addHistorico({ tipo: a, entrada: texto.slice(0, 200), saida: result.texto, provedor: result.provedor });
        if (vozAtiva && cfg) { setFalando(true); await falar(result.texto, cfg.vozVelocidade); setFalando(false); }
      }
    } catch (e: any) { Alert.alert("Erro", e.message); }
    finally { setLoading(false); }
  }

  // ── Voz ──────────────────────────────────────────────────────────────
  async function toggleVoz() {
    if (falando) { await pararVoz(); setFalando(false); }
    else if (resultado && cfg) { setFalando(true); await falar(resultado, cfg.vozVelocidade); setFalando(false); }
  }

  async function iniciarDitado() {
    if (Platform.OS === "web") { Alert.alert("Disponível apenas no celular."); return; }
    try {
      await AvAudio.requestPermissionsAsync();
      await AvAudio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await AvAudio.Recording.createAsync(AvAudio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setGravando(true);
    } catch (e: any) { Alert.alert("Microfone", e.message); }
  }

  async function pararDitado() {
    setGravando(false);
    setVozLoading(true);
    try {
      if (!recordingRef.current) return;
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      if (!uri) return;
      const c = await getConfig();
      const chave = [c.chave1, c.chave2, c.chave3, c.chave4, c.chaveDemo].find(k => k?.startsWith("gsk_"));
      if (!chave) {
        Alert.alert("Chave Groq necessária", "Configure uma chave Groq (gsk_...) em qualquer slot nas Configurações.\n\nAcesse: console.groq.com");
        return;
      }
      const formData = new FormData();
      formData.append("file", { uri, type: "audio/m4a", name: "ditado.m4a" } as any);
      formData.append("model", "whisper-large-v3");
      formData.append("language", "pt");
      formData.append("response_format", "json");
      const resp = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST", headers: { Authorization: `Bearer ${chave}` }, body: formData,
      });
      if (resp.ok) { const d = await resp.json(); if (d.text) setTexto(p => p ? `${p}\n${d.text}` : d.text); }
      else { const e = await resp.text().catch(() => `Status ${resp.status}`); Alert.alert("Transcrição falhou", e.slice(0, 200)); }
    } catch (e: any) { console.warn("Ditado erro:", e); }
    finally { setVozLoading(false); }
  }

  async function importarArquivo() {
    let asset: any = null;
    try {
      const r = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (r.canceled || !r.assets?.[0]) return;
      asset = r.assets[0];
    } catch { return; }

    setImportando(true);
    try {
      const config = cfg ?? await getConfig();
      const geminiKey = [config.chave1, config.chave2, config.chave3, config.chave4].find(k => k?.startsWith("AIza"));
      const imp = await importarArquivoLocal(asset, geminiKey);
      setTexto(imp.conteudo);
      Alert.alert("✅ Importado!", `${imp.nome} (${imp.metodo})\n${(imp.conteudo.length / 1024).toFixed(0)} KB extraídos`);
    } catch (e: any) {
      Alert.alert("Erro ao importar", e?.message ?? "Erro desconhecido.");
    } finally {
      setImportando(false);
    }
  }

  // ── Importar áudio para transcrição ──────────────────────────────────
  async function importarAudio() {
    if (Platform.OS === "web") { Alert.alert("Disponível apenas no celular."); return; }
    try {
      const r = await DocumentPicker.getDocumentAsync({
        type: ["audio/*", "video/mp4", "video/quicktime", "*/*"],
        copyToCacheDirectory: true,
      });
      if (r.canceled || !r.assets?.[0]) return;
      const asset = r.assets[0];
      const c = await getConfig();
      const chave = [c.chave1, c.chave2, c.chave3, c.chave4, c.chaveDemo].find(k => k?.startsWith("gsk_"));
      if (!chave) {
        Alert.alert(
          "Chave Groq necessária",
          "Configure uma chave Groq (gsk_...) em qualquer slot nas Configurações para transcrever áudio.\n\nAcesse grátis: console.groq.com",
          [{ text: "OK" }]
        );
        return;
      }
      setAudioLoading(true);
      const formData = new FormData();
      formData.append("file", {
        uri: asset.uri,
        type: asset.mimeType || "audio/m4a",
        name: asset.name || "audio.m4a",
      } as any);
      formData.append("model", "whisper-large-v3");
      formData.append("language", "pt");
      formData.append("response_format", "json");
      const resp = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${chave}` },
        body: formData,
      });
      if (resp.ok) {
        const d = await resp.json();
        if (d.text) {
          setTexto(prev => prev.trim() ? `${prev.trim()}\n\n${d.text}` : d.text);
          Alert.alert(
            "Transcrição concluída!",
            `${asset.name}\n\n${d.text.length} caracteres transcritos.\n\nAgora escolha uma ação para processar o texto.`
          );
        }
      } else {
        const err = await resp.text().catch(() => `Status ${resp.status}`);
        Alert.alert("Falha na transcrição", err.slice(0, 300));
      }
    } catch (e: any) { Alert.alert("Erro", e.message || "Não foi possível transcrever o áudio."); }
    finally { setAudioLoading(false); }
  }

  // ── Exportar resultado ────────────────────────────────────────────────
  function textoFinal() {
    const base = textoEditado || resultado;
    return selectedTemplate ? `${selectedTemplate.conteudo}\n\n${"─".repeat(50)}\n\n${base}` : base;
  }

  async function exportarTxt() {
    if (!resultado) return;
    if (Platform.OS === "web") { await Clipboard.setStringAsync(textoFinal()); Alert.alert("Copiado!"); return; }
    setExportando(true);
    try {
      const path = `${FS.documentDirectory}resultado_${Date.now()}.txt`;
      await FS.writeAsStringAsync(path, textoFinal(), { encoding: "utf8" });
      await Sharing.shareAsync(path, { mimeType: "text/plain", dialogTitle: "Exportar TXT" });
    } catch { Alert.alert("Erro", "Não foi possível exportar."); }
    finally { setExportando(false); }
  }

  async function exportarWord() {
    if (!resultado) return;
    if (Platform.OS === "web") { Alert.alert("Use o app no celular para exportar Word."); return; }
    setExportando(true);
    try {
      const rtf = textoParaRtf(textoFinal(), wordFmt);
      const path = `${FS.documentDirectory}documento_${Date.now()}.rtf`;
      await FS.writeAsStringAsync(path, rtf, { encoding: "utf8" });
      await Sharing.shareAsync(path, { mimeType: "application/rtf", dialogTitle: "Exportar Word", UTI: "public.rtf" });
    } catch { Alert.alert("Erro", "Não foi possível exportar."); }
    finally { setExportando(false); }
  }

  async function copiarResultado() {
    if (!resultado) return;
    await Clipboard.setStringAsync(textoFinal());
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function enviarEmailResultado() {
    if (!resultado) return;
    const disponivel = await MailComposer.isAvailableAsync();
    if (!disponivel) {
      Alert.alert(
        "E-mail não disponível",
        "Configure uma conta de e-mail no dispositivo ou use o botão de compartilhamento para enviar via Gmail / Google Drive.",
        [{ text: "OK" }, { text: "Compartilhar", onPress: exportarTxt }]
      );
      return;
    }
    await MailComposer.composeAsync({
      subject: `Resultado Jurídico — ${new Date().toLocaleDateString("pt-BR")}`,
      body: textoFinal(),
    });
  }

  // ── Ementas ───────────────────────────────────────────────────────────
  function toggleEmenta(id: string) {
    setSelectedEmentaIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  async function adicionarEmenta() {
    if (!novaTitulo.trim() || !novaTexto.trim()) return;
    setSavingEmenta(true);
    try {
      await saveEmenta(novaTitulo.trim(), novaCategoria.trim(), novaTexto.trim());
      setEmentas(await getEmentas());
      setNovaTitulo(""); setNovaCategoria(""); setNovaTexto("");
      setShowAddEmenta(false);
    } finally { setSavingEmenta(false); }
  }
  async function removerEmenta(id: string) {
    Alert.alert("Excluir jurisprudência?", "", [
      { text: "Cancelar" },
      { text: "Excluir", style: "destructive", onPress: async () => {
        await deleteEmenta(id);
        setEmentas(await getEmentas());
        setSelectedEmentaIds(p => { const n = new Set(p); n.delete(id); return n; });
      }},
    ]);
  }

  // ── Templates ────────────────────────────────────────────────────────
  async function adicionarTemplate() {
    if (!novoTplNome.trim() || !novoTplConteudo.trim()) return;
    setSavingTemplate(true);
    try {
      await saveTemplate(novoTplNome.trim(), novoTplConteudo.trim());
      setTemplates(await getTemplates());
      setNovoTplNome(""); setNovoTplConteudo(""); setShowAddTemplate(false);
    } finally { setSavingTemplate(false); }
  }
  async function importarTemplate() {
    try {
      const r = await DocumentPicker.getDocumentAsync({ type: ["text/*", "*/*"] });
      if (r.canceled || !r.assets?.[0]) return;
      const txt = await FS.readAsStringAsync(r.assets[0].uri, { encoding: "utf8" });
      setNovoTplConteudo(txt.slice(0, 20000));
      if (!novoTplNome) setNovoTplNome(r.assets[0].name?.replace(/\.[^.]+$/, "") || "Template");
    } catch { Alert.alert("Erro ao importar template."); }
  }
  async function removerTemplate(id: string) {
    Alert.alert("Excluir template?", "", [
      { text: "Cancelar" },
      { text: "Excluir", style: "destructive", onPress: async () => {
        await deleteTemplate(id);
        setTemplates(await getTemplates());
        if (selectedTemplate?.id === id) setSelectedTemplate(null);
      }},
    ]);
  }

  // ── Prompts ─────────────────────────────────────────────────────────
  async function adicionarPrompt() {
    if (!novoPromptNome.trim() || !novoPromptTexto.trim()) return;
    await savePromptLib(novoPromptNome.trim(), novoPromptTexto.trim());
    setPromptsLib(await getPromptsLib());
    setNovoPromptNome(""); setNovoPromptTexto(""); setShowAddPrompt(false);
  }
  async function removerPrompt(id: string) {
    await deletePromptLib(id);
    setPromptsLib(await getPromptsLib());
  }

  // ── Formato Word ─────────────────────────────────────────────────────
  async function salvarFormato() {
    await saveWordFormat(fmtEdit);
    setWordFmt(fmtEdit);
    setShowWordFmt(false);
  }

  // ── Mini-chat de refinamento ──────────────────────────────────────────
  const [chatCmd, setChatCmd] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  async function enviarComando() {
    if (!chatCmd.trim() || !resultado) return;
    setChatLoading(true);
    try {
      const prompt = `Texto jurídico:\n\n${textoEditado || resultado}\n\n─────────\n\nComando: "${chatCmd.trim()}"\n\nApresente o resultado completo.`;
      const r = await enviarParaIA(SYSTEM_JURIDICO, prompt);
      if (r.erro) Alert.alert("Erro", r.erro);
      else { setResultado(r.texto); setTextoEditado(r.texto); setChatCmd(""); }
    } catch (e: any) { Alert.alert("Erro", e.message); }
    finally { setChatLoading(false); }
  }

  // ── Ementas filtradas ─────────────────────────────────────────────────
  const ementasFiltradas = ementas.filter(e =>
    !searchEmenta.trim() ||
    e.titulo.toLowerCase().includes(searchEmenta.toLowerCase()) ||
    e.categoria.toLowerCase().includes(searchEmenta.toLowerCase()) ||
    e.texto.toLowerCase().includes(searchEmenta.toLowerCase())
  );

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <View style={styles.root}>

      {/* ── BARRA DE ÍCONES (topo fixo) ────────────────────────── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity style={styles.hamburger} onPress={() => setMenuOpen(true)}>
          <Ionicons name="menu" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.appTitle}>⚖ Consulta Jurídica</Text>
        <View style={styles.topIcons}>
          <TouchableOpacity style={styles.topIcon} onPress={importarArquivo}>
            <Ionicons name="folder-open-outline" size={19} color={COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topIcon} onPress={() => setShowTemplates(true)}>
            <Ionicons name="document-text-outline" size={19} color={selectedTemplate ? COLORS.purple : COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topIcon} onPress={() => setShowBiblioteca(true)}>
            <Ionicons name="library-outline" size={19} color={qtdEmentasSel > 0 ? COLORS.info : COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topIcon} onPress={() => { getHistorico().then(h => { setHistorico(h); setShowHistorico(true); }); }}>
            <Ionicons name="time-outline" size={19} color={COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.vozBtn, vozAtiva && styles.vozBtnAtivo]}
            onPress={async () => { const v = !vozAtiva; setVozAtiva(v); await saveConfig({ vozAtiva: v }); }}
          >
            <Ionicons name="volume-high-outline" size={14} color={vozAtiva ? "#fff" : COLORS.textMuted} />
            <Text style={[styles.vozBtnText, vozAtiva && { color: "#fff" }]}>VOZ</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── BARRA DO MODELO ───────────────────────────────────── */}
      <View style={styles.modelBar}>
        <TouchableOpacity
          style={[styles.modelChip, !temChave && styles.modelChipDemo]}
          onPress={() => router.navigate("/(tabs)/config" as any)}
        >
          <Ionicons name="key-outline" size={12} color={temChave ? COLORS.primary : COLORS.warning} />
          <Text style={[styles.modelChipText, !temChave && { color: COLORS.warning }]}>{modeloLabel} ✓</Text>
        </TouchableOpacity>
        {modeloNumChaves > 0 && (
          <View style={styles.modelChipSecond}>
            <Text style={styles.modelChipSecondText}>{modeloNumChaves} chave{modeloNumChaves > 1 ? "s" : ""}</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => setTexto("")} style={styles.modelBarIcon}>
          <Ionicons name="trash-outline" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { setFmtEdit({ ...wordFmt }); setShowWordFmt(true); }} style={styles.modelBarIcon}>
          <Ionicons name="settings-outline" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* ── ABAS: Entrada / Resultado ─────────────────────────── */}
      <View style={styles.panelTabs}>
        <TouchableOpacity
          style={[styles.panelTab, painelAtivo === "entrada" && styles.panelTabAtivo]}
          onPress={() => setPainelAtivo("entrada")}
        >
          <Ionicons name="create-outline" size={14} color={painelAtivo === "entrada" ? COLORS.primary : COLORS.textMuted} />
          <Text style={[styles.panelTabText, painelAtivo === "entrada" && styles.panelTabTextAtivo]}>
            Entrada
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.panelTab, painelAtivo === "resultado" && styles.panelTabAtivo]}
          onPress={() => setPainelAtivo("resultado")}
        >
          <Ionicons
            name={loading ? "hourglass-outline" : resultado ? "checkmark-circle-outline" : "document-outline"}
            size={14}
            color={painelAtivo === "resultado" ? COLORS.primary : resultado ? COLORS.primary : COLORS.textMuted}
          />
          <Text style={[styles.panelTabText, painelAtivo === "resultado" && styles.panelTabTextAtivo, resultado && { color: COLORS.primary }]}>
            Resultado{resultado ? " ✓" : ""}
          </Text>
          {loading && <ActivityIndicator size={10} color={COLORS.primary} style={{ marginLeft: 4 }} />}
        </TouchableOpacity>
      </View>

      {/* ── PAINEL PRINCIPAL ────────────────────────────────── */}
      <View style={styles.mainPanel}>

        {/* ── PAINEL ENTRADA ───────────────────────────────────── */}
        {painelAtivo === "entrada" && (
        <ScrollView style={styles.leftScroll} contentContainerStyle={styles.leftContent} keyboardShouldPersistTaps="handled">

          {/* Tool row */}
          <View style={styles.toolRow}>
            <TouchableOpacity style={styles.toolChip} onPress={() => setShowPrompts(true)}>
              <Ionicons name="folder-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.toolChipText}>Prompts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolChip} onPress={importarArquivo}>
              <Ionicons name="cloud-upload-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.toolChipText}>Arquivo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toolChip, audioLoading && { borderColor: COLORS.warning }]}
              onPress={importarAudio}
              disabled={audioLoading}
            >
              {audioLoading
                ? <ActivityIndicator size={12} color={COLORS.warning} />
                : <Ionicons name="mic-circle-outline" size={14} color={COLORS.warning} />}
              <Text style={[styles.toolChipText, { color: COLORS.warning }]}>
                {audioLoading ? "Transcrevendo..." : "Áudio"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolChip} onPress={() => setShowTemplates(true)}>
              <Ionicons name="attach-outline" size={14} color={selectedTemplate ? COLORS.purple : COLORS.textMuted} />
              <Text style={[styles.toolChipText, selectedTemplate && { color: COLORS.purple }]}>
                {selectedTemplate ? selectedTemplate.nome.slice(0, 10) : "Template"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolChip} onPress={() => setShowBiblioteca(true)}>
              <Ionicons name="library-outline" size={14} color={qtdEmentasSel > 0 ? COLORS.info : COLORS.textMuted} />
              <Text style={[styles.toolChipText, qtdEmentasSel > 0 && { color: COLORS.info }]}>
                {qtdEmentasSel > 0 ? `Juris(${qtdEmentasSel})` : "Juris"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Entrada de texto */}
          <View style={styles.inputHeader}>
            <Text style={styles.inputLabel}>Entrada de texto:</Text>
            <TouchableOpacity
              style={[styles.ditarBtn, gravando && styles.ditarBtnGravando]}
              onPressIn={iniciarDitado}
              onPressOut={pararDitado}
            >
              {vozLoading
                ? <ActivityIndicator size="small" color={COLORS.primary} />
                : <Ionicons name={gravando ? "mic" : "mic-outline"} size={14} color={gravando ? "#fff" : COLORS.primary} />
              }
              <Text style={[styles.ditarText, gravando && { color: "#fff" }]}>
                {vozLoading ? "..." : gravando ? "Gravando" : "DITAR"}
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.inputTexto}
            placeholder={"Cole aqui o texto do documento, peticao, sentenca,\ncontrato ou qualquer outro texto juridico que deseja\nprocessar..."}
            placeholderTextColor="#4a6a5a"
            value={texto}
            onChangeText={setTexto}
            multiline
            textAlignVertical="top"
          />
          {texto.length > 0 && (
            <Text style={styles.charCount}>{texto.length.toLocaleString("pt-BR")} caracteres</Text>
          )}

          {/* Prompt personalizado (opcional) */}
          {promptExtra.length > 0 || true ? (
            <View style={styles.promptExtraBox}>
              <TextInput
                style={[styles.promptExtraInput, { maxHeight: 80 }]}
                placeholder='Prompt livre (opcional): "Analise focando em..."'
                placeholderTextColor={COLORS.textDim}
                value={promptExtra}
                onChangeText={setPromptExtra}
                multiline
              />
              {promptExtra.length > 0 && (
                <TouchableOpacity style={styles.promptExtraClear} onPress={() => setPromptExtra("")}>
                  <Ionicons name="close-circle" size={16} color={COLORS.textDim} />
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          {/* Modos de operacao */}
          <Text style={styles.sectionLabel}>Modos de operacao:</Text>
          <View style={styles.modosRow}>
            {MODOS.map(m => (
              <TouchableOpacity
                key={m.id}
                style={[styles.modoBtn, acaoAtiva === m.id && styles.modoBtnAtivo]}
                onPress={() => { setAcaoAtiva(m.id); processar(m.id); }}
              >
                <Ionicons name={m.icon as any} size={16} color={acaoAtiva === m.id ? COLORS.primary : COLORS.textMuted} />
                <Text style={[styles.modoBtnText, acaoAtiva === m.id && styles.modoBtnTextAtivo]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Outras acoes */}
          <Text style={styles.sectionLabel}>Outras acoes:</Text>
          <View style={styles.outrasGrid}>
            {OUTRAS.map(a => (
              <TouchableOpacity
                key={a.id}
                style={[styles.outraBtn, acaoAtiva === a.id && styles.outraBtnAtivo]}
                onPress={() => { setAcaoAtiva(a.id); processar(a.id); }}
              >
                <Ionicons name={a.icon as any} size={15} color={acaoAtiva === a.id ? COLORS.primary : COLORS.textMuted} />
                <Text style={[styles.outraBtnText, acaoAtiva === a.id && styles.outraBtnTextAtivo]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Novo Modelo */}
          <TouchableOpacity style={styles.novoModeloBtn} onPress={() => setShowPrompts(true)}>
            <Ionicons name="add" size={15} color={COLORS.textMuted} />
            <Text style={styles.novoModeloText}>Novo Modelo</Text>
          </TouchableOpacity>
        </ScrollView>
        )}

        {/* ── PAINEL RESULTADO ──────────────────────────────────── */}
        {painelAtivo === "resultado" && (
          <>
            {/* Barra de ações do resultado */}
            <View style={styles.resultBar}>
              <TouchableOpacity style={styles.voltarEntrada} onPress={() => setPainelAtivo("entrada")}>
                <Ionicons name="arrow-back" size={15} color={COLORS.primary} />
                <Text style={styles.voltarEntradaText}>Entrada</Text>
              </TouchableOpacity>
              {loading && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginLeft: 6 }} />}
              <TouchableOpacity
                style={[styles.vozBadge, vozAtiva && styles.vozBadgeAtivo]}
                onPress={async () => { const v = !vozAtiva; setVozAtiva(v); await saveConfig({ vozAtiva: v }); }}
              >
                <Ionicons name="volume-high-outline" size={12} color={vozAtiva ? "#fff" : COLORS.textMuted} />
                <Text style={[styles.vozBadgeText, vozAtiva && { color: "#fff" }]}>{vozAtiva ? "ON" : "OFF"}</Text>
              </TouchableOpacity>
              <View style={styles.resultBarIcons}>
                {resultado && detectarHtml(resultado) && (
                  <TouchableOpacity style={[styles.rBarIcon, styles.rBarHtml]} onPress={() => abrirHtmlNoBrowser(resultado, "Resultado HTML")}>
                    <Ionicons name="globe-outline" size={16} color={COLORS.info} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.rBarIcon} onPress={toggleVoz} disabled={!resultado}>
                  <Ionicons name={falando ? "stop-circle-outline" : "volume-high-outline"} size={18} color={resultado ? (falando ? COLORS.danger : COLORS.textMuted) : COLORS.textDim} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.rBarIcon} onPress={copiarResultado} disabled={!resultado}>
                  <Ionicons name={copiado ? "checkmark" : "copy-outline"} size={18} color={resultado ? (copiado ? COLORS.primary : COLORS.textMuted) : COLORS.textDim} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.rBarIcon} onPress={enviarEmailResultado} disabled={!resultado}>
                  <Ionicons name="mail-outline" size={18} color={resultado ? COLORS.textMuted : COLORS.textDim} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.rBarIcon} onPress={exportarTxt} disabled={!resultado || exportando}>
                  <Ionicons name="share-outline" size={18} color={resultado ? COLORS.textMuted : COLORS.textDim} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.rBarIcon} onPress={exportarWord} disabled={!resultado || exportando}>
                  {exportando
                    ? <ActivityIndicator size="small" color={COLORS.textMuted} />
                    : <Ionicons name="document-outline" size={18} color={resultado ? "#4a90d9" : COLORS.textDim} />
                  }
                </TouchableOpacity>
                <TouchableOpacity style={styles.rBarIcon} onPress={() => { setFmtEdit({ ...wordFmt }); setShowWordFmt(true); }}>
                  <Ionicons name="settings-outline" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.rightScroll} contentContainerStyle={styles.rightContent} keyboardShouldPersistTaps="handled">
              {loading ? (
                <View style={styles.resultLoading}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.resultLoadingText}>Processando com IA...</Text>
                </View>
              ) : resultado ? (
                <>
                  {provedor ? (
                    <View style={styles.provedorBadge}>
                      <Text style={styles.provedorText}>{provedor}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.resultText} selectable>{textoEditado || resultado}</Text>

                  {/* Mini-chat refinamento */}
                  <View style={styles.chatArea}>
                    <Text style={styles.chatLabel}>Refinar resultado:</Text>
                    <View style={styles.chatRow}>
                      <TextInput
                        style={[styles.chatInput, { maxHeight: 80 }]}
                        placeholder='Ex: "Encurte", "Adicione fundamentação", "Tom mais formal"...'
                        placeholderTextColor={COLORS.textDim}
                        value={chatCmd}
                        onChangeText={setChatCmd}
                        multiline
                      />
                      <TouchableOpacity
                        style={[styles.chatSend, (!chatCmd.trim() || chatLoading) && styles.chatSendDis]}
                        onPress={enviarComando}
                        disabled={!chatCmd.trim() || chatLoading}
                      >
                        {chatLoading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={16} color="#fff" />}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Editar em tela cheia */}
                  <TouchableOpacity style={styles.editarBtn} onPress={() => { setTextoEditado(textoEditado || resultado); setShowEditorFullscreen(true); }}>
                    <Ionicons name="expand-outline" size={15} color={COLORS.info} />
                    <Text style={styles.editarBtnText}>Editar texto em tela cheia</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.emptyResult}>
                  <Ionicons name="create-outline" size={40} color={COLORS.textDim} />
                  <Text style={styles.emptyResultText}>Nenhum resultado ainda.</Text>
                  <TouchableOpacity style={styles.irEntradaBtn} onPress={() => setPainelAtivo("entrada")}>
                    <Ionicons name="arrow-back" size={14} color={COLORS.primary} />
                    <Text style={styles.irEntradaBtnText}>Ir para Entrada</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </>
        )}
      </View>

      {/* ── BARRA INFERIOR: DITAR POR VOZ ─────────────────────── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 4 }]}>
        <TouchableOpacity
          style={[styles.ditatBtn, gravando && styles.ditatBtnGravando]}
          onPressIn={iniciarDitado}
          onPressOut={pararDitado}
        >
          {vozLoading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name={gravando ? "mic" : "mic-outline"} size={16} color="#fff" />
          }
          <Text style={styles.ditatBtnText}>
            {vozLoading ? "Transcrevendo..." : gravando ? "Gravando... (solte para parar)" : "DITAR POR VOZ"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.onBtn, vozAtiva && styles.onBtnAtivo]}
          onPress={async () => { const v = !vozAtiva; setVozAtiva(v); await saveConfig({ vozAtiva: v }); }}
        >
          <Ionicons name="volume-high-outline" size={15} color="#fff" />
          <Text style={styles.onBtnText}>ON</Text>
        </TouchableOpacity>
      </View>

      {/* ══════════════════════════════════════════════════════════════
          MODAL: EDITOR TELA CHEIA
      ══════════════════════════════════════════════════════════════ */}
      <Modal visible={showEditorFullscreen} animationType="slide" presentationStyle="fullScreen">
        <View style={[styles.modal, { paddingTop: insets.top + 4 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar Resultado</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity style={styles.exportChip} onPress={exportarTxt}>
                <Ionicons name="download-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.exportChipText}>TXT</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.exportChip, { borderColor: "#4a90d940" }]} onPress={exportarWord}>
                <Ionicons name="document-outline" size={14} color="#4a90d9" />
                <Text style={[styles.exportChipText, { color: "#4a90d9" }]}>Word</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowEditorFullscreen(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>
          <TextInput
            style={styles.editorInput}
            value={textoEditado}
            onChangeText={setTextoEditado}
            multiline
            textAlignVertical="top"
            autoFocus
            scrollEnabled
          />
          <View style={[styles.editorFooter, { paddingBottom: insets.bottom + 12 }]}>
            <Text style={styles.editorCharCount}>{textoEditado.length.toLocaleString("pt-BR")} chars</Text>
            <View style={styles.editorFooterBtns}>
              <TouchableOpacity style={styles.editorCancelBtn} onPress={() => setShowEditorFullscreen(false)}>
                <Text style={styles.editorCancelText}>Fechar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editorSaveBtn} onPress={() => { setResultado(textoEditado); setShowEditorFullscreen(false); }}>
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={styles.editorSaveText}>Salvar edição</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════
          MODAL: FORMATO DO DOCUMENTO WORD
      ══════════════════════════════════════════════════════════════ */}
      <Modal visible={showWordFmt} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { paddingTop: insets.top + 8 }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Formato do Documento Word</Text>
              <Text style={styles.modalSub}>Defina fonte, tamanho e espaçamento. Aplicado em todos os documentos baixados como Word.</Text>
            </View>
            <TouchableOpacity onPress={() => setShowWordFmt(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
            <View style={styles.fmtRow}>
              <View style={{ flex: 2 }}>
                <Text style={styles.fmtLabel}>Fonte</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    {FONTES.map(f => (
                      <TouchableOpacity key={f} style={[styles.fonteBtn, fmtEdit.fonte === f && styles.fonteBtnAtivo]} onPress={() => setFmtEdit(p => ({ ...p, fonte: f }))}>
                        <Text style={[styles.fonteBtnText, fmtEdit.fonte === f && { color: COLORS.primary }]}>{f}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fmtLabel}>Tamanho (pt)</Text>
                <TextInput style={styles.fmtInput} value={String(fmtEdit.tamanho)} onChangeText={v => setFmtEdit(p => ({ ...p, tamanho: Number(v) || 12 }))} keyboardType="numeric" />
              </View>
            </View>
            <View style={styles.fmtRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fmtLabel}>Espaçamento entre linhas</Text>
                <TextInput style={styles.fmtInput} value={String(fmtEdit.espacamento)} onChangeText={v => setFmtEdit(p => ({ ...p, espacamento: Number(v) || 1.5 }))} keyboardType="numeric" />
                <Text style={styles.fmtHint}>1 = simples · 1,5 · 2 = duplo</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fmtLabel}>Recuo parágrafo (cm)</Text>
                <TextInput style={styles.fmtInput} value={String(fmtEdit.recuoParagrafo)} onChangeText={v => setFmtEdit(p => ({ ...p, recuoParagrafo: Number(v) || 4 }))} keyboardType="numeric" />
              </View>
            </View>
            <Text style={styles.fmtLabel}>Margens (cm)</Text>
            <View style={styles.fmtRow}>
              {(["margemSuperior", "margemInferior", "margemEsquerda", "margemDireita"] as const).map((k, i) => (
                <View key={k} style={{ flex: 1, alignItems: "center" }}>
                  <Text style={styles.fmtLabelSm}>{["Superior", "Inferior", "Esquerda", "Direita"][i]}</Text>
                  <TextInput style={[styles.fmtInput, { textAlign: "center" }]} value={String(fmtEdit[k])} onChangeText={v => setFmtEdit(p => ({ ...p, [k]: Number(v) || 2 }))} keyboardType="numeric" />
                </View>
              ))}
            </View>
            <Text style={styles.fmtHint}>Padrão ABNT: sup 3 · inf 2 · esq 3 · dir 2</Text>
          </ScrollView>
          <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 12 }]}>
            <TouchableOpacity style={styles.confirmBtn} onPress={salvarFormato}>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.confirmBtnText}>Salvar e fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════
          MODAL: BIBLIOTECA DE JURISPRUDÊNCIAS
      ══════════════════════════════════════════════════════════════ */}
      <Modal visible={showBiblioteca} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { paddingTop: insets.top + 4 }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Biblioteca de Jurisprudências</Text>
              <Text style={styles.modalSub}>Pesquise jurisprudências do STJ, STF e TRFs ou salve ementas manualmente.</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity style={styles.addBtnSmall} onPress={() => setShowAddEmenta(true)}>
                <Ionicons name="add" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowBiblioteca(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={16} color={COLORS.textDim} />
            <TextInput style={styles.searchInput} placeholder="Buscar ementa..." placeholderTextColor={COLORS.textDim} value={searchEmenta} onChangeText={setSearchEmenta} />
            {searchEmenta.length > 0 && <TouchableOpacity onPress={() => setSearchEmenta("")}><Ionicons name="close-circle" size={16} color={COLORS.textDim} /></TouchableOpacity>}
          </View>
          {qtdEmentasSel > 0 && (
            <View style={styles.batchBar}>
              <Text style={styles.batchText}>{qtdEmentasSel} selecionada{qtdEmentasSel > 1 ? "s" : ""}</Text>
              <TouchableOpacity onPress={() => setSelectedEmentaIds(new Set())}><Text style={styles.batchClear}>Limpar seleção</Text></TouchableOpacity>
            </View>
          )}
          <FlatList
            data={ementasFiltradas}
            keyExtractor={e => e.id}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 12 }}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Ionicons name="library-outline" size={40} color={COLORS.textDim} />
                <Text style={styles.emptyBoxText}>Sua biblioteca está vazia. Adicione ementas para usar como referência.</Text>
                <TouchableOpacity style={styles.addBtnSmall} onPress={() => setShowAddEmenta(true)}>
                  <Ionicons name="add" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item: e }) => {
              const sel = selectedEmentaIds.has(e.id);
              return (
                <TouchableOpacity style={[styles.listItem, sel && styles.listItemSel]} onPress={() => toggleEmenta(e.id)} onLongPress={() => removerEmenta(e.id)}>
                  <View style={[styles.checkbox, sel && styles.checkboxSel]}>
                    {sel && <Ionicons name="checkmark" size={13} color="#fff" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listItemTitle, sel && { color: COLORS.info }]} numberOfLines={2}>{e.titulo}</Text>
                    {e.categoria ? <Text style={styles.listItemSub}>{e.categoria}</Text> : null}
                    <Text style={styles.listItemPreview} numberOfLines={2}>{e.texto}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removerEmenta(e.id)} style={{ padding: 6 }}>
                    <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }}
          />
          <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 12 }]}>
            <TouchableOpacity style={styles.confirmBtn} onPress={() => setShowBiblioteca(false)}>
              <Text style={styles.confirmBtnText}>{qtdEmentasSel > 0 ? `Usar ${qtdEmentasSel} jurisprudência${qtdEmentasSel > 1 ? "s" : ""}` : "Fechar"}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Modal visible={showAddEmenta} animationType="slide" presentationStyle="pageSheet">
          <View style={[styles.modal, { paddingTop: insets.top + 4 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova Jurisprudência</Text>
              <TouchableOpacity onPress={() => setShowAddEmenta(false)}><Ionicons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <Text style={styles.fieldLabel}>Título *</Text>
              <TextInput style={styles.fieldInput} placeholder="Ex: STJ, REsp 1.234.567/SP..." placeholderTextColor={COLORS.textDim} value={novaTitulo} onChangeText={setNovaTitulo} />
              <Text style={styles.fieldLabel}>Categoria (opcional)</Text>
              <TextInput style={styles.fieldInput} placeholder="Ex: Responsabilidade Civil..." placeholderTextColor={COLORS.textDim} value={novaCategoria} onChangeText={setNovaCategoria} />
              <Text style={styles.fieldLabel}>Texto da ementa *</Text>
              <TextInput style={[styles.fieldInput, { minHeight: 150, textAlignVertical: "top" }]} placeholder="Cole a ementa ou acórdão..." placeholderTextColor={COLORS.textDim} value={novaTexto} onChangeText={setNovaTexto} multiline />
            </ScrollView>
            <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 12 }]}>
              <TouchableOpacity style={[styles.confirmBtn, (!novaTitulo.trim() || !novaTexto.trim() || savingEmenta) && styles.btnDis]} onPress={adicionarEmenta} disabled={!novaTitulo.trim() || !novaTexto.trim() || savingEmenta}>
                {savingEmenta ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="save-outline" size={18} color="#fff" />}
                <Text style={styles.confirmBtnText}>Salvar Jurisprudência</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════
          MODAL: TEMPLATES
      ══════════════════════════════════════════════════════════════ */}
      <Modal visible={showTemplates} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { paddingTop: insets.top + 4 }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Templates de Documento</Text>
              <Text style={styles.modalSub}>Importe seu Word com cabeçalho ou crie templates manualmente. O resultado da IA será inserido no seu documento.</Text>
            </View>
            <TouchableOpacity onPress={() => setShowTemplates(false)}><Ionicons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
          </View>
          <View style={{ padding: 12, flexDirection: "row", gap: 8 }}>
            <TouchableOpacity style={[styles.tplChip, !selectedTemplate && styles.tplChipAtivo]} onPress={() => setSelectedTemplate(null)}>
              <Text style={[styles.tplChipText, !selectedTemplate && { color: COLORS.primary }]}>Sem template</Text>
            </TouchableOpacity>
            {selectedTemplate && <Text style={styles.tplChipSel} numberOfLines={1}>{selectedTemplate.nome}</Text>}
          </View>
          <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 12, marginBottom: 8 }}>
            <TouchableOpacity style={[styles.confirmBtn, { flex: 1, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border }]} onPress={() => setShowAddTemplate(true)}>
              <Ionicons name="add" size={16} color={COLORS.textMuted} />
              <Text style={[styles.confirmBtnText, { color: COLORS.textMuted }]}>Novo Template</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.confirmBtn, { flex: 1 }]} onPress={() => { setShowAddTemplate(true); setTimeout(importarTemplate, 300); }}>
              <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
              <Text style={styles.confirmBtnText}>Importar Word</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={templates}
            keyExtractor={t => t.id}
            contentContainerStyle={{ padding: 12 }}
            ListEmptyComponent={<View style={styles.emptyBox}><Text style={styles.emptyBoxText}>Nenhum template criado ainda.</Text></View>}
            renderItem={({ item: t }) => {
              const sel = selectedTemplate?.id === t.id;
              return (
                <TouchableOpacity style={[styles.listItem, sel && styles.listItemSel]} onPress={() => { setSelectedTemplate(sel ? null : t); setShowTemplates(false); }} onLongPress={() => removerTemplate(t.id)}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listItemTitle, sel && { color: COLORS.purple }]}>{t.nome}</Text>
                    <Text style={styles.listItemPreview} numberOfLines={3}>{t.conteudo}</Text>
                    <Text style={styles.listItemSub}>{t.conteudo.length} chars</Text>
                  </View>
                  {sel && <Ionicons name="checkmark-circle" size={20} color={COLORS.purple} />}
                  <TouchableOpacity onPress={() => removerTemplate(t.id)} style={{ padding: 6 }}>
                    <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }}
          />
        </View>
        <Modal visible={showAddTemplate} animationType="slide" presentationStyle="pageSheet">
          <View style={[styles.modal, { paddingTop: insets.top + 4 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Template</Text>
              <TouchableOpacity onPress={() => setShowAddTemplate(false)}><Ionicons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <Text style={styles.fieldLabel}>Nome do template *</Text>
              <TextInput style={styles.fieldInput} placeholder="Ex: Petição Inicial — Dano Moral" placeholderTextColor={COLORS.textDim} value={novoTplNome} onChangeText={setNovoTplNome} />
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.fieldLabel}>Conteúdo do modelo *</Text>
                <TouchableOpacity onPress={importarTemplate} style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
                  <Ionicons name="cloud-upload-outline" size={14} color={COLORS.purple} />
                  <Text style={{ fontSize: 12, color: COLORS.purple }}>Importar arquivo</Text>
                </TouchableOpacity>
              </View>
              <TextInput style={[styles.fieldInput, { minHeight: 200, textAlignVertical: "top" }]} placeholder="Cole o cabeçalho, slogan, estrutura do documento..." placeholderTextColor={COLORS.textDim} value={novoTplConteudo} onChangeText={setNovoTplConteudo} multiline />
            </ScrollView>
            <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 12 }]}>
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: COLORS.purple }, (!novoTplNome.trim() || !novoTplConteudo.trim() || savingTemplate) && styles.btnDis]} onPress={adicionarTemplate} disabled={!novoTplNome.trim() || !novoTplConteudo.trim() || savingTemplate}>
                {savingTemplate ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="save-outline" size={18} color="#fff" />}
                <Text style={styles.confirmBtnText}>Salvar Template</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════
          MODAL: BIBLIOTECA DE PROMPTS
      ══════════════════════════════════════════════════════════════ */}
      <Modal visible={showPrompts} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { paddingTop: insets.top + 4 }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Biblioteca de Prompts</Text>
              <Text style={styles.modalSub}>Guarde seus modelos de prompt para consultar e copiar quando precisar.</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity style={styles.addBtnSmall} onPress={() => setShowAddPrompt(true)}>
                <Ionicons name="add" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowPrompts(false)}><Ionicons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
            </View>
          </View>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={16} color={COLORS.textDim} />
            <TextInput style={styles.searchInput} placeholder="Buscar prompt..." placeholderTextColor={COLORS.textDim} value={searchPrompt} onChangeText={setSearchPrompt} />
          </View>
          <FlatList
            data={promptsLib.filter(p => !searchPrompt || p.nome.toLowerCase().includes(searchPrompt.toLowerCase()) || p.texto.toLowerCase().includes(searchPrompt.toLowerCase()))}
            keyExtractor={p => p.id}
            contentContainerStyle={{ padding: 12 }}
            ListEmptyComponent={<View style={styles.emptyBox}><Ionicons name="folder-outline" size={40} color={COLORS.textDim} /><Text style={styles.emptyBoxText}>Sua biblioteca de prompts está vazia. Adicione prompts para consultar depois.</Text></View>}
            renderItem={({ item: p }) => (
              <TouchableOpacity style={styles.listItem} onPress={() => { setPromptExtra(p.texto); setShowPrompts(false); }} onLongPress={() => removerPrompt(p.id)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listItemTitle}>{p.nome}</Text>
                  <Text style={styles.listItemPreview} numberOfLines={2}>{p.texto}</Text>
                </View>
                <View style={{ gap: 6 }}>
                  <TouchableOpacity onPress={() => { setPromptExtra(p.texto); setShowPrompts(false); }}>
                    <Ionicons name="copy-outline" size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removerPrompt(p.id)}>
                    <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
        <Modal visible={showAddPrompt} animationType="slide" presentationStyle="pageSheet">
          <View style={[styles.modal, { paddingTop: insets.top + 4 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Prompt</Text>
              <TouchableOpacity onPress={() => setShowAddPrompt(false)}><Ionicons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <Text style={styles.fieldLabel}>Nome *</Text>
              <TextInput style={styles.fieldInput} placeholder="Ex: Análise de Contrato" placeholderTextColor={COLORS.textDim} value={novoPromptNome} onChangeText={setNovoPromptNome} />
              <Text style={styles.fieldLabel}>Texto do prompt *</Text>
              <TextInput style={[styles.fieldInput, { minHeight: 150, textAlignVertical: "top" }]} placeholder="Cole ou escreva o prompt aqui..." placeholderTextColor={COLORS.textDim} value={novoPromptTexto} onChangeText={setNovoPromptTexto} multiline />
            </ScrollView>
            <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 12 }]}>
              <TouchableOpacity style={[styles.confirmBtn, (!novoPromptNome.trim() || !novoPromptTexto.trim()) && styles.btnDis]} onPress={adicionarPrompt} disabled={!novoPromptNome.trim() || !novoPromptTexto.trim()}>
                <Ionicons name="save-outline" size={18} color="#fff" />
                <Text style={styles.confirmBtnText}>Salvar Prompt</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════
          MODAL: HISTÓRICO
      ══════════════════════════════════════════════════════════════ */}
      <Modal visible={showHistorico} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { paddingTop: insets.top + 4 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Histórico de Resultados</Text>
            <TouchableOpacity onPress={() => setShowHistorico(false)}><Ionicons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
          </View>
          <FlatList
            data={historico}
            keyExtractor={i => i.id}
            contentContainerStyle={{ padding: 12 }}
            ListEmptyComponent={<View style={styles.emptyBox}><Ionicons name="time-outline" size={40} color={COLORS.textDim} /><Text style={styles.emptyBoxText}>Nenhum resultado salvo ainda. Use o assistente e os resultados aparecerão aqui.</Text></View>}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.listItem} onPress={() => { setResultado(item.saida); setTextoEditado(item.saida); setShowHistorico(false); }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={styles.listItemTitle}>{item.tipo}</Text>
                    <Text style={styles.listItemSub}>{new Date(item.data).toLocaleDateString("pt-BR")}</Text>
                  </View>
                  <Text style={styles.listItemPreview} numberOfLines={2}>{item.entrada}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* ── MENU LATERAL ────────────────────────────────────────── */}
      <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  // ── Top Bar ────────────────────────────────────────────────────────
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 12, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  },
  hamburger: {
    width: 36, height: 36, alignItems: "center", justifyContent: "center",
    borderRadius: 8, marginRight: 8,
  },
  appTitle: { flex: 1, fontSize: 14, fontWeight: "800", color: COLORS.text },
  topIcons: { flexDirection: "row", alignItems: "center", gap: 2 },
  topIcon: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 7 },
  vozBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 7,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgInput,
  },
  vozBtnAtivo: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  vozBtnText: { fontSize: 11, fontWeight: "700", color: COLORS.textMuted },

  // ── Model Bar ──────────────────────────────────────────────────────
  modelBar: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  },
  modelChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#0f2d1f", paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 7, borderWidth: 1, borderColor: COLORS.primary,
  },
  modelChipDemo: { borderColor: COLORS.warning, backgroundColor: "#1f1a0a" },
  modelChipText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  modelChipSecond: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgInput,
  },
  modelChipSecondText: { fontSize: 12, color: COLORS.textMuted, fontWeight: "600" },
  modelBarIcon: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },

  // ── Panel Tabs ─────────────────────────────────────────────────────
  panelTabs: {
    flexDirection: "row", backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  panelTab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10,
    borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  panelTabAtivo: { borderBottomColor: COLORS.primary },
  panelTabText: { fontSize: 13, fontWeight: "700", color: COLORS.textMuted },
  panelTabTextAtivo: { color: COLORS.primary },

  // ── Main Panel ─────────────────────────────────────────────────────
  mainPanel: { flex: 1, flexDirection: "column" },
  leftScroll: { flex: 1 },
  leftContent: { padding: 10, paddingBottom: 4, flexGrow: 0 },

  // ── Tool Row ───────────────────────────────────────────────────────
  toolRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  toolChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 7, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgCard,
  },
  toolChipText: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600" },

  // ── Input ──────────────────────────────────────────────────────────
  inputHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  inputLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: "600" },
  ditarBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#0f2d1f", paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 18, borderWidth: 1, borderColor: COLORS.primary,
  },
  ditarBtnGravando: { backgroundColor: COLORS.danger, borderColor: COLORS.danger },
  ditarText: { fontSize: 11, fontWeight: "800", color: COLORS.primary },
  inputTexto: {
    backgroundColor: "#0f1a12", borderWidth: 0,
    color: "#7aaa8a", fontSize: 13, lineHeight: 20,
    minHeight: 110, padding: 10, borderRadius: 4,
    marginBottom: 4, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  charCount: { fontSize: 10, color: COLORS.textDim, textAlign: "right", marginBottom: 6 },
  promptExtraBox: {
    backgroundColor: COLORS.bgCard, borderRadius: 8, borderWidth: 1,
    borderColor: COLORS.border, marginBottom: 8, position: "relative",
  },
  promptExtraInput: { color: COLORS.text, fontSize: 12, padding: 10, minHeight: 40 },
  promptExtraClear: { position: "absolute", top: 8, right: 8 },

  // ── Modos ──────────────────────────────────────────────────────────
  sectionLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: "700", marginBottom: 6, marginTop: 4 },
  modosRow: { flexDirection: "row", gap: 6, marginBottom: 8 },
  modoBtn: {
    flex: 1, alignItems: "center", gap: 4, padding: 10,
    borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgCard,
  },
  modoBtnAtivo: { borderColor: COLORS.primary, backgroundColor: "#0f2d1f" },
  modoBtnText: { fontSize: 10, color: COLORS.textMuted, fontWeight: "600", textAlign: "center" },
  modoBtnTextAtivo: { color: COLORS.primary },

  // ── Outras ações ───────────────────────────────────────────────────
  outrasGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  outraBtn: {
    width: "30%", flexGrow: 1, alignItems: "center", gap: 4, padding: 10,
    borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgCard,
  },
  outraBtnAtivo: { borderColor: COLORS.primary, backgroundColor: "#0f2d1f" },
  outraBtnText: { fontSize: 10, color: COLORS.textMuted, fontWeight: "600", textAlign: "center" },
  outraBtnTextAtivo: { color: COLORS.primary },
  novoModeloBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard, marginBottom: 8,
  },
  novoModeloText: { fontSize: 13, color: COLORS.textMuted, fontWeight: "600" },

  // ── Voltar Entrada ─────────────────────────────────────────────────
  voltarEntrada: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 7, backgroundColor: COLORS.bgInput,
  },
  voltarEntradaText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  irEntradaBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 14, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 10, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
  },
  irEntradaBtnText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },

  // ── Result Bar ─────────────────────────────────────────────────────
  resultBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 10, paddingVertical: 8,
    backgroundColor: "#0f1e14",
    borderBottomWidth: 1, borderBottomColor: "#1a3a20",
    gap: 6,
  },
  resultBarLeft: { flexDirection: "row", alignItems: "center" },
  resultBarLabel: { fontSize: 12, color: "#6a9a7a", fontWeight: "700" },
  vozBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6, borderWidth: 1, borderColor: "#3a5a4a",
    backgroundColor: "#1a2f1f",
  },
  vozBadgeAtivo: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  vozBadgeText: { fontSize: 11, fontWeight: "700", color: "#6a9a7a" },
  resultBarIcons: { flexDirection: "row", alignItems: "center", marginLeft: "auto", gap: 2 },
  rBarIcon: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 6 },
  rBarHtml: { backgroundColor: "#0d1e2a", borderWidth: 1, borderColor: COLORS.info + "50" },

  // ── Result area ────────────────────────────────────────────────────
  rightScroll: { flex: 1, maxHeight: 340 },
  rightContent: { padding: 12, paddingBottom: 20 },
  resultLoading: { alignItems: "center", paddingVertical: 40, gap: 12 },
  resultLoadingText: { color: COLORS.textMuted, fontSize: 13 },
  provedorBadge: {
    alignSelf: "flex-start", backgroundColor: "#0f2d1f",
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 8,
  },
  provedorText: { fontSize: 10, color: COLORS.primary, fontWeight: "700" },
  resultText: { color: COLORS.text, fontSize: 13, lineHeight: 22 },
  emptyResult: { alignItems: "center", paddingVertical: 30, gap: 10 },
  emptyResultText: { color: COLORS.textDim, fontSize: 12, textAlign: "center" },
  chatArea: { marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  chatLabel: { fontSize: 11, color: COLORS.textDim, fontWeight: "700", marginBottom: 6 },
  chatRow: { flexDirection: "row", gap: 6, alignItems: "flex-end" },
  chatInput: {
    flex: 1, backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, color: COLORS.text, fontSize: 12,
  },
  chatSend: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.accent, alignItems: "center", justifyContent: "center" },
  chatSendDis: { backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.border },
  editarBtn: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10,
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
    borderWidth: 1, borderColor: `${COLORS.info}50`, backgroundColor: `${COLORS.info}10`,
  },
  editarBtnText: { fontSize: 12, color: COLORS.info, fontWeight: "600" },

  // ── Bottom Bar ─────────────────────────────────────────────────────
  bottomBar: {
    flexDirection: "row", gap: 8, paddingHorizontal: 10, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.bgCard,
  },
  ditatBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#3a5a3a", paddingVertical: 13, borderRadius: 10,
  },
  ditatBtnGravando: { backgroundColor: COLORS.danger },
  ditatBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  onBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: "#3a5a3a", paddingHorizontal: 18, paddingVertical: 13, borderRadius: 10,
  },
  onBtnAtivo: { backgroundColor: COLORS.primary },
  onBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  // ── Modais compartilhados ──────────────────────────────────────────
  modal: { flex: 1, backgroundColor: COLORS.bg },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: COLORS.text },
  modalSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 3, lineHeight: 17, maxWidth: 260 },
  modalFooter: { padding: 14, borderTopWidth: 1, borderTopColor: COLORS.border },
  confirmBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: COLORS.primary, borderRadius: 12, padding: 14,
  },
  confirmBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  addBtnSmall: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  btnDis: { opacity: 0.4 },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    margin: 12, backgroundColor: COLORS.bgInput, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
  },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 14 },
  batchBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: `${COLORS.info}15`, borderBottomWidth: 1, borderBottomColor: `${COLORS.info}30`,
  },
  batchText: { fontSize: 12, color: COLORS.info, fontWeight: "700" },
  batchClear: { fontSize: 12, color: COLORS.textMuted },
  emptyBox: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyBoxText: { color: COLORS.textMuted, textAlign: "center", fontSize: 13, lineHeight: 20, maxWidth: 260 },
  listItem: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: COLORS.bgCard, borderRadius: 10, borderWidth: 1,
    borderColor: COLORS.border, padding: 12, marginBottom: 8,
  },
  listItemSel: { borderColor: COLORS.info, backgroundColor: `${COLORS.info}10` },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", marginTop: 2 },
  checkboxSel: { backgroundColor: COLORS.info, borderColor: COLORS.info },
  listItemTitle: { fontSize: 13, fontWeight: "700", color: COLORS.text, marginBottom: 2 },
  listItemSub: { fontSize: 11, color: COLORS.info, fontWeight: "600", marginBottom: 2 },
  listItemPreview: { fontSize: 12, color: COLORS.textMuted, lineHeight: 17 },
  fieldLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: "700", marginBottom: 6, marginTop: 12 },
  fieldInput: {
    backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: COLORS.text, fontSize: 14,
  },
  // Formato Word
  fmtRow: { flexDirection: "row", gap: 12 },
  fmtLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: "700", marginBottom: 6 },
  fmtLabelSm: { fontSize: 11, color: COLORS.textDim, fontWeight: "600", marginBottom: 4, textAlign: "center" },
  fmtInput: {
    backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10, color: COLORS.text, fontSize: 14,
  },
  fmtHint: { fontSize: 11, color: COLORS.textDim, marginTop: 4 },
  fonteBtn: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgInput,
  },
  fonteBtnAtivo: { borderColor: COLORS.primary, backgroundColor: "#0f2d1f" },
  fonteBtnText: { fontSize: 12, color: COLORS.textMuted },
  // Templates
  tplChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgInput,
  },
  tplChipAtivo: { borderColor: COLORS.primary, backgroundColor: "#0f2d1f" },
  tplChipText: { fontSize: 12, color: COLORS.textMuted, fontWeight: "600" },
  tplChipSel: { flex: 1, fontSize: 12, color: COLORS.purple, fontWeight: "700", paddingVertical: 6, paddingHorizontal: 4 },
  // Editor tela cheia
  exportChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgCard,
  },
  exportChipText: { fontSize: 12, color: COLORS.textMuted, fontWeight: "700" },
  editorInput: {
    flex: 1, backgroundColor: COLORS.bgInput, margin: 12, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.border, padding: 14,
    color: COLORS.text, fontSize: 14, lineHeight: 22, textAlignVertical: "top",
  },
  editorFooter: { paddingHorizontal: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 8 },
  editorCharCount: { fontSize: 11, color: COLORS.textDim, textAlign: "right" },
  editorFooterBtns: { flexDirection: "row", gap: 10 },
  editorCancelBtn: { flex: 1, padding: 13, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: "center" },
  editorCancelText: { color: COLORS.textMuted, fontSize: 14, fontWeight: "600" },
  editorSaveBtn: { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: COLORS.primary, borderRadius: 10, padding: 13 },
  editorSaveText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
