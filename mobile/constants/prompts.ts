export const SYSTEM_JURIDICO = `Você é um assistente jurídico especializado em Direito Brasileiro. 
Sua função é ajudar advogados e operadores do direito com:
- Análise e revisão de peças processuais
- Redação jurídica formal conforme NBR e padrões forenses
- Resumo e síntese de documentos jurídicos extensos
- Verificação de lacunas e inconsistências legais
- Tradução para linguagem simples quando necessário

Regras:
- Sempre use linguagem jurídica formal e precisa quando redigindo documentos
- Cite dispositivos legais quando pertinente
- Preserve a formatação estrutural de petições e sentenças
- Nunca invente fatos, prazos ou jurisprudências
- Quando resumir, mantenha todos os elementos essenciais (partes, pedidos, fundamentos)
- Responda em Português do Brasil`;

export const PROMPTS: Record<string, string> = {
  resumir: `Faça um resumo jurídico completo e estruturado do documento abaixo, preservando:
- Identificação das partes
- Objeto da demanda
- Fundamentos jurídicos principais
- Pedidos
- Decisões (se houver)
Seja objetivo e use linguagem técnico-jurídica.

DOCUMENTO:
{texto}`,

  revisar: `Revise o texto jurídico abaixo verificando:
- Coesão e coerência jurídica
- Adequação da linguagem forense
- Estrutura formal da peça
- Citações legais e jurisprudências
- Clareza dos pedidos
Apresente o texto corrigido e um relatório das alterações realizadas.

TEXTO:
{texto}`,

  refinar: `Refine e melhore o texto jurídico abaixo para:
- Elevar o nível técnico-jurídico
- Melhorar a argumentação
- Fortalecer os fundamentos legais
- Tornar a linguagem mais precisa e persuasiva
Apresente a versão refinada completa.

TEXTO:
{texto}`,

  simplificar: `Traduza o texto jurídico abaixo para linguagem simples e acessível ao leigo, mantendo o sentido original. Use frases curtas, vocabulário do dia a dia e exemplos práticos quando necessário.

TEXTO:
{texto}`,

  minuta: `Com base nas informações abaixo, gere uma minuta de peça jurídica completa e formal, incluindo:
- Cabeçalho adequado ao tipo de peça
- Qualificação das partes
- Fatos e fundamentos jurídicos
- Pedidos
- Fechamento formal
Use a ABNT e os padrões forenses brasileiros.

INFORMAÇÕES:
{texto}`,

  analisar: `Faça uma análise jurídica profunda do texto abaixo, abordando:
- Pontos fortes e fracos da argumentação
- Aplicabilidade dos dispositivos legais citados
- Jurisprudência relevante sobre o tema
- Riscos processuais identificados
- Sugestões de melhoria estratégica

TEXTO:
{texto}`,

  corrigir: `Corrija os erros do texto abaixo (gramaticais, ortográficos, de concordância e de formatação jurídica), mantendo o conteúdo e a estrutura originais. Apresente o texto corrigido.

TEXTO:
{texto}`,

  redacao: `Reescreva o texto abaixo em linguagem jurídica formal e técnica, adequada para peças processuais, mantendo todos os fatos e argumentos originais. Use a norma culta, terminologia jurídica precisa e estrutura formal.

TEXTO:
{texto}`,

  lacunas: `Analise o texto jurídico abaixo e identifique todas as lacunas, omissões e pontos que precisam ser complementados:
- Informações faltantes essenciais
- Pedidos incompletos ou genéricos
- Fundamentos legais ausentes
- Documentos que deveriam ser juntados
- Prazos e requisitos não mencionados

TEXTO:
{texto}`,
};

export const CAMPO_LIVRE_SYSTEM = `Você é Jasmim, assistente jurídica especializada em Direito Brasileiro. 
Auxilia com análise jurídica, redação de peças, pesquisa de legislação e jurisprudência.
Quando escrever código ou comandos, sempre use blocos de código com a linguagem especificada.
Responda em Português do Brasil.`;
