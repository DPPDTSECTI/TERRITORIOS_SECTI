exports.handler = async (event) => {
  // Permite apenas requisições POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método não permitido' }) };
  }

  try {
    const { messages } = JSON.parse(event.body);
    
    // A chave agora fica protegida no servidor/ambiente do Netlify
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "API Key do OpenRouter não configurada no servidor." }) };
    }

    // O servidor faz a requisição para o OpenRouter de forma invisível para o usuário
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://conectabahia.ba.gov.br", // Altere para o seu domínio real
        "X-Title": "Conecta Bahia ChatBot",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-ultra-550b-a55b:free", // Mantemos o seu modelo desejado
        messages: messages
      })
    });

    const data = await response.json();
    
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};