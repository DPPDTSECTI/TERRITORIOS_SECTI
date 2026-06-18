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

      // Comprime a base de dados em texto puro (muito mais leve e rápido para a IA ler do que JSON)
      const baseDeDados = context?.todosTerritorios ? context.todosTerritorios.map(t => {
        const infra = t.entidadesDetalhadas?.length > 0 
            ? t.entidadesDetalhadas.map(e => `- ${e.entidade} [${e.tipo}] (${e.municipio})`).join('\n') 
            : 'Nenhuma';
        const cadeias = t.cadeiasProdutivasDetalhado?.length > 0 
            ? t.cadeiasProdutivasDetalhado.map(c => `- ${c.segmento} [${c.tipo}] (Sede: ${c.sede || 'N/A'})`).join('\n') 
            : 'Nenhuma';
        const cursos = t.cursosDetalhado?.length > 0 
            ? t.cursosDetalhado.map(c => `- ${c.curso} [${c.nivel || 'N/I'}] - ${c.entidade} (${c.municipio})`).join('\n') 
            : 'Nenhum';
        const desenvolvimentoMuns = t.desenvolvimentoDetalhado?.length > 0
            ? t.desenvolvimentoDetalhado.map(m => `- ${m.municipio}: IFDM ${Number(m.ifdm).toFixed(3)}, Pop. ${m.populacao}`).join('\n')
            : 'Dados consolidados no território.';
        const semi = t.isSemiarido ? `Sim (${t.qtdSemiarido} municípios)` : 'Não';
        const conecta = t.assistenciaPublica?.existe ? 'Presente' : 'Não mapeado';
        
        return `## Território: ${t.nome}\n- **IFDM Médio (Territorial):** ${t.kpis?.ifdm || 'N/A'}\n- **Pertence ao Semiárido:** ${semi}\n- **Programa Conecta Bahia:** ${conecta}\n\n### Infraestruturas CT&I\n${infra}\n\n### Cadeias Produtivas e IGs\n${cadeias}\n\n### Cursos Superiores\n${cursos}\n\n### Dados de Desenvolvimento Municipal\n${desenvolvimentoMuns}`;
      }).join('\n\n') : 'Carregando banco de dados...';

      // "Ensinando" o robô injetando os dados reais do painel na instrução dele
      const instrucaoSistema = `# MISSÃO
Você é o assistente de IA do "Painel SECTI Territórios". Sua única função é responder perguntas usando EXCLUSIVAMENTE a base de dados fornecida abaixo.

# PERSONA
- Você é um especialista nos dados do painel, preciso e objetivo.
- Você se comunica de forma clara e profissional, usando Markdown (listas, negrito) para formatar as respostas.
- Você NUNCA inventa informações. Se a resposta não está na base de dados, você deve dizer "Esta informação não está disponível nos registros do painel.".

# BASE DE DADOS DO PAINEL (Referência principal para CT&I)
Esta é sua única fonte de verdade. Use SOMENTE estes dados para responder.

${baseDeDados}

# REGRAS DE OURO
1.  **PROIBIDO CONHECIMENTO EXTERNO**: Você está estritamente proibido de usar qualquer informação que não esteja na "BASE DE DADOS DO PAINEL" acima. Não use a web e não use seu conhecimento geral sobre a Bahia ou outros assuntos.
2.  **RECUSA EDUCADA**: Se a pergunta for sobre algo que não está nos dados (ex: "Qual o PIB de Barreiras?" ou "Fale sobre a história da Bahia"), responda educadamente que você só tem acesso aos dados de CT&I, desenvolvimento e educação mapeados no painel.
3.  **CÁLCULOS SIMPLES**: Você pode fazer contagens e somas simples a partir dos dados fornecidos.`;

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
        "google/gemini-2.0-flash-lite-preview-02-05:free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "liquid/lfm-2.5-1.2b-thinking:free"
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
              "HTTP-Referer": window.location.href, // Recomendado pelo OpenRouter
              "X-Title": "Conecta Bahia ChatBot", // Recomendado pelo OpenRouter
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: modelo,
              messages: apiMessages,
              plugins: [{ id: "context-compression" }] // Apenas compressão, sem acesso à web
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
        throw new Error(`Provedores gratuitos instáveis no momento. Tente novamente em alguns segundos. (Detalhe: ${ultimoErro})`);
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