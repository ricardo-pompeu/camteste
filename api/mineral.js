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
      `https://generativelanguage.googleapis.com/v1beta/models/gemma-4-31b-it:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
Você é um geólogo e mineralogista especialista.

Analise cuidadosamente a imagem enviada.

A identificação visual de minerais possui limitações.
Por isso NÃO retorne apenas uma hipótese.

Retorne os 3 minerais mais prováveis em ordem de confiança.

Para cada mineral informe:

- Nome
- Confiança (%)
- Descrição detalhada
- Características visuais observadas
- Composição química
- Sistema cristalino
- Dureza Mohs
- Brilho
- Cor típica
- Motivos pelos quais a imagem sugere este mineral

Ao final informe:

- Principais fatores de incerteza
- Quais testes físicos ajudariam a confirmar a identificação

Responda em Markdown.
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
            maxOutputTokens: 2500
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
