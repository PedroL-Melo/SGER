import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { relato } = await req.json();

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error('Chave do Gemini não configurada no servidor.');
    }

    const { object } = await generateObject({
      model: google('gemini-flash-latest'), 
      schema: z.object({
        itens_inseridos: z.array(z.object({
          nome_insumo: z.string().describe('Nome do produto/ingrediente, ex: Alcatra, Arroz, Tomate.'),
          categoria: z.enum(['Carnes', 'Vegetais', 'Laticínios', 'Secos', 'Bebidas', 'Outros']).describe('A categoria que melhor se encaixa.'),
          quantidade: z.number().describe('A quantidade em números comprada ou disponível.'),
          unidade: z.string().describe('A unidade de medida, ex: kg, litros, pct, un, cx.'),
          custo_total: z.number().describe('O valor financeiro total gasto naquele produto (em reais). Caso tenha apenas valor unitário, multiplique pela quantidade para achar o total. Se não for mencionado, retorne 0.')
        })).describe('Lista com todos os insumos mencionados no texto.')
      }),
      prompt: `Você é um assistente de gestão de restaurantes (EcoChef AI).
Leia o relato de compras ou conferência de estoque abaixo. Extraia todos os produtos mencionados de forma estruturada.

Relato do Usuário:
"${relato}"`
    });

    return NextResponse.json(object);
  } catch (error) {
    console.error('Erro ao processar estoque com Gemini:', error);
    return NextResponse.json({ error: 'Erro ao processar estoque pela IA.' }, { status: 500 });
  }
}
