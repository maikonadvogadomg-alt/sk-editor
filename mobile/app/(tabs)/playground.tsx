import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Platform, Modal, FlatList,
  ActivityIndicator, KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { abrirHtmlNoBrowser } from "@/components/HtmlViewer";
import {
  getPlaygroundSnippets, savePlaygroundSnippet, savePlaygroundSnippetsBatch,
  deletePlaygroundSnippet, updatePlaygroundSnippet,
  PlaygroundSnippet, getConfig,
} from "@/services/storage";
import SideMenu from "@/components/SideMenu";

const FS = FileSystem as any;
const AUTOSAVE_KEY = "@aj_playground_auto";

export default function Playground() {
  const insets = useSafeAreaInsets();

  const [codigo, setCodigo] = useState("");
  const [snippets, setSnippets] = useState<PlaygroundSnippet[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editorOpen, setEditorOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [importando, setImportando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Salvar modal
  const [saveModal, setSaveModal] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);

  // Editar nome snippet
  const [renameModal, setRenameModal] = useState(false);
  const [renameId, setRenameId] = useState("");
  const [renameName, setRenameName] = useState("");

  useEffect(() => {
    carregarSnippets();
    AsyncStorage.getItem(AUTOSAVE_KEY).then(v => { if (v) setCodigo(v); }).catch(() => {});
  }, []);

  // Autosave a cada mudança de código
  useEffect(() => {
    const t = setTimeout(() => {
      AsyncStorage.setItem(AUTOSAVE_KEY, codigo).catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [codigo]);

  async function carregarSnippets() {
    try {
      const s = await getPlaygroundSnippets();
      setSnippets(s);
    } catch {
      setSnippets([]);
    }
  }

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function abrirSalvar() {
    setSaveName("");
    setSaveModal(true);
  }

  async function confirmarSalvar() {
    const nome = saveName.trim();
    if (!nome) { Alert.alert("Digite um nome para o snippet."); return; }
    if (!codigo.trim()) { Alert.alert("O editor está vazio. Cole ou escreva o código primeiro."); return; }
    setSaving(true);
    try {
      await savePlaygroundSnippet(nome, codigo);
      await carregarSnippets();
      setSaveModal(false);
      setSaveName("");
    } catch (e: any) {
      Alert.alert("Erro ao salvar", e.message || "Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function deletarSnippet(id: string, nome: string) {
    Alert.alert(`Excluir "${nome}"?`, "Esta ação não pode ser desfeita.", [
      { text: "Cancelar" },
      {
        text: "Excluir", style: "destructive", onPress: async () => {
          await deletePlaygroundSnippet(id);
          await carregarSnippets();
        },
      },
    ]);
  }

  function carregarNoEditor(s: PlaygroundSnippet) {
    Alert.alert(
      `Carregar "${s.nome}"?`,
      "Isso vai substituir o código no editor. Salve antes se quiser guardar.",
      [
        { text: "Cancelar" },
        {
          text: "Carregar", onPress: () => {
            setCodigo(s.codigo);
            setEditorOpen(true);
          },
        },
      ]
    );
  }

  async function abrirRenomear(s: PlaygroundSnippet) {
    setRenameId(s.id);
    setRenameName(s.nome);
    setRenameModal(true);
  }

  async function confirmarRenomear() {
    if (!renameName.trim()) return;
    await updatePlaygroundSnippet(renameId, { nome: renameName.trim() });
    await carregarSnippets();
    setRenameModal(false);
  }

  // ── Importar arquivo único (qualquer tipo, sem filtro) ───────────────
  async function importarArquivo() {
    let asset: any = null;
    try {
      const r = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (r.canceled || !r.assets?.[0]) return;
      asset = r.assets[0];
    } catch { return; }

    setImportando(true);
    try {
      // Tenta fetch primeiro (funciona para qualquer URI, texto ou binário)
      let txt = "";
      try {
        const resp = await fetch(asset.uri);
        txt = await resp.text();
      } catch {
        txt = await FS.readAsStringAsync(asset.uri, { encoding: "utf8" });
      }
      setCodigo(txt);
      setEditorOpen(true);
      Alert.alert("Importado!", `${asset.name || "arquivo"} — ${(txt.length / 1024).toFixed(0)} KB`);
    } catch (e: any) {
      // Último recurso: tentar Gemini se for PDF/imagem e chave disponível
      const mime: string = asset.mimeType ?? "";
      const isPdf = mime === "application/pdf" || mime.startsWith("image/");
      if (isPdf) {
        const config = await getConfig();
        const geminiKey = [config.chave1, config.chave2, config.chave3, config.chave4]
          .find(k => k?.startsWith("AIza"));
        if (geminiKey) {
          try {
            const base64 = await FS.readAsStringAsync(asset.uri, { encoding: "base64" });
            const r2 = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{ parts: [
                    { inline_data: { mime_type: mime, data: base64 } },
                    { text: "Extraia todo o texto deste documento." },
                  ]}],
                }),
              }
            );
            const json = await r2.json();
            const txt2: string = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
            if (txt2.trim()) {
              setCodigo(txt2);
              setEditorOpen(true);
              Alert.alert("Importado via OCR!", `${asset.name || "arquivo"}`);
              return;
            }
          } catch { /* ignora */ }
        }
      }
      Alert.alert("Não foi possível ler", `${asset.name || "arquivo"}\n${e?.message ?? ""}`);
    } finally {
      setImportando(false);
    }
  }

  // ── Importar ZIP — extrai TODOS os arquivos sem filtro ────────────────
  async function importarZip() {
    let asset: any = null;
    try {
      const r = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (r.canceled || !r.assets?.[0]) return;
      asset = r.assets[0];
    } catch { return; }

    setImportando(true);
    try {
      const JSZip = (await import("jszip")).default;
      const base64 = await FS.readAsStringAsync(asset.uri, { encoding: "base64" });
      const zip = await JSZip.loadAsync(base64, { base64: true });

      const fileNames = Object.keys(zip.files).filter(n => !zip.files[n].dir);
      const batch: { nome: string; codigo: string }[] = [];

      for (const nome of fileNames) {
        try {
          const texto = await zip.files[nome].async("string");
          batch.push({ nome, codigo: texto });
        } catch {
          // arquivo binário: salva como base64 para não perder
          try {
            const b64 = await zip.files[nome].async("base64");
            batch.push({ nome: nome + " [base64]", codigo: b64 });
          } catch { /* ignora */ }
        }
      }

      await savePlaygroundSnippetsBatch(batch);
      await carregarSnippets();
      Alert.alert(
        "ZIP importado!",
        `${batch.length} arquivo(s) de ${fileNames.length} extraído(s) do ZIP.`
      );
    } catch (e: any) {
      Alert.alert("Erro ao importar ZIP", e?.message ?? "Arquivo ZIP inválido ou corrompido.");
    } finally {
      setImportando(false);
    }
  }

  // ── Exportar todos os snippets como ZIP ───────────────────────────────
  async function exportarZip() {
    if (!snippets.length) { Alert.alert("Nenhum snippet para exportar."); return; }
    setImportando(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (const s of snippets) {
        const nome = s.nome.includes(".") ? s.nome : s.nome + ".txt";
        zip.file(nome, s.codigo);
      }
      const base64 = await zip.generateAsync({ type: "base64" });
      const path = `${FS.documentDirectory}snippets_${Date.now()}.zip`;
      await FS.writeAsStringAsync(path, base64, { encoding: "base64" });
      await Sharing.shareAsync(path, { mimeType: "application/zip", dialogTitle: "Exportar ZIP" });
    } catch (e: any) {
      Alert.alert("Erro ao exportar ZIP", e?.message ?? "Tente novamente.");
    } finally {
      setImportando(false);
    }
  }

  // ── Limpar todos os snippets ─────────────────────────────────────────
  function limparTodos() {
    Alert.alert("Limpar tudo?", `${snippets.length} snippet(s) serão excluídos permanentemente.`, [
      { text: "Cancelar" },
      {
        text: "Limpar tudo", style: "destructive", onPress: async () => {
          const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
          await AsyncStorage.removeItem("@aj_playground");
          setSnippets([]);
        },
      },
    ]);
  }

  async function copiarCodigo() {
    if (!codigo) return;
    await Clipboard.setStringAsync(codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function exportarCodigo() {
    if (!codigo) { Alert.alert("Editor vazio."); return; }
    if (Platform.OS === "web") { await Clipboard.setStringAsync(codigo); Alert.alert("Copiado!"); return; }
    try {
      const ext = codigo.trim().toLowerCase().startsWith("<!doctype") ||
        codigo.trim().toLowerCase().startsWith("<html") ? "html" : "txt";
      const path = `${FS.documentDirectory}playground_${Date.now()}.${ext}`;
      await FS.writeAsStringAsync(path, codigo, { encoding: "utf8" });
      await Sharing.shareAsync(path, {
        mimeType: ext === "html" ? "text/html" : "text/plain",
        dialogTitle: "Exportar arquivo",
      });
    } catch (e: any) {
      Alert.alert("Erro ao exportar", e.message);
    }
  }

  async function previewHtml() {
    if (!codigo.trim()) { Alert.alert("Editor vazio."); return; }
    await abrirHtmlNoBrowser(codigo, "Preview");
  }

  async function previewSnippet(s: PlaygroundSnippet) {
    await abrirHtmlNoBrowser(s.codigo, s.nome);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.hamburger} onPress={() => setMenuOpen(true)}>
          <Ionicons name="menu" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Playground</Text>
          <Text style={styles.sub}>Editor · HTML · Snippets</Text>
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={abrirSalvar}>
          <Ionicons name="save-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerBtn} onPress={previewHtml}>
          <Ionicons name="globe-outline" size={20} color={COLORS.info} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">

          {/* ── Seção Editor (colapsável) ─────────────────────────────── */}
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setEditorOpen(v => !v)}
            activeOpacity={0.75}
          >
            <Ionicons name="code-slash-outline" size={16} color={COLORS.accent} />
            <Text style={styles.sectionHeaderText}>Editor de Código</Text>
            <Text style={styles.autosaveLabel}>auto-salvo</Text>
            <Ionicons
              name={editorOpen ? "chevron-up" : "chevron-down"}
              size={16}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>

          {editorOpen && (
            <View style={styles.editorContainer}>
              <TextInput
                style={styles.editor}
                value={codigo}
                onChangeText={setCodigo}
                multiline
                textAlignVertical="top"
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                placeholder={'<!DOCTYPE html>\n<html>\n<body>\n  <h1>Meu HTML</h1>\n</body>\n</html>'}
                placeholderTextColor={COLORS.textDim}
                scrollEnabled={false}
              />
              <Text style={styles.charCount}>{codigo.length} chars</Text>
            </View>
          )}

          {/* ── Botões de Ação ─────────────────────────────────────────── */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, styles.actionPreview]} onPress={previewHtml}>
              <Ionicons name="globe-outline" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Preview</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, styles.actionSave]} onPress={abrirSalvar}>
              <Ionicons name="save-outline" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Salvar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionImport, importando && styles.actionDis]}
              onPress={importarArquivo}
              disabled={importando}
            >
              {importando
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="document-outline" size={16} color="#fff" />
              }
              <Text style={styles.actionBtnText}>Arquivo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionZipIn, importando && styles.actionDis]}
              onPress={importarZip}
              disabled={importando}
            >
              <Ionicons name="archive-outline" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>ZIP ↑</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, styles.actionCopy]} onPress={copiarCodigo}>
              <Ionicons name={copiado ? "checkmark" : "copy-outline"} size={16} color="#fff" />
              <Text style={styles.actionBtnText}>{copiado ? "OK!" : "Copiar"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, styles.actionExport]} onPress={exportarCodigo}>
              <Ionicons name="share-outline" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Exportar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionZipOut, importando && styles.actionDis]}
              onPress={exportarZip}
              disabled={importando}
            >
              <Ionicons name="archive-outline" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>ZIP ↓</Text>
            </TouchableOpacity>
          </View>

          {/* ── Lista de Snippets Salvos ──────────────────────────────── */}
          <View style={styles.snippetsSectionHeader}>
            <Ionicons name="folder-outline" size={15} color={COLORS.accent} />
            <Text style={styles.snippetsSectionTitle}>
              Snippets Salvos ({snippets.length})
            </Text>
            {snippets.length > 0 && (
              <TouchableOpacity onPress={limparTodos} style={styles.clearAllBtn}>
                <Ionicons name="trash-outline" size={13} color={COLORS.danger} />
                <Text style={styles.clearAllText}>Limpar tudo</Text>
              </TouchableOpacity>
            )}
          </View>

          {snippets.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="code-slash-outline" size={36} color={COLORS.textDim} />
              <Text style={styles.emptyText}>Nenhum snippet salvo ainda.</Text>
              <Text style={styles.emptyHint}>
                Escreva ou cole código no editor acima e toque em "Salvar".
              </Text>
            </View>
          ) : (
            snippets.map(s => {
              const expanded = expandedIds.has(s.id);
              return (
                <View key={s.id} style={styles.snippetCard}>
                  {/* Linha do nome */}
                  <TouchableOpacity
                    style={styles.snippetHeaderRow}
                    onPress={() => toggleExpand(s.id)}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="document-text-outline" size={15} color={COLORS.accent} />
                    <Text style={styles.snippetName} numberOfLines={1}>{s.nome}</Text>
                    <Text style={styles.snippetDate}>
                      {new Date(s.data).toLocaleDateString("pt-BR")}
                    </Text>
                    <Ionicons
                      name={expanded ? "chevron-up" : "chevron-down"}
                      size={14}
                      color={COLORS.textMuted}
                    />
                  </TouchableOpacity>

                  {/* Ações do snippet */}
                  <View style={styles.snippetActions}>
                    <TouchableOpacity
                      style={styles.snippetActionBtn}
                      onPress={() => carregarNoEditor(s)}
                    >
                      <Ionicons name="create-outline" size={14} color={COLORS.primary} />
                      <Text style={[styles.snippetActionText, { color: COLORS.primary }]}>Editar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.snippetActionBtn}
                      onPress={() => previewSnippet(s)}
                    >
                      <Ionicons name="globe-outline" size={14} color={COLORS.info} />
                      <Text style={[styles.snippetActionText, { color: COLORS.info }]}>Preview</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.snippetActionBtn}
                      onPress={() => abrirRenomear(s)}
                    >
                      <Ionicons name="pencil-outline" size={14} color={COLORS.textMuted} />
                      <Text style={[styles.snippetActionText, { color: COLORS.textMuted }]}>Renomear</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.snippetActionBtn}
                      onPress={() => deletarSnippet(s.id, s.nome)}
                    >
                      <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
                      <Text style={[styles.snippetActionText, { color: COLORS.danger }]}>Excluir</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Código expandido */}
                  {expanded && (
                    <ScrollView
                      horizontal
                      style={styles.codePreviewScroll}
                      showsHorizontalScrollIndicator
                    >
                      <Text style={styles.codePreview} selectable>
                        {s.codigo.slice(0, 3000)}{s.codigo.length > 3000 ? "\n...[truncado]" : ""}
                      </Text>
                    </ScrollView>
                  )}
                </View>
              );
            })
          )}

          <View style={{ height: insets.bottom + 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Modal: Salvar Snippet ─────────────────────────────────────── */}
      <Modal
        visible={saveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setSaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Salvar Snippet</Text>
            <Text style={styles.modalSub}>
              {codigo.length > 0 ? `${codigo.length} caracteres` : "Editor vazio"}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nome do snippet (ex: Procuração HTML)"
              placeholderTextColor={COLORS.textDim}
              value={saveName}
              onChangeText={setSaveName}
              autoFocus
              onSubmitEditing={confirmarSalvar}
              returnKeyType="done"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setSaveModal(false)}
              >
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtnSave,
                  (!saveName.trim() || !codigo.trim() || saving) && styles.modalBtnDis,
                ]}
                onPress={confirmarSalvar}
                disabled={!saveName.trim() || !codigo.trim() || saving}
              >
                {saving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Ionicons name="save-outline" size={16} color="#fff" />
                }
                <Text style={styles.modalBtnSaveText}>
                  {saving ? "Salvando..." : "Salvar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Renomear Snippet ───────────────────────────────────── */}
      <Modal
        visible={renameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Renomear Snippet</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Novo nome"
              placeholderTextColor={COLORS.textDim}
              value={renameName}
              onChangeText={setRenameName}
              autoFocus
              onSubmitEditing={confirmarRenomear}
              returnKeyType="done"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setRenameModal(false)}
              >
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnSave, !renameName.trim() && styles.modalBtnDis]}
                onPress={confirmarRenomear}
                disabled={!renameName.trim()}
              >
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={styles.modalBtnSaveText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  // ── Header ──────────────────────────────────────────────────────────
  header: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 12, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  },
  hamburger: {
    width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 8,
  },
  title: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  sub: { fontSize: 10, color: COLORS.textMuted },
  headerBtn: {
    width: 36, height: 36, alignItems: "center", justifyContent: "center",
    borderRadius: 8, backgroundColor: COLORS.bgInput,
  },

  // ── Editor seção colapsável ──────────────────────────────────────────
  sectionHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  sectionHeaderText: { flex: 1, fontSize: 13, fontWeight: "700", color: COLORS.text },
  autosaveLabel: {
    fontSize: 10, color: COLORS.textDim,
    paddingHorizontal: 6, paddingVertical: 2,
    backgroundColor: COLORS.bgInput, borderRadius: 4,
  },

  editorContainer: {
    backgroundColor: "#0a140d",
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  editor: {
    color: "#7aff9a",
    fontSize: 13,
    lineHeight: 20,
    padding: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    minHeight: 220,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 10, color: COLORS.textDim,
    textAlign: "right", paddingHorizontal: 12, paddingBottom: 6,
  },

  // ── Botões de Ação ───────────────────────────────────────────────────
  actionRow: {
    flexDirection: "row", flexWrap: "wrap", gap: 8,
    padding: 12, backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, flex: 1, minWidth: 80,
    justifyContent: "center",
  },
  actionBtnText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  actionPreview: { backgroundColor: COLORS.info },
  actionSave: { backgroundColor: COLORS.primary },
  actionImport: { backgroundColor: "#6a4fcf" },
  actionZipIn:  { backgroundColor: "#a0522d" },
  actionZipOut: { backgroundColor: "#5a3a1a" },
  actionCopy: { backgroundColor: "#2a7a4a" },
  actionExport: { backgroundColor: COLORS.textMuted },
  actionDis: { opacity: 0.5 },

  // ── Snippets ─────────────────────────────────────────────────────────
  snippetsSectionHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    marginTop: 8,
  },
  snippetsSectionTitle: { flex: 1, fontSize: 13, fontWeight: "700", color: COLORS.text },
  clearAllBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: `${COLORS.danger}15` },
  clearAllText: { fontSize: 11, color: COLORS.danger, fontWeight: "700" },

  emptyBox: {
    alignItems: "center", padding: 40, gap: 10,
  },
  emptyText: { fontSize: 14, fontWeight: "700", color: COLORS.textMuted },
  emptyHint: { fontSize: 12, color: COLORS.textDim, textAlign: "center" },

  snippetCard: {
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    marginTop: 4, marginHorizontal: 10, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.border, overflow: "hidden",
    marginBottom: 4,
  },
  snippetHeaderRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: 12,
  },
  snippetName: { flex: 1, fontSize: 13, fontWeight: "700", color: COLORS.text },
  snippetDate: { fontSize: 10, color: COLORS.textDim },

  snippetActions: {
    flexDirection: "row", gap: 4,
    paddingHorizontal: 10, paddingBottom: 10, flexWrap: "wrap",
  },
  snippetActionBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 7, backgroundColor: COLORS.bgInput,
    borderWidth: 1, borderColor: COLORS.border,
  },
  snippetActionText: { fontSize: 11, fontWeight: "600" },

  codePreviewScroll: {
    backgroundColor: "#060f08",
    borderTopWidth: 1, borderTopColor: COLORS.border,
    maxHeight: 200,
  },
  codePreview: {
    color: "#5aff7a",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    padding: 12,
    lineHeight: 18,
  },

  // ── Modais ────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center", justifyContent: "center",
    padding: 24,
  },
  modalBox: {
    width: "100%", maxWidth: 380,
    backgroundColor: COLORS.bgCard,
    borderRadius: 18, padding: 24,
    borderWidth: 1, borderColor: COLORS.border,
    gap: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: "800", color: COLORS.text },
  modalSub: { fontSize: 12, color: COLORS.textMuted },
  modalInput: {
    backgroundColor: COLORS.bgInput, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.border,
    color: COLORS.text, fontSize: 14,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  modalBtns: { flexDirection: "row", gap: 10 },
  modalBtnCancel: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.border,
    alignItems: "center",
  },
  modalBtnCancelText: { fontSize: 14, fontWeight: "700", color: COLORS.textMuted },
  modalBtnSave: {
    flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 12, borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  modalBtnSaveText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  modalBtnDis: { opacity: 0.5 },
});
