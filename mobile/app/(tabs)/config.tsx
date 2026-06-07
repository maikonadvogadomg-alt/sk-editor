import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Switch, Linking, FlatList, Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import {
  getConfig, saveConfig, clearHistorico, clearConversa, AppConfig,
} from "@/services/storage";
import {
  testarConexaoNeon, executarScriptNeon, executarQueryNeon, SQL_SETUP,
} from "@/services/neon";
import { autoDetectProvider } from "@/services/ai";
import SideMenu from "@/components/SideMenu";

const PROVEDORES_GRATIS = [
  {
    nome: "Groq",
    desc: "GRATUITO — Llama 3.3, Whisper (voz), muito rápido",
    link: "https://console.groq.com",
    prefixo: "gsk_...",
    destaque: true,
  },
  {
    nome: "Google Gemini",
    desc: "GRATUITO — Gemini 2.0 Flash, multimodal",
    link: "https://aistudio.google.com/app/apikey",
    prefixo: "AIza...",
    destaque: true,
  },
  {
    nome: "OpenRouter",
    desc: "Vários modelos, alguns gratuitos (sk-or-...)",
    link: "https://openrouter.ai/keys",
    prefixo: "sk-or-...",
    destaque: false,
  },
  {
    nome: "OpenAI",
    desc: "GPT-4o e demais modelos (pago)",
    link: "https://platform.openai.com/api-keys",
    prefixo: "sk-...",
    destaque: false,
  },
  {
    nome: "Anthropic Claude",
    desc: "Claude Haiku / Sonnet (pago)",
    link: "https://console.anthropic.com/",
    prefixo: "sk-ant-...",
    destaque: false,
  },
];

