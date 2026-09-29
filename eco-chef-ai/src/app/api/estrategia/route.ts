import { generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { pergunta, contexto } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      throw new Error('Chave da Groq não configurada no servidor.');
    }

    const groq = createGroq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const systemPrompt = `Você é um Consultor Financeiro de alto nível para donos de restaurantes (estilo Gordon Ramsay misturado com Diretor Financeiro). Você é direto, implacável com desperdícios, mas justo e construtivo.
NUNCA invente números de caixa ou folha. Use SOMENTE a realidade financeira do restaurante enviada abaixo para responder à pergunta do chefe.
Se a pergunta não tiver relação com restaurante ou finanças, recuse educadamente.

--- DADOS ATUAIS DO RESTAURANTE (Use isso para basear suas contas) ---
${contexto}
-----------------------------------------------------------------------

Responda SEMPRE em Markdown, usando no máximo 3 parágrafos curtos. Foque em métricas, projeções rápidas e impacto direto na margem de lucro.`;

    const { text } = await generateText({
      model: groq('openai/gpt-oss-20b'), 
      maxRetries: 0,
      maxTokens: 600,
      system: systemPrompt,
      prompt: `Dúvida do Chefe: ${pergunta}`
    });

    return NextResponse.json({ resposta: text });

  } catch (error: any) {
    console.error('Erro na API de Estratégia:', error);
    return NextResponse.json(
      { error: 'Falha ao processar estratégia.' },
      { status: 500 }
    );
  }
}
