import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { insumos, custo_insumos, custos_fixos, salario, margem } = await req.json();

    const { object } = await generateObject({
      model: openai('gpt-4o'), // Substitua por seu modelo se necessário
      schema: z.object({
        financeiro: z.object({
          custo_funcionario_real: z.number(),
          preco_venda_sugerido: z.number(),
          cmv_percentual: z.number(),
          lucro_limpo_por_unidade: z.number(),
        }),
        gestao: z.object({
          ponto_equilibrio_unidades: z.number(),
          diagnostico_cmv: z.string(),
        }),
        marketing: z.object({
          nome_combo: z.string(),
          receita_rapida: z.string(),
          pitch_vendas: z.string(),
        })
      }),
      prompt: `Você é um CFO especialista em restaurantes. 
DADOS: Insumos: ${insumos}, Custo Insumos: R$ ${custo_insumos}, Custos Fixos: R$ ${custos_fixos}, Salário Base: R$ ${salario}, Margem Desejada: ${margem}%.
REGRAS DE CÁLCULO:
1. Adicione 70% sobre o salário nominal para calcular o custo efetivo.
2. Calcule o preço de venda para atingir a margem desejada.
3. Calcule o CMV percentual.
4. Calcule o Ponto de Equilíbrio (unidades a vender para cobrir os custos fixos).
5. Crie um nome comercial para o prato com referência sutil e motivacional ao Vasco da Gama ou a São Januário.
Retorne um objeto JSON estrito contendo: 'financeiro' (custo_funcionario_real, preco_venda_sugerido, cmv_percentual, lucro_limpo_por_unidade), 'gestao' (ponto_equilibrio_unidades, diagnostico_cmv), e 'marketing' (nome_combo, receita_rapida, pitch_vendas).`,
    });

    return NextResponse.json(object);
  } catch (error) {
    console.error('Erro na API:', error);
    return NextResponse.json({ error: 'Erro ao gerar estratégia.' }, { status: 500 });
  }
}
