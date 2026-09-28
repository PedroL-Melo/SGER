import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { relato } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      throw new Error('Chave da Groq não configurada no servidor.');
    }

    const { object } = await generateObject({
      model: groq('llama-3.1-8b-instant'), 
      maxRetries: 0,
      schema: z.object({
        vendas_total: z.number().describe('O valor total em dinheiro (R$) VENDIDO no dia (Faturamento). Extraia do texto ou aproxime. Se não mencionado, retorne 0.'),
        despesas_total: z.number().describe('O valor total em dinheiro (R$) GASTO com consertos, compras extras de equipamento (ex: chapa), multas ou emergências (Despesas). ATENÇÃO: Se ele falou que "gastou" ou "comprou" algo que não seja ingrediente normal, some aqui. Se não mencionado, retorne 0.'),
        clientes_atendidos: z.number().describe('A quantidade estimada de clientes ou produtos vendidos. Se não mencionado, retorne 0.'),
        resumo_ia: z.string().describe('Um resumo profissional de no máximo 2 linhas sobre como foi o dia no restaurante, citando as vendas e os gastos caso existam.'),
        ocorrencias: z.array(z.string()).describe('Lista de problemas, faltas de funcionários ou ocorrências importantes (ex: "João faltou", "Gastamos 1200 na chapa").')
      }),
      prompt: `Você é um assistente de gestão de restaurantes (EcoChef AI).
Analise o seguinte relato do gerente sobre o dia de hoje e extraia as informações financeiras (entradas E saídas) e operacionais solicitadas de forma estruturada.

Relato do Gerente:
"${relato}"`
    });

    return NextResponse.json(object);
  } catch (error) {
    console.error('Erro ao processar relato diário com Gemini:', error);
    return NextResponse.json({ error: 'Erro ao processar relatório pela IA.' }, { status: 500 });
  }
}
