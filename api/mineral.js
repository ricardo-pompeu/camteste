export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      erro: "Método não permitido"
    });
  }

  try {
    const { imagem } = req.body;

    if (!imagem) {
      return res.status(400).json({
        resposta: "Imagem não enviada."
      });
    }

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 30000);

    const respostaGemini = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `
Você é um especialista em Mineralogia.

Analise a fotografia enviada e responda SOMENTE no seguinte formato:

Mineral mais provável:
Confiança (%):

Características observadas:
- cor
- brilho
- hábito cristalino
- textura

Minerais semelhantes:
- item 1
- item 2

Explicação:
(descreva por que acredita ser esse mineral)

Importante:
- Não invente informações.
- Caso a imagem seja insuficiente, diga claramente.
- Informe que a confirmação exige testes físicos e laboratoriais.
                  `
                },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: imagem
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1200
          }
        })
      }
    );

    clearTimeout(timeout);

    const json = await respostaGemini.json();

    if (!respostaGemini.ok) {
      console.error(json);

      return res.status(500).json({
        resposta: "Erro ao consultar o Gemini."
      });
    }

    const texto =
      json?.candidates?.[0]?.content?.parts
        ?.map(p => p.text || "")
        .join("")
        .trim();

    return res.status(200).json({
      resposta: texto
    });

  } catch (erro) {
    console.error(erro);

    return res.status(500).json({
      resposta: "Erro interno."
    });
  }
}
