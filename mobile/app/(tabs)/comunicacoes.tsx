import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, FlatList,
  StyleSheet, Alert, ActivityIndicator, Linking, Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import SideMenu from "@/components/SideMenu";

const COMM_KEY = "@aj_comunicacoes";
const COMM_CFG_KEY = "@aj_comunicacoes_cfg";
const CNJ_CFG_KEY = "@aj_cnj_cfg";

interface Comunicacao {
  id: string;
  titulo: string;
  conteudo: string;
  origem: string;
  data: number;
  lida: boolean;
  link?: string;
}

interface CommConfig {
  telegramToken: string;
  telegramChatId: string;
  webhookUrl: string;
  numeroProcesso: string;
  tribunal: string;
  notifAtiva: boolean;
}

interface CnjConfig {
  numeroOab: string;
  ufOab: string;
  nomeAdvogado: string;
  nomeParte: string;
  numeroProcesso: string;
  dataInicio: string;
  dataFim: string;
}

interface CnjIntimacao {
  id: string;
  tipoDocumento?: string;
  nomeOrgao?: string;
  textoIntimacao?: string;
  dataDisponibilizacao?: string;
  numeroProcesso?: string;
  nomeAdvogado?: string;
  nomeParte?: string;
  link?: string;
}

const DEFAULT_CFG: CommConfig = {
  telegramToken: "",
  telegramChatId: "",
  webhookUrl: "",
  numeroProcesso: "",
  tribunal: "TJMG",
  notifAtiva: false,
};

const DEFAULT_CNJ: CnjConfig = {
  numeroOab: "",
  ufOab: "MG",
  nomeAdvogado: "",
  nomeParte: "",
  numeroProcesso: "",
  dataInicio: "",
  dataFim: "",
};

const TRIBUNAIS = ["TJMG", "STJ", "STF", "TRT3", "CNJ", "TRF1", "TRF3", "PROJUDI"];
const UFS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

const PORTAIS_CONSULTA = [
  { nome: "DJe TJMG", url: "https://www4.tjmg.jus.br/juridico/sf/publPesquisaProcesso.faces", icon: "business-outline" },
  { nome: "DJe STJ", url: "https://processo.stj.jus.br/SCON/", icon: "search-outline" },
  { nome: "DJe STF", url: "https://portal.stf.jus.br/processos/", icon: "search-outline" },
  { nome: "CNJ — PJe", url: "https://pje.cloud.cnj.jus.br/", icon: "cloud-outline" },
  { nome: "TRT 3ª DJe", url: "https://consulta.trt3.jus.br/consulta/consulta", icon: "people-outline" },
  { nome: "Projudi TJMG", url: "https://projudi.tjmg.jus.br/projudi/", icon: "folder-outline" },
];

type Aba = "msgs" | "cnj" | "config" | "portais";