export default function Config() {
  const insets = useSafeAreaInsets();
  const [cfg, setCfg] = useState<AppConfig | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [alterado, setAlterado] = useState(false);
  const [secao, setSecao] = useState<"chaves" | "voz" | "senha" | "pref">("chaves");
  const [vozes, setVozes] = useState<Speech.Voice[]>([]);
  const [showVozes, setShowVozes] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // toggle visibilidade das chaves (por padrão ocultas)
  const [showKey1, setShowKey1] = useState(false);
  const [showKey2, setShowKey2] = useState(false);
  const [showKey3, setShowKey3] = useState(false);
  const [showKey4, setShowKey4] = useState(false);
  const [showDriveKey, setShowDriveKey] = useState(false);
  const [showEasToken, setShowEasToken] = useState(false);

  // Banco de dados — estado local
  const [showDbUrl, setShowDbUrl] = useState(false);
  const [dbStatus, setDbStatus] = useState<"idle" | "testing" | "ok" | "erro">("idle");
  const [dbStatusMsg, setDbStatusMsg] = useState("");
  const [sqlQuery, setSqlQuery] = useState("");
  const [sqlResult, setSqlResult] = useState("");
  const [sqlRunning, setSqlRunning] = useState(false);
  const [criandoTabelas, setCriandoTabelas] = useState(false);
  const [sqlPedido, setSqlPedido] = useState("");
  const [sqlGerandoIA, setSqlGerandoIA] = useState(false);

  useEffect(() => {
    getConfig().then(setCfg);
    Speech.getAvailableVoicesAsync()
      .then((vs) => {
        const ptVozes = vs.filter((v) =>
          v.language?.toLowerCase().startsWith("pt")
        );
        setVozes(ptVozes.length > 0 ? ptVozes : vs.slice(0, 20));
      })
      .catch(() => setVozes([]));
  }, []);

  async function testarConexao() {
    const dbUrl = cfg?.databaseUrl?.trim();
    if (!dbUrl) {
      setDbStatus("erro");
      setDbStatusMsg("Configure e salve a URL do banco primeiro.");
      return;
    }
    setDbStatus("testing");
    setDbStatusMsg("Conectando...");
    try {
      const ver = await testarConexaoNeon(dbUrl);
      setDbStatus("ok");
      setDbStatusMsg(`✓ Conectado — ${ver}`);
    } catch (e: any) {
      setDbStatus("erro");
      setDbStatusMsg(`Falha: ${e.message?.slice(0, 140) || "sem resposta"}`);
    }
  }

  async function executarSQL() {
    const dbUrl = cfg?.databaseUrl?.trim();
    if (!dbUrl) { setSqlResult("⚠ Configure e salve a URL do banco primeiro."); return; }
    if (!sqlQuery.trim()) return;
    setSqlRunning(true);
    setSqlResult("");
    try {
      // suporta múltiplos statements separados por ;
      const { ok, errors } = await executarScriptNeon(sqlQuery, dbUrl);
      if (errors.length === 0) {
        setSqlResult(`✓ ${ok} statement(s) executado(s) com sucesso.`);
      } else {
        const erroTxt = errors.map(e => `✗ ${e.query?.slice(0, 60)}…\n  → ${e.error}`).join("\n\n");
        setSqlResult(`${ok} ok, ${errors.length} erro(s):\n\n${erroTxt}`);
      }
    } catch (e: any) {
      setSqlResult(`✗ Falha:\n${e.message || "sem resposta"}`);
    } finally {
      setSqlRunning(false);
    }
  }

  async function gerarSQLcomIA() {
    if (!sqlPedido.trim()) return;
    const dbUrl = cfg?.databaseUrl?.trim();
    if (!dbUrl) { Alert.alert("URL não configurada", "Configure e salve a URL do Neon primeiro."); return; }
    setSqlGerandoIA(true);
    setSqlResult("");
    try {
      const { enviarParaIA } = await import("@/services/ai");
      const result = await enviarParaIA(
        "Você é um especialista em PostgreSQL. Gere SQL compatível com PostgreSQL/Neon para o pedido do usuário. Retorne APENAS o SQL puro, sem comentários, sem markdown, sem blocos de código. Múltiplos statements devem ser separados por ponto-e-vírgula.",
        sqlPedido.trim()
      );
      if (result.erro) { setSqlResult(`IA retornou erro: ${result.erro}`); return; }
      const sqlGerado = result.texto.replace(/```sql|```/gi, "").trim();
      setSqlQuery(sqlGerado);
      setSqlResult("✅ SQL gerado pela IA — revise e clique em Executar para rodar no banco.");
    } catch (e: any) {
      setSqlResult(`Erro: ${e.message}`);
    } finally {
      setSqlGerandoIA(false);
    }
  }

  async function criarTabelas() {
    const dbUrl = cfg?.databaseUrl?.trim();
    if (!dbUrl) {
      Alert.alert("URL não configurada", "Configure e salve a URL de conexão do Neon antes de criar as tabelas.");
      return;
    }
    setCriandoTabelas(true);
    try {
      const { ok, errors } = await executarScriptNeon(SQL_SETUP, dbUrl);
      if (errors.length === 0) {
        setDbStatus("ok");
        setDbStatusMsg(`✓ ${ok} tabelas/índices criados com sucesso.`);
        Alert.alert("Banco configurado!", `${ok} tabelas e índices criados no Neon.\n\nO banco está pronto para uso.`);
      } else {
        const ifExists = errors.filter(e => e.error.includes("already exists"));
        const reais = errors.filter(e => !e.error.includes("already exists"));
        if (reais.length === 0) {
          setDbStatus("ok");
          setDbStatusMsg(`✓ Tabelas já existiam — banco OK (${ok} statements OK, ${ifExists.length} já existentes).`);
          Alert.alert("Banco OK!", "Todas as tabelas já existem. O banco está pronto para uso.");
        } else {
          setDbStatus("erro");
          setDbStatusMsg(`${ok} ok, ${reais.length} erro(s).`);
          Alert.alert("Erros na criação", reais.map(e => e.error.slice(0, 100)).join("\n\n"));
        }
      }
    } catch (e: any) {
      setDbStatus("erro");
      setDbStatusMsg(e.message?.slice(0, 140) || "Erro desconhecido");
      Alert.alert("Erro", e.message || "Não foi possível criar as tabelas.");
    } finally {
      setCriandoTabelas(false);
    }
  }

  async function salvar() {
    if (!cfg) return;
    try {
      await saveConfig(cfg);
      setSalvo(true);
      setAlterado(false);
      setTimeout(() => setSalvo(false), 2500);
    } catch (e: any) {
      Alert.alert("Erro ao salvar", e.message || "Tente novamente.");
    }
  }

  function update(key: keyof AppConfig, val: any) {
    setCfg((c) => (c ? { ...c, [key]: val } : c));
    setAlterado(true);
    setSalvo(false);
  }

  async function testarVoz() {
    if (!cfg) return;
    const opts: Speech.SpeechOptions = {
      language: "pt-BR",
      rate: cfg.vozVelocidade ?? 1.1,
      voice: cfg.vozId || undefined,
    };
    Speech.stop();
    Speech.speak("Assistente Jurídico pronto para ajudar você!", opts);
  }

  const chave1Info = cfg?.chave1 ? autoDetectProvider(cfg.chave1) : null;
  const chave2Info = cfg?.chave2 ? autoDetectProvider(cfg.chave2) : null;
  const chave3Info = cfg?.chave3 ? autoDetectProvider(cfg.chave3) : null;
  const chave4Info = cfg?.chave4 ? autoDetectProvider(cfg.chave4) : null;

  if (!cfg)
    return (
      <View style={styles.loading}>
        <Text style={{ color: COLORS.textMuted }}>Carregando...</Text>
      </View>
    );

  const vozAtual = vozes.find((v) => v.identifier === cfg.vozId);

  const SECOES = [
    { id: "chaves", icon: "key-outline", label: "Chaves" },
    { id: "voz", icon: "volume-high-outline", label: "Voz" },
    { id: "senha", icon: "lock-closed-outline", label: "Senha" },
    { id: "pref", icon: "options-outline", label: "Dados" },
  ] as const;

  // Configuração dos 4 slots de chave com seus toggles
  const keySlots = [
    { n: 1 as const, label: "Chave 1 — Principal", ph: "gsk_... Groq  |  AIza... Gemini  |  sk-... OpenAI", info: chave1Info, show: showKey1, setShow: setShowKey1 },
    { n: 2 as const, label: "Chave 2 — Backup",    ph: "Segunda chave (outro provedor)",                    info: chave2Info, show: showKey2, setShow: setShowKey2 },
    { n: 3 as const, label: "Chave 3 — Extra",     ph: "Terceira chave (ex: Claude sk-ant...)",             info: chave3Info, show: showKey3, setShow: setShowKey3 },
    { n: 4 as const, label: "Chave 4 — Extra",     ph: "Quarta chave (ex: OpenRouter sk-or-...)",           info: chave4Info, show: showKey4, setShow: setShowKey4 },
  ];

  return (
    <View style={styles.container}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.hamburger} onPress={() => setMenuOpen(true)}>
          <Ionicons name="menu" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Configurações</Text>
          <Text style={styles.sub}>
            {cfg.nomeAssistente || "Assistente Jurídico"} — tudo salvo no dispositivo
          </Text>
        </View>
        {alterado && !salvo && (
          <View style={styles.badgeAlterado}>
            <Text style={styles.badgeAlteradoText}>não salvo</Text>
          </View>
        )}
      </View>

      {/* ── Tab bar ─────────────────────────────────────────────────── */}
      <View style={styles.tabBar}>
        {SECOES.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.tabBtn, secao === s.id && styles.tabBtnAtivo]}
            onPress={() => setSecao(s.id)}
          >
            <Ionicons
              name={s.icon}
              size={16}
              color={secao === s.id ? COLORS.primary : COLORS.textMuted}
            />
            <Text style={[styles.tabLabel, secao === s.id && styles.tabLabelAtivo]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Conteúdo rolável ────────────────────────────────────────── */}
      <ScrollView contentContainerStyle={styles.content}>

        {/* ── ABA: Chaves ─────────────────────────────────────────── */}
        {secao === "chaves" && (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="gift-outline" size={15} color={COLORS.primary} /> Chaves Gratuitas — Comece aqui!
              </Text>
              <Text style={styles.hint}>
                Groq e Gemini são 100% gratuitos. Toque para criar sua chave:
              </Text>
              {PROVEDORES_GRATIS.map((p) => (
                <TouchableOpacity
                  key={p.nome}
                  style={[styles.provItem, p.destaque && styles.provItemDestaque]}
                  onPress={() => Linking.openURL(p.link)}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={[styles.provNome, p.destaque && { color: COLORS.primary }]}>
                        {p.nome}
                      </Text>
                      {p.destaque && (
                        <View style={styles.badgeGratis}>
                          <Text style={styles.badgeGratisText}>GRÁTIS</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.provDesc}>{p.desc}</Text>
                    <Text style={styles.provPrefixo}>{p.prefixo}</Text>
                  </View>
                  <Ionicons name="open-outline" size={16} color={COLORS.textDim} />
                </TouchableOpacity>
              ))}
            </View>

            {/* 4 slots de chave com toggle visibilidade */}
            {keySlots.map(({ n, label, ph, info, show, setShow }) => (
              <View key={n} style={styles.card}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <Text style={[styles.sectionTitle, { flex: 1, marginBottom: 0 }]}>{label}</Text>
                  {info && (
                    <View style={styles.dotOk}>
                      <View style={styles.dotOkCircle} />
                      <Text style={styles.dotOkText}>{info.nome}</Text>
                    </View>
                  )}
                </View>

                {/* Campo da chave com botão olho */}
                <View style={styles.keyRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder={ph}
                    placeholderTextColor={COLORS.textDim}
                    value={(cfg as any)[`chave${n}`] || ""}
                    onChangeText={(v) => update(`chave${n}` as any, v)}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry={!show}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShow(!show)}
                  >
                    <Ionicons
                      name={show ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={COLORS.textMuted}
                    />
                  </TouchableOpacity>
                </View>

                {info ? (
                  <Text style={styles.detected}>✓ {info.nome} — {info.modelo}</Text>
                ) : (cfg as any)[`chave${n}`] ? (
                  <Text style={[styles.detected, { color: COLORS.warning }]}>
                    Prefixo não reconhecido — verifique a chave
                  </Text>
                ) : null}

                <Text style={styles.label}>Modelo (opcional — auto-detectado)</Text>
                <TextInput
                  style={styles.input}
                  placeholder={info?.modelo || "llama-3.3-70b-versatile"}
                  placeholderTextColor={COLORS.textDim}
                  value={(cfg as any)[`chave${n}Modelo`] || ""}
                  onChangeText={(v) => update(`chave${n}Modelo` as any, v)}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            ))}

            {/* Provedor ativo */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Provedor Ativo</Text>
              <Text style={styles.hint}>Qual chave será usada para gerar as respostas</Text>
              {(["demo", "chave1", "chave2", "chave3", "chave4"] as const).map((m) => {
                const infoMap = { demo: null, chave1: chave1Info, chave2: chave2Info, chave3: chave3Info, chave4: chave4Info };
                const info = infoMap[m];
                const label = m === "demo"
                  ? "Demo Groq (sem chave — limitado)"
                  : `Chave ${m.slice(-1)}${info ? ` — ${info.nome} (${info.modelo})` : " (não configurada)"}`;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[styles.opcao, cfg.modeloAtivo === m && styles.opcaoAtiva]}
                    onPress={() => update("modeloAtivo", m)}
                  >
                    <Ionicons
                      name={cfg.modeloAtivo === m ? "radio-button-on" : "radio-button-off"}
                      size={18}
                      color={cfg.modeloAtivo === m ? COLORS.primary : COLORS.textMuted}
                    />
                    <Text style={[styles.opcaoText, cfg.modeloAtivo === m && { color: COLORS.primary }]}>
                      {label}
                    </Text>
                    {info && m !== "demo" && <View style={styles.dotOkCircle} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Google Drive */}
            <View style={styles.card}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                <Text style={[styles.sectionTitle, { flex: 1, marginBottom: 0 }]}>
                  Google Drive (opcional)
                </Text>
                {cfg.driveToken ? (
                  <View style={styles.dotOk}>
                    <View style={styles.dotOkCircle} />
                    <Text style={styles.dotOkText}>Token salvo</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.hint}>
                Cole aqui o token de acesso OAuth2 do Google Drive para enviar documentos diretamente para sua conta.
              </Text>
              <TouchableOpacity
                style={[styles.provItem, { marginBottom: 10 }]}
                onPress={() => Linking.openURL("https://developers.google.com/oauthplayground")}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.provNome}>Obter token Google OAuth2 →</Text>
                  <Text style={styles.provDesc}>Selecione "Drive API v3 → drive.file" e gere o token</Text>
                </View>
                <Ionicons name="open-outline" size={16} color={COLORS.textDim} />
              </TouchableOpacity>
              <Text style={styles.label}>Token de acesso (Bearer)</Text>
              <View style={styles.keyRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="ya29.A0ARrdaM..."
                  placeholderTextColor={COLORS.textDim}
                  value={cfg.driveToken || ""}
                  onChangeText={(v) => update("driveToken", v)}
                  secureTextEntry={!showDriveKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowDriveKey(v => !v)}
                >
                  <Ionicons
                    name={showDriveKey ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>
              {cfg.driveToken ? (
                <Text style={styles.detected}>✓ Token configurado — toque em Salvar para ativar</Text>
              ) : null}
            </View>

            {/* Nome do assistente */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Nome do Assistente</Text>
              <Text style={styles.hint}>
                Personalize o nome exibido no app
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Jasmim, Iara, Assistente..."
                placeholderTextColor={COLORS.textDim}
                value={cfg.nomeAssistente || ""}
                onChangeText={(v) => update("nomeAssistente", v)}
              />
            </View>
          </>
        )}

        {/* ── ABA: Voz ────────────────────────────────────────────── */}
        {secao === "voz" && (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Leitura em Voz Alta (TTS)</Text>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Ativar leitura automática</Text>
                <Switch
                  value={cfg.vozAtiva}
                  onValueChange={(v) => update("vozAtiva", v)}
                  trackColor={{ true: COLORS.primary }}
                />
              </View>
              <Text style={styles.hint}>
                Quando ativo, o resultado é lido em voz alta após processar.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Velocidade da Voz</Text>
              <View style={styles.speedRow}>
                {[0.7, 0.9, 1.0, 1.1, 1.3, 1.5, 1.8].map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.speedBtn, cfg.vozVelocidade === v && styles.speedBtnAtivo]}
                    onPress={() => update("vozVelocidade", v)}
                  >
                    <Text style={[styles.speedText, cfg.vozVelocidade === v && styles.speedTextAtivo]}>
                      {v}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Voz do Sistema</Text>
              <Text style={styles.hint}>
                Escolha a voz TTS. Vozes "Enhanced" e "Premium" no iOS são neurais e mais naturais.
              </Text>

              <TouchableOpacity
                style={styles.vozSeletor}
                onPress={() => setShowVozes(true)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.vozAtualNome}>
                    {vozAtual?.name || "Voz padrão do sistema"}
                  </Text>
                  {vozAtual && (
                    <Text style={styles.vozAtualDetalhe}>
                      {vozAtual.language} — {vozAtual.identifier}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>

              {cfg.vozId ? (
                <TouchableOpacity
                  style={styles.btnSecundario}
                  onPress={() => update("vozId", undefined)}
                >
                  <Ionicons name="close-circle-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.btnSecundarioText}>Usar voz padrão</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity style={styles.btnTestar} onPress={testarVoz}>
                <Ionicons name="play-circle-outline" size={16} color={COLORS.primary} />
                <Text style={styles.btnTestarText}>Testar voz agora</Text>
              </TouchableOpacity>

              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>Dicas de voz neural (iOS)</Text>
                <Text style={styles.infoItem}>• Procure vozes com "(Enhanced)" ou "(Premium)" no nome</Text>
                <Text style={styles.infoItem}>• Vozes pt-BR: Luciana Enhanced é a mais natural</Text>
                <Text style={styles.infoItem}>• Se a lista estiver vazia, reinicie o app após instalar vozes</Text>
              </View>
            </View>

            <Modal
              visible={showVozes}
              animationType="slide"
              transparent
              onRequestClose={() => setShowVozes(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalBox}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Selecionar Voz</Text>
                    <TouchableOpacity onPress={() => setShowVozes(false)}>
                      <Ionicons name="close" size={22} color={COLORS.text} />
                    </TouchableOpacity>
                  </View>
                  {vozes.length === 0 ? (
                    <Text style={[styles.hint, { padding: 20 }]}>
                      Nenhuma voz encontrada. Instale vozes pt-BR nas configurações do sistema.
                    </Text>
                  ) : (
                    <FlatList
                      data={vozes}
                      keyExtractor={(v) => v.identifier}
                      renderItem={({ item }) => {
                        const sel = cfg.vozId === item.identifier;
                        return (
                          <TouchableOpacity
                            style={[styles.vozItem, sel && styles.vozItemSel]}
                            onPress={() => { update("vozId", item.identifier); setShowVozes(false); }}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.vozItemNome, sel && { color: COLORS.primary }]}>
                                {item.name}
                              </Text>
                              <Text style={styles.vozItemDetalhe}>
                                {item.language} — {item.quality || "padrão"}
                              </Text>
                            </View>
                            {sel && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                          </TouchableOpacity>
                        );
                      }}
                    />
                  )}
                </View>
              </View>
            </Modal>
          </>
        )}

        {/* ── ABA: Senha ──────────────────────────────────────────── */}
        {secao === "senha" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Senha de Acesso</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Exigir senha ao abrir o app</Text>
              <Switch
                value={cfg.loginConfigurado}
                onValueChange={(v) => update("loginConfigurado", v)}
                trackColor={{ true: COLORS.primary }}
              />
            </View>
            {cfg.loginConfigurado && (
              <>
                <Text style={styles.label}>Nova senha</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Mínimo 4 caracteres"
                  placeholderTextColor={COLORS.textDim}
                  value={cfg.senhaLogin}
                  onChangeText={(v) => update("senhaLogin", v)}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <Text style={[styles.hint, { marginTop: 8 }]}>
                  A senha fica salva apenas neste dispositivo.
                </Text>
              </>
            )}
          </View>
        )}

        {/* ── ABA: Dados ──────────────────────────────────────────── */}
        {secao === "pref" && (
          <>
            {/* ── EAS Build Token ─── */}
            <View style={styles.card}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                <Text style={[styles.sectionTitle, { flex: 1, marginBottom: 0 }]}>
                  EAS Token (Build iOS / Android)
                </Text>
                {cfg.easToken ? (
                  <View style={styles.dotOk}>
                    <View style={styles.dotOkCircle} />
                    <Text style={styles.dotOkText}>Token salvo</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.hint}>
                Cole aqui o token da sua conta Expo (EAS) para gerar o APK/IPA sem precisar de computador.
              </Text>
              <TouchableOpacity
                style={[styles.provItem, { marginBottom: 10 }]}
                onPress={() => Linking.openURL("https://expo.dev/accounts/appide/settings/access-tokens")}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.provNome}>Gerar token EAS →</Text>
                  <Text style={styles.provDesc}>expo.dev → Configurações → Access Tokens → Create</Text>
                </View>
                <Ionicons name="open-outline" size={16} color={COLORS.textDim} />
              </TouchableOpacity>
              <Text style={styles.label}>Token de acesso EAS</Text>
              <View style={styles.keyRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="eas_token_..."
                  placeholderTextColor={COLORS.textDim}
                  value={cfg.easToken || ""}
                  onChangeText={(v) => update("easToken", v)}
                  secureTextEntry={!showEasToken}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowEasToken(v => !v)}
                >
                  <Ionicons
                    name={showEasToken ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>
              {cfg.easToken ? (
                <Text style={styles.detected}>✓ Token salvo — envie-o no chat para disparar o build</Text>
              ) : null}
            </View>

            {/* ── Banco de Dados Neon ─── */}
            <View style={styles.card}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                <Text style={[styles.sectionTitle, { flex: 1, marginBottom: 0 }]}>
                  Banco de Dados Neon
                </Text>
                {dbStatus === "ok" && (
                  <View style={styles.dotOk}>
                    <View style={[styles.dotOkCircle, { backgroundColor: "#22c55e" }]} />
                    <Text style={[styles.dotOkText, { color: "#22c55e" }]}>Conectado</Text>
                  </View>
                )}
                {dbStatus === "erro" && (
                  <View style={styles.dotOk}>
                    <View style={[styles.dotOkCircle, { backgroundColor: COLORS.danger }]} />
                    <Text style={[styles.dotOkText, { color: COLORS.danger }]}>Erro</Text>
                  </View>
                )}
              </View>
              <Text style={styles.hint}>
                PostgreSQL gratuito (Neon) para sincronizar dados entre dispositivos. Sem banco: tudo fica no celular.
              </Text>
              <TouchableOpacity
                style={[styles.provItem, { marginBottom: 10 }]}
                onPress={() => Linking.openURL("https://neon.tech")}
              >
                <Text style={styles.provNome}>Criar banco Neon grátis →</Text>
                <Ionicons name="open-outline" size={16} color={COLORS.textDim} />
              </TouchableOpacity>

              {/* URL da conexão — campo pequeno com olho */}
              <Text style={styles.label}>URL de conexão (PostgreSQL)</Text>
              <View style={styles.keyRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="postgresql://user:senha@host.neon.tech/banco"
                  placeholderTextColor={COLORS.textDim}
                  value={cfg.databaseUrl || ""}
                  onChangeText={(v) => update("databaseUrl", v)}
                  secureTextEntry={!showDbUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowDbUrl(v => !v)}
                >
                  <Ionicons
                    name={showDbUrl ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {/* Botão limpar URL */}
              {cfg.databaseUrl ? (
                <TouchableOpacity
                  style={{ alignSelf: "flex-start", marginTop: 6, flexDirection: "row", alignItems: "center", gap: 4 }}
                  onPress={() => {
                    Alert.alert("Limpar URL?", "Remove a URL do banco configurada.", [
                      { text: "Cancelar" },
                      { text: "Limpar", style: "destructive", onPress: () => { update("databaseUrl", ""); setDbStatus("idle"); setDbStatusMsg(""); } },
                    ]);
                  }}
                >
                  <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
                  <Text style={{ fontSize: 12, color: COLORS.danger }}>Limpar URL do banco</Text>
                </TouchableOpacity>
              ) : null}

              {/* Botão testar + status */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 }}>
                <TouchableOpacity
                  style={[
                    styles.btnTestar,
                    dbStatus === "ok" && { borderColor: "#22c55e" },
                    dbStatus === "erro" && { borderColor: COLORS.danger },
                  ]}
                  onPress={testarConexao}
                  disabled={dbStatus === "testing"}
                >
                  {dbStatus === "testing" ? (
                    <><Text style={styles.btnTestarText}>Testando...</Text></>
                  ) : (
                    <>
                      <View style={{
                        width: 8, height: 8, borderRadius: 4,
                        backgroundColor: dbStatus === "ok" ? "#22c55e"
                          : dbStatus === "erro" ? COLORS.danger
                          : COLORS.textDim,
                      }} />
                      <Text style={[
                        styles.btnTestarText,
                        dbStatus === "ok" && { color: "#22c55e" },
                        dbStatus === "erro" && { color: COLORS.danger },
                      ]}>
                        {dbStatus === "ok" ? "Conectado ✓" : dbStatus === "erro" ? "Falhou ✗" : "Testar Conexão"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
              {dbStatusMsg ? (
                <Text style={[styles.hint, {
                  marginTop: 6, fontSize: 11,
                  color: dbStatus === "ok" ? "#22c55e" : dbStatus === "erro" ? COLORS.danger : COLORS.textMuted,
                }]}>
                  {dbStatusMsg}
                </Text>
              ) : null}
            </View>

            {/* ── Criar Tabelas Iniciais ─── */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Configurar Banco de Dados</Text>
              <Text style={styles.hint}>
                Cria automaticamente todas as tabelas necessárias (histórico, snippets, conversa, templates, configurações). Seguro rodar várias vezes — usa CREATE TABLE IF NOT EXISTS.
              </Text>
              <TouchableOpacity
                style={[styles.btnTestar, {
                  marginTop: 10, alignSelf: "stretch",
                  backgroundColor: dbStatus === "ok" ? "#14532d" : COLORS.bgInput,
                  borderColor: dbStatus === "ok" ? "#22c55e" : COLORS.border,
                }]}
                onPress={criarTabelas}
                disabled={criandoTabelas}
              >
                {criandoTabelas ? (
                  <Text style={styles.btnTestarText}>Criando tabelas...</Text>
                ) : (
                  <>
                    <Ionicons name="server-outline" size={16} color={dbStatus === "ok" ? "#22c55e" : COLORS.primary} />
                    <Text style={[styles.btnTestarText, dbStatus === "ok" && { color: "#22c55e" }]}>
                      Criar Tabelas Iniciais (IF NOT EXISTS)
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* ── Assistente IA para SQL ─── */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="sparkles-outline" size={14} color={COLORS.primary} /> Pedir para IA criar SQL
              </Text>
              <Text style={styles.hint}>
                Descreva o que precisa em português. A IA gera o SQL, você revisa e executa.
              </Text>
              <TextInput
                style={[styles.input, { minHeight: 64, textAlignVertical: "top", marginBottom: 8 }]}
                placeholder={"Ex: Crie uma tabela de casos jurídicos com título, número do processo, data de abertura e status\n\nEx: Adiciona coluna 'advogado' na tabela casos"}
                placeholderTextColor={COLORS.textDim}
                value={sqlPedido}
                onChangeText={setSqlPedido}
                multiline
                autoCapitalize="sentences"
                autoCorrect
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.btnTestar, { alignSelf: "stretch", justifyContent: "center",
                  backgroundColor: sqlPedido.trim() ? "#14532d" : COLORS.bgInput,
                  borderColor: sqlPedido.trim() ? "#22c55e" : COLORS.border }]}
                onPress={gerarSQLcomIA}
                disabled={sqlGerandoIA || !sqlPedido.trim()}
              >
                {sqlGerandoIA ? (
                  <Text style={styles.btnTestarText}>Gerando SQL com IA...</Text>
                ) : (
                  <>
                    <Ionicons name="sparkles-outline" size={16} color={sqlPedido.trim() ? "#22c55e" : COLORS.textDim} />
                    <Text style={[styles.btnTestarText, sqlPedido.trim() && { color: "#22c55e" }]}>
                      Gerar SQL com IA
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* ── Console SQL ─── */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Console SQL</Text>
              <Text style={styles.hint}>
                Cole ou edite o SQL abaixo e execute direto no Neon. Múltiplos statements separados por ponto-e-vírgula.
              </Text>
              <TextInput
                style={[styles.input, styles.sqlInput]}
                placeholder={"SELECT version();\n\nCREATE TABLE casos (\n  id SERIAL PRIMARY KEY,\n  titulo TEXT,\n  data DATE\n);"}
                placeholderTextColor={COLORS.textDim}
                value={sqlQuery}
                onChangeText={setSqlQuery}
                multiline
                autoCapitalize="none"
                autoCorrect={false}
                textAlignVertical="top"
              />
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                <TouchableOpacity
                  style={[styles.btnTestar, { flex: 1, justifyContent: "center" }]}
                  onPress={executarSQL}
                  disabled={sqlRunning || !sqlQuery.trim()}
                >
                  {sqlRunning ? (
                    <Text style={styles.btnTestarText}>Executando...</Text>
                  ) : (
                    <>
                      <Ionicons name="play-circle-outline" size={16} color={COLORS.primary} />
                      <Text style={styles.btnTestarText}>Executar</Text>
                    </>
                  )}
                </TouchableOpacity>
                {sqlQuery.trim() ? (
                  <TouchableOpacity
                    style={[styles.btnTestar, { paddingHorizontal: 12 }]}
                    onPress={() => { setSqlQuery(""); setSqlResult(""); }}
                  >
                    <Ionicons name="trash-outline" size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>
              {sqlResult ? (
                <View style={styles.sqlResultBox}>
                  <Text style={styles.sqlResultText} selectable>{sqlResult}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Limpar Dados Locais</Text>
              <TouchableOpacity
                style={styles.btnDanger}
                onPress={() =>
                  Alert.alert("Limpar histórico?", "Apaga todo o histórico de processamentos.", [
                    { text: "Cancelar" },
                    {
                      text: "Limpar",
                      style: "destructive",
                      onPress: async () => {
                        await clearHistorico();
                        Alert.alert("Histórico apagado.");
                      },
                    },
                  ])
                }
              >
                <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                <Text style={styles.btnDangerText}>Limpar Histórico de Processamentos</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnDanger}
                onPress={() =>
                  Alert.alert("Limpar conversa?", "Apaga toda a conversa do Campo Livre.", [
                    { text: "Cancelar" },
                    {
                      text: "Limpar",
                      style: "destructive",
                      onPress: async () => {
                        await clearConversa();
                        Alert.alert("Conversa apagada.");
                      },
                    },
                  ])
                }
              >
                <Ionicons name="chatbox-outline" size={16} color={COLORS.danger} />
                <Text style={styles.btnDangerText}>Limpar Conversa Campo Livre</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* ── Botão Salvar FIXO (sempre visível) ────────────────────── */}
      <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.btnSalvar, salvo && styles.btnSalvarOk]}
          onPress={salvar}
          activeOpacity={0.85}
        >
          <Ionicons name={salvo ? "checkmark-circle" : "save-outline"} size={20} color="#fff" />
          <Text style={styles.btnSalvarText}>
            {salvo ? "Salvo com sucesso!" : alterado ? "Salvar Configurações ●" : "Salvar Configurações"}
          </Text>
        </TouchableOpacity>
      </View>

      <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center" },
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 12, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  },
  hamburger: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  title: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  sub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  badgeAlterado: {
    backgroundColor: "#3a2200",
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: COLORS.warning,
  },
  badgeAlteradoText: { fontSize: 10, color: COLORS.warning, fontWeight: "700" },
  tabBar: {
    flexDirection: "row",
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabBtn: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 4, paddingVertical: 10,
  },
  tabBtnAtivo: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600" },
  tabLabelAtivo: { color: COLORS.primary },
  content: { padding: 16, gap: 14 },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text, marginBottom: 10 },
  hint: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18, marginBottom: 8 },
  label: {
    fontSize: 10, color: COLORS.textMuted,
    marginTop: 10, marginBottom: 4,
    fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.bgInput,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, padding: 12,
    color: COLORS.text, fontSize: 13,
  },
  keyRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  eyeBtn: {
    width: 40, height: 44, alignItems: "center", justifyContent: "center",
    backgroundColor: COLORS.bgInput, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  detected: { fontSize: 12, color: COLORS.primary, marginTop: 6, fontWeight: "600" },
  dotOk: { flexDirection: "row", alignItems: "center", gap: 5 },
  dotOkCircle: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#2ecc71" },
  dotOkText: { fontSize: 11, color: "#2ecc71", fontWeight: "600" },
  opcao: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 12, borderRadius: 10, borderWidth: 1,
    borderColor: COLORS.border, marginBottom: 8,
  },
  opcaoAtiva: { borderColor: COLORS.primary, backgroundColor: "#0d2218" },
  opcaoText: { color: COLORS.text, fontSize: 13, flex: 1 },
  switchRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 8,
  },
  switchLabel: { fontSize: 14, color: COLORS.text, flex: 1 },
  speedRow: { flexDirection: "row", gap: 6, marginTop: 8, flexWrap: "wrap" },
  speedBtn: {
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 8, backgroundColor: COLORS.bgInput,
    borderWidth: 1, borderColor: COLORS.border,
  },
  speedBtnAtivo: { borderColor: COLORS.primary, backgroundColor: "#0d2218" },
  speedText: { color: COLORS.textMuted, fontWeight: "700", fontSize: 13 },
  speedTextAtivo: { color: COLORS.primary },
  vozSeletor: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.bgInput, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 12, marginBottom: 10,
  },
  vozAtualNome: { fontSize: 14, color: COLORS.text, fontWeight: "600" },
  vozAtualDetalhe: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  btnSecundario: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 8, borderWidth: 1, borderColor: COLORS.border,
    marginBottom: 8, alignSelf: "flex-start",
  },
  btnSecundarioText: { fontSize: 12, color: COLORS.textMuted },
  btnTestar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.primary,
    marginTop: 8, alignSelf: "flex-start",
  },
  btnTestarText: { fontSize: 13, color: COLORS.primary, fontWeight: "600" },
  infoBox: {
    backgroundColor: "#0a1a0e", borderRadius: 8, padding: 12,
    marginTop: 12, borderWidth: 1, borderColor: COLORS.border,
  },
  infoTitle: { fontSize: 12, color: COLORS.textMuted, fontWeight: "700", marginBottom: 6 },
  infoItem: { fontSize: 12, color: COLORS.textDim, marginBottom: 4, lineHeight: 18 },
  provItem: {
    flexDirection: "row", alignItems: "center", padding: 12,
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.border,
    marginBottom: 8, gap: 8,
  },
  provItemDestaque: { borderColor: COLORS.primary, backgroundColor: "#0d2218" },
  provNome: { fontSize: 14, fontWeight: "700", color: COLORS.text, marginBottom: 2 },
  provDesc: { fontSize: 12, color: COLORS.textMuted, lineHeight: 16 },
  provPrefixo: { fontSize: 11, color: COLORS.textDim, marginTop: 2, fontFamily: "monospace" },
  badgeGratis: {
    backgroundColor: COLORS.primary, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  badgeGratisText: { fontSize: 9, color: "#fff", fontWeight: "800" },
  btnDanger: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1,
    borderColor: COLORS.danger, marginBottom: 8, backgroundColor: "#1a0808",
  },
  btnDangerText: { color: COLORS.danger, fontSize: 13, fontWeight: "600" },
  stickyFooter: {
    backgroundColor: COLORS.bgCard,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    paddingHorizontal: 16, paddingTop: 12,
  },
  btnSalvar: {
    backgroundColor: COLORS.primary, borderRadius: 12, padding: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  btnSalvarOk: { backgroundColor: "#1a5c3a" },
  btnSalvarText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: "75%", borderWidth: 1, borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  vozItem: {
    flexDirection: "row", alignItems: "center", padding: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 10,
  },
  vozItemSel: { backgroundColor: "#0d2218" },
  vozItemNome: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  vozItemDetalhe: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  sqlInput: {
    minHeight: 120, marginTop: 10, fontFamily: "monospace",
    fontSize: 12, lineHeight: 20,
  },
  sqlResultBox: {
    backgroundColor: "#050f0a", borderRadius: 8, padding: 12,
    marginTop: 10, borderWidth: 1, borderColor: COLORS.border,
    maxHeight: 220,
  },
  sqlResultText: {
    fontSize: 11, color: "#a0d8b3", fontFamily: "monospace", lineHeight: 18,
  },
});
