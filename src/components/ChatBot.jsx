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
      const baseDeDados = context?.todosTerritorios ? context.todosTerritorios.map(t => 
        `[Território: ${t.nome}] IFDM: ${t.kpis?.ifdm || 0} | Infraestruturas: ` + 
        (t.entidadesDetalhadas.length > 0 
          ? t.entidadesDetalhadas.map(e => `${e.entidade} (${e.municipio})`).join(', ') 
          : 'Nenhuma')
      ).join('\n') : 'Carregando banco de dados...';

      // "Ensinando" o robô injetando os dados reais do painel na instrução dele
      const instrucaoSistema = `Você é o assistente inteligente do Painel SECTI Territórios (Conecta Bahia). 
      
      BASE DE DADOS INTERNA COMPLETA (Infraestruturas e Municípios mapeados):
      ${baseDeDados}

      Regras IMPORTANTES:
      1. PRIORIDADE MÁXIMA: Responda SEMPRE com base na 'BASE DE DADOS INTERNA COMPLETA' acima.
      2. Se perguntarem sobre números, universidades, infraestruturas ou cidades da Bahia, use EXCLUSIVAMENTE os dados internos.
      3. Formate listas e textos em negrito para ficar visualmente agradável.`;

      // Prepara o histórico de mensagens no formato exigido pelo OpenRouter (padrão OpenAI)
      const apiMessages = [
        { role: "system", content: instrucaoSistema },
        ...messages.filter((_, index) => index > 0), // Mantém histórico, mas ignora a primeira saudação inicial
        { role: "user", content: input } // Adiciona a mensagem atual do usuário
      ];

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
          model: "nvidia/nemotron-3-ultra-550b-a55b:free",
          messages: apiMessages
          // Removido o plugin "web" pois provedores gratuitos costumam travar ao tentar usá-lo
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Erro do servidor: ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.choices[0].message.content;

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
              <div key={idx} className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-4 text-sm shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white self-end rounded-tr-sm' : 'bg-white text-gray-800 self-start rounded-tl-sm border border-gray-100 ring-1 ring-black/5'}`}>
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