export default function Comunicacoes() {
  const insets = useSafeAreaInsets();
  const [aba, setAba] = useState<Aba>("msgs");
  const [msgs, setMsgs] = useState<Comunicacao[]>([]);
  const [cfg, setCfg] = useState<CommConfig>(DEFAULT_CFG);
  const [cnjCfg, setCnjCfg] = useState<CnjConfig>(DEFAULT_CNJ);
  const [cnjResultados, setCnjResultados] = useState<CnjIntimacao[]>([]);
  const [cnjBuscando, setCnjBuscando] = useState(false);
  const [cnjExpandida, setCnjExpandida] = useState<string | null>(null);
  const [cnjTotal, setCnjTotal] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [novaMsg, setNovaMsg] = useState("");
  const [copiado, setCopiado] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandida, setExpandida] = useState<string | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const rawMsgs = await AsyncStorage.getItem(COMM_KEY);
      const rawCfg = await AsyncStorage.getItem(COMM_CFG_KEY);
      const rawCnj = await AsyncStorage.getItem(CNJ_CFG_KEY);
      if (rawMsgs) setMsgs(JSON.parse(rawMsgs));
      if (rawCfg) setCfg({ ...DEFAULT_CFG, ...JSON.parse(rawCfg) });
      if (rawCnj) setCnjCfg({ ...DEFAULT_CNJ, ...JSON.parse(rawCnj) });
    } catch {}
  }

  async function salvarConfig() {
    setSalvando(true);
    await AsyncStorage.setItem(COMM_CFG_KEY, JSON.stringify(cfg));
    setTimeout(() => setSalvando(false), 1500);
  }

  async function buscarTelegram() {
    if (!cfg.telegramToken.trim()) {
      Alert.alert("Token vazio", "Configure seu token do Telegram primeiro na aba Configurar.");
      return;
    }
    setCarregando(true);
    try {
      const url = `https://api.telegram.org/bot${cfg.telegramToken}/getUpdates?limit=20`;
      const resp = await fetch(url);
      const data = await resp.json();

      if (!data.ok) {
        Alert.alert("Erro Telegram", data.description || "Token inválido.");
        setCarregando(false);
        return;
      }

      const novas: Comunicacao[] = [];
      for (const upd of (data.result || [])) {
        const msg = upd.message || upd.channel_post;
        if (!msg) continue;
        const chatId = String(msg.chat?.id || "");
        if (cfg.telegramChatId && chatId !== cfg.telegramChatId) continue;
        novas.push({
          id: String(upd.update_id),
          titulo: msg.from?.first_name || msg.chat?.title || "Mensagem",
          conteudo: msg.text || "[Mídia]",
          origem: `Telegram · ${chatId}`,
          data: (msg.date || Date.now() / 1000) * 1000,
          lida: false,
        });
      }

      if (novas.length === 0) {
        Alert.alert("Nenhuma mensagem", "Não há novas mensagens no bot.");
        setCarregando(false);
        return;
      }

      const existingIds = new Set(msgs.map(m => m.id));
      const novasUnicas = novas.filter(n => !existingIds.has(n.id));
      const updated = [...novasUnicas, ...msgs].slice(0, 200);
      setMsgs(updated);
      await AsyncStorage.setItem(COMM_KEY, JSON.stringify(updated));
      Alert.alert("Sincronizado", `${novasUnicas.length} nova(s) mensagem(ns) recebida(s).`);
    } catch (e: any) {
      Alert.alert("Erro", e.message || "Não foi possível buscar mensagens.");
    }
    setCarregando(false);
  }

  async function buscarCNJ() {
    const { numeroOab, ufOab, nomeAdvogado, nomeParte, numeroProcesso, dataInicio, dataFim } = cnjCfg;
    if (!numeroOab.trim() && !nomeAdvogado.trim() && !nomeParte.trim() && !numeroProcesso.trim()) {
      Alert.alert("Filtro obrigatório", "Informe pelo menos o número da OAB, nome do advogado, nome da parte ou número do processo.");
      return;
    }

    await AsyncStorage.setItem(CNJ_CFG_KEY, JSON.stringify(cnjCfg));
    setCnjBuscando(true);
    setCnjResultados([]);
    setCnjTotal(0);

    try {
      const params = new URLSearchParams();
      if (numeroOab.trim()) params.set("numeroOab", numeroOab.trim());
      if (ufOab.trim()) params.set("ufOab", ufOab.trim());
      if (nomeAdvogado.trim()) params.set("nomeAdvogado", nomeAdvogado.trim());
      if (nomeParte.trim()) params.set("nomeParte", nomeParte.trim());
      if (numeroProcesso.trim()) params.set("numeroProcesso", numeroProcesso.trim());
      if (dataInicio.trim()) params.set("dataDisponibilizacaoInicio", dataInicio.trim());
      if (dataFim.trim()) params.set("dataDisponibilizacaoFim", dataFim.trim());
      params.set("size", "30");
      params.set("page", "0");

      const resp = await fetch(
        `https://comunicaapi.pje.jus.br/api/v1/comunicacao?${params.toString()}`,
        {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(20000),
        }
      );

      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        Alert.alert("Erro CNJ", `Status ${resp.status}${txt ? ": " + txt.slice(0, 200) : ""}`);
        setCnjBuscando(false);
        return;
      }

      const json = await resp.json();
      const items: CnjIntimacao[] = (json.content || json.items || json.data || json || []).map((item: any, idx: number) => ({
        id: String(item.id || item.idComunicacao || idx),
        tipoDocumento: item.tipoDocumento || item.tipo || "",
        nomeOrgao: item.nomeOrgao || item.tribunal || item.orgao || "",
        textoIntimacao: item.textoIntimacao || item.texto || item.conteudo || "",
        dataDisponibilizacao: item.dataDisponibilizacao || item.data || "",
        numeroProcesso: item.numeroProcesso || item.processo || "",
        nomeAdvogado: item.nomeAdvogado || item.advogado || "",
        nomeParte: item.nomeParte || item.parte || "",
        link: item.link || item.url || "",
      }));

      setCnjTotal(json.totalElements || json.total || items.length);
      setCnjResultados(items);
      if (items.length === 0) {
        Alert.alert("Sem resultados", "Nenhuma comunicação encontrada com os filtros informados.");
      }
    } catch (e: any) {
      if (e.name === "TimeoutError") {
        Alert.alert("Tempo esgotado", "A API do CNJ demorou muito para responder. Tente novamente.");
      } else {
        Alert.alert("Erro de conexão", e.message || "Não foi possível acessar a API do CNJ.");
      }
    }
    setCnjBuscando(false);
  }

  function salvarCnjComoMsg(item: CnjIntimacao) {
    const texto = [
      item.tipoDocumento && `Tipo: ${item.tipoDocumento}`,
      item.nomeOrgao && `Órgão: ${item.nomeOrgao}`,
      item.numeroProcesso && `Processo: ${item.numeroProcesso}`,
      item.dataDisponibilizacao && `Data: ${item.dataDisponibilizacao}`,
      item.nomeAdvogado && `Advogado: ${item.nomeAdvogado}`,
      item.nomeParte && `Parte: ${item.nomeParte}`,
      item.textoIntimacao && `\n${item.textoIntimacao}`,
    ].filter(Boolean).join("\n");

    const comm: Comunicacao = {
      id: `cnj_${item.id}_${Date.now()}`,
      titulo: item.tipoDocumento || "Comunicação CNJ",
      conteudo: texto,
      origem: `CNJ · ${item.nomeOrgao || "PJe"}`,
      data: Date.now(),
      lida: false,
      link: item.link,
    };
    const updated = [comm, ...msgs].slice(0, 200);
    setMsgs(updated);
    AsyncStorage.setItem(COMM_KEY, JSON.stringify(updated));
    Alert.alert("Salvo!", "Comunicação salva na aba Mensagens.");
  }

  async function adicionarManual() {
    if (!novaMsg.trim()) return;
    const comm: Comunicacao = {
      id: Date.now().toString(),
      titulo: "Comunicação Manual",
      conteudo: novaMsg.trim(),
      origem: "Manual",
      data: Date.now(),
      lida: false,
    };
    const updated = [comm, ...msgs].slice(0, 200);
    setMsgs(updated);
    await AsyncStorage.setItem(COMM_KEY, JSON.stringify(updated));
    setNovaMsg("");
  }

  async function marcarLida(id: string) {
    const updated = msgs.map(m => m.id === id ? { ...m, lida: true } : m);
    setMsgs(updated);
    await AsyncStorage.setItem(COMM_KEY, JSON.stringify(updated));
  }

  async function deletarMsg(id: string) {
    const updated = msgs.filter(m => m.id !== id);
    setMsgs(updated);
    await AsyncStorage.setItem(COMM_KEY, JSON.stringify(updated));
  }

  async function limparTodas() {
    Alert.alert("Limpar tudo?", "Todas as comunicações serão removidas.", [
      { text: "Cancelar" },
      {
        text: "Limpar", style: "destructive", onPress: async () => {
          setMsgs([]);
          await AsyncStorage.removeItem(COMM_KEY);
        }
      }
    ]);
  }

  async function copiarTexto(texto: string, id: string) {
    await Clipboard.setStringAsync(texto);
    setCopiado(id);
    setTimeout(() => setCopiado(null), 2000);
  }

  const naoLidas = msgs.filter(m => !m.lida).length;

  const ABAS = [
    { id: "msgs" as Aba, label: "Inbox", icon: "mail-outline" as const },
    { id: "cnj" as Aba, label: "Buscar CNJ", icon: "search-circle-outline" as const },
    { id: "config" as Aba, label: "Configurar", icon: "settings-outline" as const },
    { id: "portais" as Aba, label: "Portais", icon: "globe-outline" as const },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.hamburger} onPress={() => setMenuOpen(true)}>
          <Ionicons name="menu" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Comunicações</Text>
          <Text style={styles.sub}>Inbox · CNJ PJe · Telegram · Portais</Text>
        </View>
        {naoLidas > 0 && (
          <View style={styles.badgeNaoLida}>
            <Text style={styles.badgeNaoLidaText}>{naoLidas}</Text>
          </View>
        )}
        {aba === "msgs" && (
          <TouchableOpacity style={styles.iconBtn} onPress={buscarTelegram} disabled={carregando}>
            {carregando
              ? <ActivityIndicator size="small" color={COLORS.primary} />
              : <Ionicons name="refresh-outline" size={20} color={COLORS.primary} />
            }
          </TouchableOpacity>
        )}
      </View>

      {/* Abas */}
      <View style={styles.tabs}>
        {ABAS.map(t => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tabBtn, aba === t.id && styles.tabBtnAtivo]}
            onPress={() => setAba(t.id)}
          >
            <Ionicons name={t.icon} size={13} color={aba === t.id ? COLORS.primary : COLORS.textMuted} />
            <Text style={[styles.tabText, aba === t.id && styles.tabTextAtivo]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── ABA MENSAGENS ──────────────────────────────── */}
      {aba === "msgs" && (
        <View style={{ flex: 1 }}>
          <View style={styles.addBar}>
            <TextInput
              style={styles.addInput}
              placeholder="Cole uma comunicação, link ou texto jurídico..."
              placeholderTextColor={COLORS.textDim}
              value={novaMsg}
              onChangeText={setNovaMsg}
              multiline
            />
            <TouchableOpacity
              style={[styles.addBtn, !novaMsg.trim() && styles.addBtnDis]}
              onPress={adicionarManual}
              disabled={!novaMsg.trim()}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {msgs.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="mail-open-outline" size={48} color={COLORS.textDim} />
              <Text style={styles.emptyTitle}>Nenhuma comunicação</Text>
              <Text style={styles.emptyDesc}>
                Busque intimações diretamente na API do CNJ pelo seu número de OAB, ou configure o bot do Telegram.
              </Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setAba("cnj")}>
                <Ionicons name="search-circle-outline" size={15} color={COLORS.primary} />
                <Text style={styles.emptyBtnText}>Buscar no CNJ</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={msgs}
              keyExtractor={m => m.id}
              contentContainerStyle={{ padding: 12, gap: 8, paddingBottom: insets.bottom + 20 }}
              ListHeaderComponent={
                <TouchableOpacity style={styles.limparBtn} onPress={limparTodas}>
                  <Ionicons name="trash-outline" size={13} color={COLORS.textMuted} />
                  <Text style={styles.limparBtnText}>Limpar tudo ({msgs.length})</Text>
                </TouchableOpacity>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.msgCard, !item.lida && styles.msgCardNaoLida]}
                  onPress={() => { setExpandida(expandida === item.id ? null : item.id); marcarLida(item.id); }}
                  activeOpacity={0.8}
                >
                  <View style={styles.msgHeader}>
                    <View style={styles.msgOrigem}>
                      <Ionicons
                        name={item.origem.includes("Telegram") ? "paper-plane-outline" : item.origem.includes("CNJ") ? "shield-checkmark-outline" : "document-text-outline"}
                        size={13}
                        color={COLORS.primary}
                      />
                      <Text style={styles.msgOrigemText}>{item.origem}</Text>
                    </View>
                    <Text style={styles.msgData}>{new Date(item.data).toLocaleDateString("pt-BR")}</Text>
                    {!item.lida && <View style={styles.dotNaoLida} />}
                  </View>

                  <Text style={styles.msgTitulo}>{item.titulo}</Text>
                  <Text style={styles.msgConteudo} numberOfLines={expandida === item.id ? undefined : 2}>
                    {item.conteudo}
                  </Text>

                  {expandida === item.id && (
                    <View style={styles.msgActions}>
                      <TouchableOpacity style={styles.msgActBtn} onPress={() => copiarTexto(item.conteudo, item.id)}>
                        <Ionicons name={copiado === item.id ? "checkmark" : "copy-outline"} size={15} color={copiado === item.id ? COLORS.primary : COLORS.textMuted} />
                        <Text style={styles.msgActText}>Copiar</Text>
                      </TouchableOpacity>
                      {item.link ? (
                        <TouchableOpacity style={styles.msgActBtn} onPress={() => Linking.openURL(item.link!)}>
                          <Ionicons name="open-outline" size={15} color={COLORS.info} />
                          <Text style={[styles.msgActText, { color: COLORS.info }]}>Abrir link</Text>
                        </TouchableOpacity>
                      ) : null}
                      <TouchableOpacity style={styles.msgActBtn} onPress={() => deletarMsg(item.id)}>
                        <Ionicons name="trash-outline" size={15} color={COLORS.danger} />
                        <Text style={[styles.msgActText, { color: COLORS.danger }]}>Excluir</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}

      {/* ── ABA BUSCAR CNJ ─────────────────────────────── */}
      {aba === "cnj" && (
        <ScrollView contentContainerStyle={[styles.cnjContent, { paddingBottom: insets.bottom + 24 }]}>
          {/* Banner informativo */}
          <View style={styles.cnjBanner}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cnjBannerTitle}>API Oficial CNJ — Intimações PJe</Text>
              <Text style={styles.cnjBannerSub}>comunicaapi.pje.jus.br · Busca direta sem login</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Dados do Advogado</Text>

            <Text style={styles.fieldLabel}>Número OAB</Text>
            <TextInput
              style={styles.input}
              placeholder="183712"
              placeholderTextColor={COLORS.textDim}
              value={cnjCfg.numeroOab}
              onChangeText={v => setCnjCfg(c => ({ ...c, numeroOab: v.replace(/\D/g, "") }))}
              keyboardType="numeric"
            />

            <Text style={styles.fieldLabel}>UF da OAB</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {UFS.map(uf => (
                  <TouchableOpacity
                    key={uf}
                    style={[styles.chip, cnjCfg.ufOab === uf && styles.chipAtivo]}
                    onPress={() => setCnjCfg(c => ({ ...c, ufOab: uf }))}
                  >
                    <Text style={[styles.chipText, cnjCfg.ufOab === uf && styles.chipTextAtivo]}>{uf}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.fieldLabel}>Nome do Advogado (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Maikon da Rocha Caldeira"
              placeholderTextColor={COLORS.textDim}
              value={cnjCfg.nomeAdvogado}
              onChangeText={v => setCnjCfg(c => ({ ...c, nomeAdvogado: v }))}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Filtros Adicionais</Text>

            <Text style={styles.fieldLabel}>Nome da Parte (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome do cliente / réu..."
              placeholderTextColor={COLORS.textDim}
              value={cnjCfg.nomeParte}
              onChangeText={v => setCnjCfg(c => ({ ...c, nomeParte: v }))}
              autoCapitalize="words"
            />

            <Text style={styles.fieldLabel}>Número do Processo (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="0000000-00.0000.0.00.0000"
              placeholderTextColor={COLORS.textDim}
              value={cnjCfg.numeroProcesso}
              onChangeText={v => setCnjCfg(c => ({ ...c, numeroProcesso: v }))}
              keyboardType="numeric"
            />

            <Text style={styles.fieldLabel}>Data de Início (AAAA-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="2024-01-01"
              placeholderTextColor={COLORS.textDim}
              value={cnjCfg.dataInicio}
              onChangeText={v => setCnjCfg(c => ({ ...c, dataInicio: v }))}
              keyboardType="numbers-and-punctuation"
            />

            <Text style={styles.fieldLabel}>Data de Fim (AAAA-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="2024-12-31"
              placeholderTextColor={COLORS.textDim}
              value={cnjCfg.dataFim}
              onChangeText={v => setCnjCfg(c => ({ ...c, dataFim: v }))}
              keyboardType="numbers-and-punctuation"
            />
          </View>

          <TouchableOpacity
            style={[styles.buscarBtn, cnjBuscando && { opacity: 0.7 }]}
            onPress={buscarCNJ}
            disabled={cnjBuscando}
          >
            {cnjBuscando
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="search" size={18} color="#fff" />
            }
            <Text style={styles.buscarBtnText}>
              {cnjBuscando ? "Buscando na API CNJ..." : "Buscar Intimações / Citações"}
            </Text>
          </TouchableOpacity>

          {cnjResultados.length > 0 && (
            <View style={{ gap: 8 }}>
              <View style={styles.cnjResultHeader}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                <Text style={styles.cnjResultHeaderText}>
                  {cnjResultados.length} resultado(s) {cnjTotal > cnjResultados.length ? `de ${cnjTotal}` : ""}
                </Text>
              </View>
              {cnjResultados.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.cnjCard}
                  onPress={() => setCnjExpandida(cnjExpandida === item.id ? null : item.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.cnjCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cnjTipo}>{item.tipoDocumento || "Comunicação"}</Text>
                      {item.nomeOrgao ? <Text style={styles.cnjOrgao}>{item.nomeOrgao}</Text> : null}
                    </View>
                    {item.dataDisponibilizacao ? (
                      <Text style={styles.cnjData}>
                        {item.dataDisponibilizacao.split("T")[0].split("-").reverse().join("/")}
                      </Text>
                    ) : null}
                    <Ionicons
                      name={cnjExpandida === item.id ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={COLORS.textMuted}
                    />
                  </View>

                  {item.numeroProcesso ? (
                    <Text style={styles.cnjProcesso}>Proc.: {item.numeroProcesso}</Text>
                  ) : null}

                  {cnjExpandida === item.id && (
                    <View style={styles.cnjExpanded}>
                      {item.nomeParte ? (
                        <Text style={styles.cnjDetalhe}><Text style={{ fontWeight: "700", color: COLORS.text }}>Parte: </Text>{item.nomeParte}</Text>
                      ) : null}
                      {item.nomeAdvogado ? (
                        <Text style={styles.cnjDetalhe}><Text style={{ fontWeight: "700", color: COLORS.text }}>Advogado: </Text>{item.nomeAdvogado}</Text>
                      ) : null}
                      {item.textoIntimacao ? (
                        <Text style={styles.cnjTexto}>{item.textoIntimacao}</Text>
                      ) : null}

                      <View style={styles.cnjActions}>
                        <TouchableOpacity
                          style={styles.cnjActBtn}
                          onPress={() => copiarTexto(item.textoIntimacao || item.tipoDocumento || "", item.id)}
                        >
                          <Ionicons name={copiado === item.id ? "checkmark" : "copy-outline"} size={14} color={copiado === item.id ? COLORS.primary : COLORS.textMuted} />
                          <Text style={styles.cnjActText}>Copiar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cnjActBtn} onPress={() => salvarCnjComoMsg(item)}>
                          <Ionicons name="bookmark-outline" size={14} color={COLORS.warning} />
                          <Text style={[styles.cnjActText, { color: COLORS.warning }]}>Salvar no Inbox</Text>
                        </TouchableOpacity>
                        {item.link ? (
                          <TouchableOpacity style={styles.cnjActBtn} onPress={() => Linking.openURL(item.link!)}>
                            <Ionicons name="open-outline" size={14} color={COLORS.info} />
                            <Text style={[styles.cnjActText, { color: COLORS.info }]}>Abrir</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {cnjResultados.length === 0 && !cnjBuscando && (
            <View style={styles.cnjDica}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.info} />
              <Text style={styles.cnjDicaText}>
                Preencha pelo menos um filtro. O número da OAB com UF retorna todas as suas intimações e citações registradas no PJe do CNJ. Os filtros são salvos automaticamente.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* ── ABA CONFIGURAR ─────────────────────────────── */}
      {aba === "config" && (
        <ScrollView contentContainerStyle={[styles.configContent, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              <Ionicons name="paper-plane" size={15} color={COLORS.primary} /> Bot Telegram
            </Text>
            <Text style={styles.cardHint}>
              Crie um bot em t.me/BotFather e cole o token abaixo. Ideal para receber notificações de processos.
            </Text>
            <Text style={styles.fieldLabel}>Token do Bot</Text>
            <TextInput
              style={styles.input}
              placeholder="123456789:ABCdefGHI..."
              placeholderTextColor={COLORS.textDim}
              value={cfg.telegramToken}
              onChangeText={v => setCfg(c => ({ ...c, telegramToken: v }))}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.fieldLabel}>Chat ID (opcional — filtra por chat)</Text>
            <TextInput
              style={styles.input}
              placeholder="-100123456789"
              placeholderTextColor={COLORS.textDim}
              value={cfg.telegramChatId}
              onChangeText={v => setCfg(c => ({ ...c, telegramChatId: v }))}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.testarBtn} onPress={buscarTelegram} disabled={carregando}>
              {carregando
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="refresh" size={15} color="#fff" />}
              <Text style={styles.testarBtnText}>Buscar Mensagens Agora</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkBtn} onPress={() => Linking.openURL("https://t.me/BotFather")}>
              <Ionicons name="open-outline" size={14} color={COLORS.info} />
              <Text style={styles.linkBtnText}>Criar bot no BotFather</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              <Ionicons name="git-branch" size={15} color={COLORS.warning} /> Monitorar Processo
            </Text>
            <Text style={styles.cardHint}>Número do processo para acompanhar. Clique nos portais para consultar manualmente.</Text>
            <Text style={styles.fieldLabel}>Número do Processo</Text>
            <TextInput
              style={styles.input}
              placeholder="0000000-00.0000.0.00.0000"
              placeholderTextColor={COLORS.textDim}
              value={cfg.numeroProcesso}
              onChangeText={v => setCfg(c => ({ ...c, numeroProcesso: v }))}
              keyboardType="numeric"
            />
            <Text style={styles.fieldLabel}>Tribunal</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {TRIBUNAIS.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.chip, cfg.tribunal === t && styles.chipAtivo]}
                    onPress={() => setCfg(c => ({ ...c, tribunal: t }))}
                  >
                    <Text style={[styles.chipText, cfg.tribunal === t && styles.chipTextAtivo]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              <Ionicons name="globe" size={15} color={COLORS.info} /> Webhook / API própria
            </Text>
            <Text style={styles.cardHint}>URL de uma API REST que retorna suas comunicações (opcional, avançado).</Text>
            <Text style={styles.fieldLabel}>URL do Endpoint</Text>
            <TextInput
              style={styles.input}
              placeholder="https://minha-api.com/comunicacoes"
              placeholderTextColor={COLORS.textDim}
              value={cfg.webhookUrl}
              onChangeText={v => setCfg(c => ({ ...c, webhookUrl: v }))}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity style={[styles.salvarBtn, salvando && styles.salvarBtnOk]} onPress={salvarConfig}>
            <Ionicons name={salvando ? "checkmark" : "save-outline"} size={18} color="#fff" />
            <Text style={styles.salvarBtnText}>{salvando ? "Salvo!" : "Salvar Configurações"}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── ABA PORTAIS DJe ────────────────────────────── */}
      {aba === "portais" && (
        <ScrollView contentContainerStyle={[{ padding: 16, gap: 10 }, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.info} />
            <Text style={styles.infoText}>
              Portais oficiais do Poder Judiciário para consulta de publicações e tramitação processual.
              {cfg.numeroProcesso ? `\n\nProcesso salvo: ${cfg.numeroProcesso} · ${cfg.tribunal}` : ""}
            </Text>
          </View>
          {PORTAIS_CONSULTA.map(p => (
            <TouchableOpacity key={p.url} style={styles.portalCard} onPress={() => Linking.openURL(p.url)}>
              <View style={styles.portalIcon}>
                <Ionicons name={p.icon as any} size={22} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.portalNome}>{p.nome}</Text>
                <Text style={styles.portalUrl} numberOfLines={1}>{p.url}</Text>
              </View>
              <Ionicons name="open-outline" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
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
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  },
  hamburger: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  title: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  sub: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: COLORS.bgInput },
  badgeNaoLida: { backgroundColor: COLORS.danger, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, marginRight: 4 },
  badgeNaoLidaText: { fontSize: 11, fontWeight: "800", color: "#fff" },
  tabs: { flexDirection: "row", backgroundColor: COLORS.bgCard, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3, paddingVertical: 9, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabBtnAtivo: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 10, fontWeight: "700", color: COLORS.textMuted },
  tabTextAtivo: { color: COLORS.primary },

  addBar: {
    flexDirection: "row", alignItems: "flex-end", gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.bgCard,
  },
  addInput: {
    flex: 1, backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
    color: COLORS.text, fontSize: 13, maxHeight: 80,
  },
  addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  addBtnDis: { backgroundColor: COLORS.bgInput },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  emptyDesc: { fontSize: 13, color: COLORS.textMuted, textAlign: "center", lineHeight: 20 },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.bgCard, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.border, marginTop: 8 },
  emptyBtnText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },

  limparBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-end", marginBottom: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border },
  limparBtnText: { fontSize: 11, color: COLORS.textMuted },

  msgCard: { backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  msgCardNaoLida: { borderColor: COLORS.primary + "60", backgroundColor: "#0a1f12" },
  msgHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  msgOrigem: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  msgOrigemText: { fontSize: 11, color: COLORS.primary, fontWeight: "700" },
  msgData: { fontSize: 11, color: COLORS.textDim },
  dotNaoLida: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  msgTitulo: { fontSize: 14, fontWeight: "700", color: COLORS.text, marginBottom: 4 },
  msgConteudo: { fontSize: 13, color: COLORS.textMuted, lineHeight: 19 },
  msgActions: { flexDirection: "row", gap: 10, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border, flexWrap: "wrap" },
  msgActBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  msgActText: { fontSize: 12, color: COLORS.textMuted, fontWeight: "600" },

  cnjContent: { padding: 16, gap: 12 },
  cnjBanner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#0a1f12", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.primary + "40",
  },
  cnjBannerTitle: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  cnjBannerSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  buscarBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: COLORS.primary, borderRadius: 14, padding: 15,
  },
  buscarBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  cnjResultHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  cnjResultHeaderText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  cnjCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cnjCardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 6 },
  cnjTipo: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  cnjOrgao: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  cnjData: { fontSize: 11, color: COLORS.info, fontWeight: "600" },
  cnjProcesso: { fontSize: 12, color: COLORS.textMuted, fontFamily: "monospace", marginBottom: 4 },
  cnjExpanded: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 6 },
  cnjDetalhe: { fontSize: 13, color: COLORS.textMuted, lineHeight: 19 },
  cnjTexto: { fontSize: 13, color: COLORS.textMuted, lineHeight: 20, marginTop: 6, backgroundColor: COLORS.bgInput, borderRadius: 8, padding: 10 },
  cnjActions: { flexDirection: "row", gap: 12, marginTop: 10, flexWrap: "wrap" },
  cnjActBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  cnjActText: { fontSize: 12, color: COLORS.textMuted, fontWeight: "600" },
  cnjDica: { flexDirection: "row", gap: 10, backgroundColor: "#111e2a", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#1e3050" },
  cnjDicaText: { flex: 1, fontSize: 12, color: COLORS.textMuted, lineHeight: 19 },

  configContent: { padding: 16, gap: 14 },
  card: { backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 6 },
  cardHint: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18, marginBottom: 10 },
  fieldLabel: { fontSize: 11, fontWeight: "700", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 8, marginBottom: 4 },
  input: { backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 13 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgInput, marginTop: 4 },
  chipAtivo: { borderColor: COLORS.primary, backgroundColor: "#0d2218" },
  chipText: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600" },
  chipTextAtivo: { color: COLORS.primary },
  testarBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: COLORS.primary, borderRadius: 10, padding: 12, marginTop: 14 },
  testarBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  linkBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, alignSelf: "flex-start" },
  linkBtnText: { fontSize: 13, color: COLORS.info, fontWeight: "600" },
  salvarBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: COLORS.primary, borderRadius: 14, padding: 15 },
  salvarBtnOk: { backgroundColor: "#1a5c32" },
  salvarBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },

  infoBox: { flexDirection: "row", gap: 10, backgroundColor: "#111e2a", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#1e3050" },
  infoText: { flex: 1, fontSize: 13, color: COLORS.textMuted, lineHeight: 19 },
  portalCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: COLORS.bgCard, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  portalIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.bgInput, alignItems: "center", justifyContent: "center" },
  portalNome: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  portalUrl: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
});
