export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      erro: "Método não permitido"
    });
  }

  try {

    const {
      imagem,
      cor,
      brilho,
      dureza
    } = req.body;

    if (!imagem) {
      return res.status(400).json({
        resposta: "Imagem não enviada."
      });
    }

    const respostaGemini = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
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
Você é um geólogo e mineralogista.

Analise a fotografia enviada.

Dados fornecidos pelo usuário:

Cor: ${cor || "não informada"}
Brilho: ${brilho || "não informado"}
Dureza: ${dureza || "não informada"}

Responda exatamente neste formato:

# Os 3 Minerais mais prováveis com

Nome:

Descrição:

Propriedades observadas:
- Cor
- Brilho
- Hábito cristalino
- Transparência

Minerais semelhantes:
- item
- item

Conclusão:

Importante:
A identificação visual possui limitações e pode exigir testes laboratoriais.
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

    const json = await respostaGemini.json();

    if (!respostaGemini.ok) {
      console.error(json);

      return res.status(500).json({
        resposta: "Erro ao consultar Gemini."
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
