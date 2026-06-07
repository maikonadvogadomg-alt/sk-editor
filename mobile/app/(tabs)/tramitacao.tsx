import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import SideMenu from "@/components/SideMenu";

const TRAM_TOKEN_KEY = "@tramitacao_token";
const TRAM_CFG_KEY = "@tramitacao_cfg";

interface TramConfig {
  tokenTramitacao: string;
  oabNumero: string;
  oabUf: string;
  webhookUrl: string;
}

const DEFAULT_CFG: TramConfig = {
  tokenTramitacao: "",
  oabNumero: "",
  oabUf: "MG",
  webhookUrl: "",
};

const PORTAIS = [
  { label: "TJMG — Portal de Processos", url: "https://www.tjmg.jus.br/portal-tjmg/processos/", icon: "business-outline", cor: COLORS.primary },
  { label: "CNJ — Painel de Processos", url: "https://painel.cnj.jus.br/", icon: "stats-chart-outline", cor: COLORS.info },
  { label: "PDPJ — Portal Digital", url: "https://pdpj.jus.br/", icon: "laptop-outline", cor: COLORS.purple },
  { label: "Projudi MG", url: "https://projudi.tjmg.jus.br/projudi/", icon: "folder-outline", cor: COLORS.warning },
  { label: "STJ — Consulta Processual", url: "https://processo.stj.jus.br/SCON/", icon: "search-outline", cor: COLORS.info },
  { label: "STF — Consulta Processual", url: "https://portal.stf.jus.br/processos/", icon: "search-outline", cor: COLORS.accent },
  { label: "TRT 3ª Região", url: "https://consulta.trt3.jus.br/consulta/consulta", icon: "people-outline", cor: COLORS.warning },
  { label: "TRF 1ª Região", url: "https://processual.trf1.jus.br/consultaProcessual/processo.php", icon: "search-outline", cor: COLORS.info },
  { label: "TST — Consulta Processual", url: "https://consultaprocessual.tst.jus.br/", icon: "briefcase-outline", cor: COLORS.primary },
];

const UFS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

type Aba = "config" | "portais" | "sobre";

