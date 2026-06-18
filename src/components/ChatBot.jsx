import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
// Descomente as linhas abaixo quando for integrar com o Firebase Vertex AI
// import { getVertexAI, getGenerativeModel } from "firebase/vertexai";
// import { app } from '../firebaseConfig'; // Caminho para onde seu app Firebase foi inicializado

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Olá! Sou o assistente virtual do Conecta Bahia. Como posso ajudar com os dados dos municípios?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll para a última mensagem sempre que houver novas mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      /* === INTEGRAÇÃO COM FIREBASE VERTEX AI (GEMINI) ===
      const vertexAI = getVertexAI(app);
      const model = getGenerativeModel(vertexAI, { 
        model: "gemini-1.5-flash",
        systemInstruction: "Você é um assistente do programa Conecta Bahia da SECTI. Responda de forma curta e direta."
      });
      
      const chat = model.startChat({
        history: messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }))
      });
      
      const result = await chat.sendMessage(userMessage.content);
      const responseText = result.response.text();
      ==================================================== */

      // SIMULAÇÃO: Remova este bloco ao integrar com a API real
      await new Promise(resolve => setTimeout(resolve, 1000));
      const responseText = "Entendi! Ainda estou em desenvolvimento, mas em breve poderei acessar os dados geográficos e de planilhas do Conecta Bahia para você.";

      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, ocorreu um erro na comunicação com o servidor.' }]);
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
            <button onClick={() => setIsOpen(false)} className="hover:text-blue-200 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Área de mensagens */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`max-w-[85%] rounded-xl p-3 text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white self-end rounded-tr-none' : 'bg-white text-gray-800 self-start rounded-tl-none border border-gray-200 shadow-sm'}`}>
                {msg.content}
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