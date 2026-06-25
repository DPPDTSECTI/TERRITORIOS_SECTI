import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ChatBot({ context }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Memória Persistente: Tenta carregar do LocalStorage ou inicia vazio
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('conecta_chat_memory');
    if (saved) return JSON.parse(saved);
    return [{ role: 'assistant', content: 'Olá! Sou o assistente virtual do Conecta Bahia. Como posso ajudar com os dados?' }];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll para a última mensagem sempre que houver novas mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Salva no "banco de dados" local sempre que o chat for atualizado
  useEffect(() => {
    localStorage.setItem('conecta_chat_memory', JSON.stringify(messages));
  }, [messages]);

  // Função para limpar a memória do robô
  const clearMemory = () => {
    const initMsg = [{ role: 'assistant', content: 'Memória limpa! O que vamos fazer agora?' }];
    setMessages(initMsg);
    localStorage.setItem('conecta_chat_memory', JSON.stringify(initMsg));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Lendo a chave da API do OpenRouter do arquivo .env
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY; 
      
      if (!apiKey) {
        throw new Error("A chave VITE_OPENROUTER_API_KEY não foi encontrada. Verifique o arquivo .env");
      }

      // Comprime a base de dados em texto puro focado em contexto semântico
      const baseDeDados = context?.todosTerritorios ? context.todosTerritorios.map(t => {
        const infra = t.entidadesDetalhadas?.length > 0 
            ? t.entidadesDetalhadas.map(e => `  - ${e.entidade} (Tipo: ${e.tipo}, Município: ${e.municipio})`).join('\n') 
            : '  - Nenhuma infraestrutura registrada.';
            
        const cadeias = t.cadeiasProdutivasDetalhado?.length > 0 
            ? t.cadeiasProdutivasDetalhado.map(c => `  - ${c.segmento} (Classificação: ${c.tipo}, Sede: ${c.sede || 'N/A'})`).join('\n') 
            : '  - Nenhuma cadeia produtiva ou IG registrada.';
            
        const cursos = t.cursosDetalhado?.length > 0 
            ? t.cursosDetalhado.map(c => `  - ${c.curso} (Nível: ${c.nivel || 'N/I'}, Instituição: ${c.entidade}, Município: ${c.municipio})`).join('\n') 
            : '  - Nenhum curso superior registrado.';
            
        const desenvolvimentoMuns = t.desenvolvimentoDetalhado?.length > 0
            ? t.desenvolvimentoDetalhado.map(m => `  - ${m.municipio}: IFDM de ${Number(m.ifdm).toFixed(3)} e População de ${m.populacao} habitantes.`).join('\n')
            : '  - Dados municipais não consolidados.';
            
        const semi = t.isSemiarido ? `Sim (abrange ${t.qtdSemiarido} municípios no Semiárido)` : 'Não pertence ao Semiárido';
        const conecta = t.assistenciaPublica?.existe ? 'Projeto Presente' : 'Não mapeado neste território';
        
        return `### Território de Identidade: ${t.nome}\n* Resumo: IFDM Médio de ${t.kpis?.ifdm || 'N/A'}, Pertence ao Semiárido: ${semi}, Conecta Bahia: ${conecta}\n* Infraestruturas de CT&I mapeadas:\n${infra}\n* Arranjos Produtivos Locais (APLs) e Indicações Geográficas (IGs):\n${cadeias}\n* Lista Completa de Cursos Ofertados (Registrados no Painel):\n${cursos}\n* Perfil de Desenvolvimento dos Municípios (IFDM e População):\n${desenvolvimentoMuns}`;
      }).join('\n\n---\n\n') : 'Carregando banco de dados...';

      // "Ensinando" o robô injetando os dados reais do painel na instrução dele com técnicas avançadas
      const instrucaoSistema = `Você é a "Assistente Virtual do Painel Territorial de CT&I", a inteligência artificial oficial da SECTI (Secretaria de Ciência, Tecnologia e Inovação do Estado da Bahia).

# SEU OBJETIVO E PERSONA
1. **Tom e Estilo**: Institucional, prestativo, claro e acolhedor. Use emojis com moderação para organizar as ideias (ex: 🎓 para cursos, 🏭 para cadeias produtivas, 📊 para indicadores).
2. **Formatação**: Responda SEMPRE utilizando Markdown (listas com bullet points, negrito para destacar nomes de municípios e instituições, e quebras de linha para facilitar a leitura).
3. **Foco**: Você é especialista nos 27 Territórios de Identidade da Bahia, com foco absoluto em Ciência, Tecnologia e Inovação, Cadeias Produtivas e Índices de Desenvolvimento.

# REGRAS DE OURO (DIRETRIZES RESTRITAS)
- **Zero Alucinação**: Você está ESTRITAMENTE PROIBIDA de inventar dados, instituições, IFDMs ou municípios que não estejam listados na BASE DE DADOS fornecida abaixo.
- **Cursos Mapeados**: Se o usuário perguntar sobre os cursos de uma instituição (ex: UFBA, UNEB), você DEVE listar os cursos EXATAMENTE como aparecem na seção "Lista Completa de Cursos Ofertados" da Base de Dados. Não diga que não tem acesso a todos os cursos; trate os cursos fornecidos como a lista total disponível para você.
- **Limites do Conhecimento**: Se o usuário perguntar algo fora do escopo da Base de Dados (ex: "Qual é o PIB do Brasil?", "Quem é o governador?", "Me dê uma receita de bolo"), você deve recusar educadamente dizendo que o seu escopo é exclusivo para os dados do Painel de CT&I da Bahia.
- **Raciocínio Analítico**: Se o usuário perguntar "Quais territórios têm IFDM maior que 0.7?", você deve analisar os IFDMs na Base de Dados e listar apenas os correspondentes. Faça somas e contagens simples quando necessário.
- **Linguagem Natural**: Nunca mostre ao usuário a estrutura dos dados ou diga "no meu banco de dados diz". Aja naturalmente como se você tivesse essa sabedoria sobre a Bahia.

# BASE DE DADOS DO PAINEL (Fonte da Verdade)
Abaixo estão os dados reais do painel. Utilize-os para formular suas respostas:

${baseDeDados}`;

      // Prepara o histórico de mensagens no formato exigido pelo OpenRouter (padrão OpenAI)
      const apiMessages = [
        { role: "system", content: instrucaoSistema },
        // Envia apenas as últimas 10 mensagens para não estourar o limite de tokens com o histórico
        ...messages.slice(-10),
        { role: "user", content: input } // Adiciona a mensagem atual do usuário
      ];

      // Array de modelos gratuitos para tentar em sequência caso algum falhe
      // Retornando os modelos de "peso-pesado" para o bot ter maior capacidade de raciocínio
      const fallbackModels = [
        "google/gemini-2.0-flash-exp:free",
        "google/gemini-2.0-pro-exp-02-05:free",
        "google/gemini-2.0-flash-thinking-exp:free",
        "openrouter/auto"
      ];

      let responseText = "";
      let sucesso = false;
      let ultimoErro = "";

      for (const modelo of fallbackModels) {
        try {
          // Requisição HTTP nativa para o OpenRouter
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: modelo,
              messages: apiMessages
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `Erro do servidor: ${response.status}`);
          }

          const data = await response.json();
          responseText = data.choices[0].message.content;
          sucesso = true;
          break; // Sai do loop assim que a requisição for bem-sucedida
        } catch (err) {
          console.warn(`[ChatBot] O modelo ${modelo} falhou, tentando o próximo. Erro:`, err.message);
          ultimoErro = err.message;
          // O loop continuará para a próxima iteração
        }
      }

      if (!sucesso) {
        throw new Error(`Servidores sobrecarregados ou a pergunta foi bloqueada pelo filtro de segurança. Tente reformular a pergunta. (Detalhe: ${ultimoErro})`);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      // Agora o bot vai te falar exatamente qual é o problema!
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `⚠️ Ocorreu um erro: ${error.message}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-[9999] flex items-center justify-center"
        aria-label="Abrir assistente"
      >
        <MessageCircle size={24} />
      </button>

      {/* Janela do Chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col z-[9999] border border-gray-200 overflow-hidden">
          {/* Cabeçalho */}
          <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageCircle size={20} />
              Assistente Conecta
            </h3>
          <div className="flex items-center gap-3">
            <button onClick={clearMemory} title="Limpar Memória" className="hover:text-blue-200 transition-colors">
              <Trash2 size={18} />
            </button>
            <button onClick={() => setIsOpen(false)} title="Fechar Chat" className="hover:text-blue-200 transition-colors">
              <X size={20} />
            </button>
          </div>
          </div>

          {/* Área de mensagens */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-4 text-sm shadow-sm break-words ${msg.role === 'user' ? 'bg-blue-600 text-white self-end rounded-tr-sm' : 'bg-white text-gray-800 self-start rounded-tl-sm border border-gray-100 ring-1 ring-black/5'}`}>
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : (
                  <ReactMarkdown
                    components={{
                      p: ({ node, ...props }) => <p className="mb-3 text-[13px] sm:text-sm leading-relaxed text-gray-700 last:mb-0" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc pl-5 sm:pl-6 mb-4 space-y-1.5 marker:text-gray-400" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal pl-5 sm:pl-6 mb-4 space-y-1.5 marker:text-gray-400" {...props} />,
                      li: ({ node, ...props }) => <li className="text-[13px] sm:text-sm leading-relaxed text-gray-700 pl-1" {...props} />,
                      strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900" {...props} />,
                      h1: ({ node, ...props }) => <h1 className="text-base sm:text-lg font-bold mt-5 mb-3 text-gray-900" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-[15px] sm:text-base font-bold mt-4 mb-2 text-gray-900" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-[14px] sm:text-[15px] font-bold mt-3 mb-2 text-gray-900" {...props} />,
                      blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-gray-300 pl-4 py-1 my-3 text-gray-600 italic bg-gray-50 rounded-r-lg" {...props} />,
                      table: ({ node, ...props }) => <div className="overflow-x-auto mb-4"><table className="min-w-full text-left border-collapse" {...props} /></div>,
                      th: ({ node, ...props }) => <th className="border-b-2 border-gray-300 px-3 py-2 text-sm font-semibold text-gray-900 bg-gray-50" {...props} />,
                      td: ({ node, ...props }) => <td className="border-b border-gray-200 px-3 py-2 text-sm text-gray-700" {...props} />,
                      code: ({ node, inline, ...props }) => 
                        inline ? (
                          <code className="bg-gray-100 text-blue-700 px-1.5 py-0.5 rounded text-[12px] sm:text-xs font-mono border border-gray-200" {...props} />
                        ) : (
                          <pre className="bg-[#1e1e1e] text-gray-100 p-4 rounded-xl overflow-x-auto my-3 text-[12px] sm:text-xs font-mono shadow-sm"><code {...props} /></pre>
                        )
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="bg-white text-gray-800 self-start rounded-xl rounded-tl-none p-3 border border-gray-200 shadow-sm flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-blue-600" />
                <span className="text-sm text-gray-500">Digitando...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input de texto */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Pergunte algo..." className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={isLoading} />
            <button type="submit" disabled={!input.trim() || isLoading} className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}