export default function Tramitacao() {
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const [aba, setAba] = useState<Aba>("config");
  const [cfg, setCfg] = useState<TramConfig>(DEFAULT_CFG);
  const [salvando, setSalvando] = useState(false);
  const [testando, setTestando] = useState(false);
  const [statusTeste, setStatusTeste] = useState<"idle" | "ok" | "erro">("idle");
  const [msgTeste, setMsgTeste] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [mostrarToken, setMostrarToken] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(TRAM_CFG_KEY);
      if (raw) setCfg({ ...DEFAULT_CFG, ...JSON.parse(raw) });
    })();
  }, []);

  async function salvar() {
    setSalvando(true);
    await AsyncStorage.setItem(TRAM_CFG_KEY, JSON.stringify(cfg));
    setTimeout(() => setSalvando(false), 1500);
  }

  async function testarToken() {
    if (!cfg.tokenTramitacao.trim()) {
      Alert.alert("Token vazio", "Insira o token do serviço de Tramitação Inteligente.");
      return;
    }
    setTestando(true);
    setStatusTeste("idle");

    try {
      const resp = await fetch("https://pdpj.jus.br/partes-publicas/v1/processos?size=1", {
        headers: {
          Authorization: `Bearer ${cfg.tokenTramitacao.trim()}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(12000),
      });

      if (resp.ok || resp.status === 200) {
        setStatusTeste("ok");
        setMsgTeste(`Token válido — Status ${resp.status}`);
      } else if (resp.status === 401 || resp.status === 403) {
        setStatusTeste("erro");
        setMsgTeste(`Token inválido ou expirado (${resp.status})`);
      } else {
        setStatusTeste("ok");
        setMsgTeste(`Resposta ${resp.status} — Token aceito pelo servidor`);
      }
    } catch (e: any) {
      if (e.name === "TimeoutError") {
        setStatusTeste("erro");
        setMsgTeste("Tempo esgotado — sem resposta do servidor");
      } else {
        setStatusTeste("erro");
        setMsgTeste(e.message || "Erro de conexão");
      }
    }
    setTestando(false);
  }

  async function copiarWebhook() {
    if (!cfg.webhookUrl.trim()) return;
    await Clipboard.setStringAsync(cfg.webhookUrl.trim());
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function limparToken() {
    Alert.alert("Limpar token?", "O token salvo será removido permanentemente.", [
      { text: "Cancelar" },
      {
        text: "Limpar", style: "destructive", onPress: async () => {
          setCfg(c => ({ ...c, tokenTramitacao: "" }));
          setStatusTeste("idle");
          await AsyncStorage.setItem(TRAM_CFG_KEY, JSON.stringify({ ...cfg, tokenTramitacao: "" }));
        }
      }
    ]);
  }

  const tokenSalvo = !!cfg.tokenTramitacao.trim();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.hamburger} onPress={() => setMenuOpen(true)}>
          <Ionicons name="menu" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Tramitação Processual</Text>
          <Text style={styles.sub}>Token · Portais · PDPJ</Text>
        </View>
        {tokenSalvo && (
          <View style={styles.tokenBadge}>
            <Ionicons name="key" size={12} color={COLORS.primary} />
            <Text style={styles.tokenBadgeText}>Token ativo</Text>
          </View>
        )}
      </View>

      {/* Abas */}
      <View style={styles.tabs}>
        {([
          { id: "config" as Aba, label: "Configurar", icon: "settings-outline" as const },
          { id: "portais" as Aba, label: "Portais", icon: "globe-outline" as const },
          { id: "sobre" as Aba, label: "Como usar", icon: "help-circle-outline" as const },
        ]).map(t => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tabBtn, aba === t.id && styles.tabBtnAtivo]}
            onPress={() => setAba(t.id)}
          >
            <Ionicons name={t.icon} size={14} color={aba === t.id ? COLORS.primary : COLORS.textMuted} />
            <Text style={[styles.tabText, aba === t.id && styles.tabTextAtivo]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── ABA CONFIGURAR ──────────────────────────── */}
      {aba === "config" && (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
          {/* Token Tramitação Inteligente */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="key" size={18} color={COLORS.warning} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Token — Tramitação Inteligente</Text>
                <Text style={styles.cardSub}>Chave de acesso ao serviço de monitoramento de processos</Text>
              </View>
              {tokenSalvo && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>ATIVO</Text>
                </View>
              )}
            </View>

            <Text style={styles.fieldLabel}>Token de Acesso</Text>
            <View style={styles.tokenInputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Cole seu token aqui (ex: eyJ... ou chave-api-...)"
                placeholderTextColor={COLORS.textDim}
                value={cfg.tokenTramitacao}
                onChangeText={v => setCfg(c => ({ ...c, tokenTramitacao: v }))}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!mostrarToken}
                multiline={mostrarToken}
              />
              <TouchableOpacity
                style={styles.olhoBtn}
                onPress={() => setMostrarToken(v => !v)}
              >
                <Ionicons
                  name={mostrarToken ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.btnSalvar} onPress={salvar} disabled={salvando}>
                <Ionicons name={salvando ? "checkmark" : "save-outline"} size={15} color="#fff" />
                <Text style={styles.btnSalvarText}>{salvando ? "Salvo!" : "Salvar"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnTestar} onPress={testarToken} disabled={testando}>
                {testando
                  ? <ActivityIndicator size="small" color={COLORS.info} />
                  : <Ionicons name="wifi-outline" size={15} color={COLORS.info} />}
                <Text style={styles.btnTestarText}>Testar</Text>
              </TouchableOpacity>
              {tokenSalvo && (
                <TouchableOpacity style={styles.btnLimpar} onPress={limparToken}>
                  <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                </TouchableOpacity>
              )}
            </View>

            {statusTeste !== "idle" && (
              <View style={[styles.statusBox, statusTeste === "ok" ? styles.statusOk : styles.statusErro]}>
                <Ionicons
                  name={statusTeste === "ok" ? "checkmark-circle" : "close-circle"}
                  size={16}
                  color={statusTeste === "ok" ? COLORS.primary : COLORS.danger}
                />
                <Text style={[styles.statusText, { color: statusTeste === "ok" ? COLORS.primary : COLORS.danger }]}>
                  {msgTeste}
                </Text>
              </View>
            )}
          </View>

          {/* Dados do Advogado */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="person" size={18} color={COLORS.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Dados do Advogado</Text>
                <Text style={styles.cardSub}>OAB para consultas e monitoramento automático</Text>
              </View>
            </View>

            <Text style={styles.fieldLabel}>Número OAB</Text>
            <TextInput
              style={styles.input}
              placeholder="183712"
              placeholderTextColor={COLORS.textDim}
              value={cfg.oabNumero}
              onChangeText={v => setCfg(c => ({ ...c, oabNumero: v.replace(/\D/g, "") }))}
              keyboardType="numeric"
            />

            <Text style={styles.fieldLabel}>UF da OAB</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {UFS.map(uf => (
                  <TouchableOpacity
                    key={uf}
                    style={[styles.chip, cfg.oabUf === uf && styles.chipAtivo]}
                    onPress={() => setCfg(c => ({ ...c, oabUf: uf }))}
                  >
                    <Text style={[styles.chipText, cfg.oabUf === uf && styles.chipTextAtivo]}>{uf}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity style={[styles.btnSalvar, { marginTop: 16 }]} onPress={salvar} disabled={salvando}>
              <Ionicons name={salvando ? "checkmark" : "save-outline"} size={15} color="#fff" />
              <Text style={styles.btnSalvarText}>{salvando ? "Salvo!" : "Salvar Dados"}</Text>
            </TouchableOpacity>
          </View>

          {/* Webhook */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="git-branch" size={18} color={COLORS.info} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Webhook de Recebimento</Text>
                <Text style={styles.cardSub}>URL para onde o serviço envia publicações automaticamente</Text>
              </View>
            </View>

            <Text style={styles.fieldLabel}>URL do Webhook</Text>
            <View style={styles.tokenInputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="https://minha-api.com/webhook/tramitacao"
                placeholderTextColor={COLORS.textDim}
                value={cfg.webhookUrl}
                onChangeText={v => setCfg(c => ({ ...c, webhookUrl: v }))}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {cfg.webhookUrl.trim() ? (
                <TouchableOpacity style={styles.olhoBtn} onPress={copiarWebhook}>
                  <Ionicons name={copiado ? "checkmark" : "copy-outline"} size={20} color={copiado ? COLORS.primary : COLORS.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>
            <Text style={styles.webhookHint}>
              Se você usa um serviço de tramitação, registre este endpoint lá para receber notificações de movimentações.
            </Text>
            <TouchableOpacity style={[styles.btnSalvar, { marginTop: 12 }]} onPress={salvar} disabled={salvando}>
              <Ionicons name={salvando ? "checkmark" : "save-outline"} size={15} color="#fff" />
              <Text style={styles.btnSalvarText}>{salvando ? "Salvo!" : "Salvar Webhook"}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* ── ABA PORTAIS ──────────────────────────────── */}
      {aba === "portais" && (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.info} />
            <Text style={styles.infoText}>
              Acesso direto aos portais de consulta e tramitação do Poder Judiciário. Toque para abrir no navegador.
              {cfg.oabNumero ? `\n\nOAB configurada: ${cfg.oabNumero}/${cfg.oabUf}` : ""}
            </Text>
          </View>
          {PORTAIS.map(p => (
            <TouchableOpacity key={p.url} style={styles.portalCard} onPress={() => Linking.openURL(p.url)}>
              <View style={[styles.portalIcon, { backgroundColor: p.cor + "22" }]}>
                <Ionicons name={p.icon as any} size={22} color={p.cor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.portalLabel}>{p.label}</Text>
                <Text style={styles.portalUrl} numberOfLines={1}>{p.url}</Text>
              </View>
              <Ionicons name="open-outline" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ── ABA COMO USAR ────────────────────────────── */}
      {aba === "sobre" && (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.sobreCard}>
            <Ionicons name="key" size={28} color={COLORS.warning} />
            <Text style={styles.sobreTitulo}>Token de Tramitação Inteligente</Text>
            <Text style={styles.sobreTexto}>
              O token é fornecido pelo serviço de tramitação contratado (ex: Tramitação Inteligente, JusMonitor, etc.). Ele é usado para autenticar consultas automáticas e receber publicações via webhook.
            </Text>
          </View>

          <View style={styles.sobreCard}>
            <Ionicons name="git-network" size={28} color={COLORS.info} />
            <Text style={styles.sobreTitulo}>Como configurar o Webhook</Text>
            <Text style={styles.sobreTexto}>
              1. No serviço de tramitação, vá em "Notificações" ou "Webhooks"{"\n"}
              2. Adicione a URL do seu webhook (pode ser um servidor seu ou serviço como n8n, Make, Zapier){"\n"}
              3. Cole a URL no campo "Webhook de Recebimento" e salve{"\n"}
              4. O serviço enviará publicações automaticamente para essa URL
            </Text>
          </View>

          <View style={styles.sobreCard}>
            <Ionicons name="search" size={28} color={COLORS.primary} />
            <Text style={styles.sobreTitulo}>Busca de Intimações CNJ</Text>
            <Text style={styles.sobreTexto}>
              Use a aba "Comunicações" → "Buscar CNJ" para pesquisar intimações e citações diretamente na API oficial do CNJ (comunicaapi.pje.jus.br) usando seu número de OAB sem precisar de login.
            </Text>
          </View>

          <View style={styles.sobreCard}>
            <Ionicons name="laptop" size={28} color={COLORS.purple} />
            <Text style={styles.sobreTitulo}>PDPJ — Portal Digital</Text>
            <Text style={styles.sobreTexto}>
              Para acessar o Portal Digital do Poder Judiciário (PDPJ), configure seu token JWT na aba "PDPJ" do menu lateral. O token pode ser gerado em pdpj.jus.br com seu certificado digital.
            </Text>
          </View>

          <TouchableOpacity style={styles.pdpjBtn} onPress={() => Linking.openURL("https://pdpj.jus.br/")}>
            <Ionicons name="open-outline" size={16} color={COLORS.purple} />
            <Text style={styles.pdpjBtnText}>Acessar PDPJ</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

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
  tokenBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#0d2218", borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.primary + "50" },
  tokenBadgeText: { fontSize: 11, color: COLORS.primary, fontWeight: "700" },

  tabs: { flexDirection: "row", backgroundColor: COLORS.bgCard, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabBtnAtivo: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted },
  tabTextAtivo: { color: COLORS.primary },

  content: { padding: 16, gap: 14 },
  card: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  cardHeaderRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 },
  cardTitle: { fontSize: 14, fontWeight: "800", color: COLORS.text },
  cardSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2, lineHeight: 16 },
  activeBadge: { backgroundColor: COLORS.primary + "22", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: COLORS.primary + "50" },
  activeBadgeText: { fontSize: 10, fontWeight: "800", color: COLORS.primary },

  fieldLabel: { fontSize: 11, fontWeight: "700", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 8, marginBottom: 6 },
  input: { backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 13 },
  tokenInputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  olhoBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bgInput, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  webhookHint: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18, marginTop: 8 },

  btnRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  btnSalvar: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: COLORS.primary, borderRadius: 10, padding: 12 },
  btnSalvarText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  btnTestar: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#1e2a3a", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: COLORS.info },
  btnTestarText: { color: COLORS.info, fontWeight: "700", fontSize: 13 },
  btnLimpar: { width: 44, alignItems: "center", justifyContent: "center", backgroundColor: "#2a1a1a", borderRadius: 10, borderWidth: 1, borderColor: COLORS.danger },

  statusBox: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, padding: 10, borderRadius: 8 },
  statusOk: { backgroundColor: "#0f2d1f" },
  statusErro: { backgroundColor: "#2a1010" },
  statusText: { fontSize: 13, fontWeight: "600", flex: 1 },

  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgInput, marginTop: 4 },
  chipAtivo: { borderColor: COLORS.primary, backgroundColor: "#0d2218" },
  chipText: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600" },
  chipTextAtivo: { color: COLORS.primary },

  infoBox: { flexDirection: "row", gap: 10, backgroundColor: "#111e2a", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#1e3050" },
  infoText: { flex: 1, fontSize: 13, color: COLORS.textMuted, lineHeight: 19 },

  portalCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  portalIcon: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  portalLabel: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  portalUrl: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  sobreCard: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: COLORS.border, alignItems: "flex-start", gap: 10 },
  sobreTitulo: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  sobreTexto: { fontSize: 13, color: COLORS.textMuted, lineHeight: 21 },

  pdpjBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#1a1030", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.purple + "60", justifyContent: "center" },
  pdpjBtnText: { fontSize: 14, fontWeight: "700", color: COLORS.purple },
});
