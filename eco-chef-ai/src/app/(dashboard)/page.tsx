'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  BrainCircuit, 
  TrendingUp, 
  Wallet, 
  Loader2, 
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // KPIs Dinâmicos
  const [faturamentoMes, setFaturamentoMes] = useState(0);
  const [folhaPagamento, setFolhaPagamento] = useState(0);
  const [margemLucro, setMargemLucro] = useState(0);

  useEffect(() => {
    const fetchFinanceiro = async () => {
      setLoading(true);
      try {
        // 1. Custo da Folha de Pagamento real (Calculado e salvo no banco)
        const { data: funcs } = await supabase.from('funcionarios').select('custo_total, salario_base');
        let totalFolha = 0;
        if (funcs) {
          totalFolha = funcs.reduce((acc, f) => {
            if (f.custo_total && f.custo_total > 0) {
              return acc + Number(f.custo_total);
            }
            return acc + (Number(f.salario_base) * 1.328);
          }, 0);
        }

        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const firstDay = `${year}-${month}-01`;

        // 2. Custos de Estoque e Compras
        const { data: estoque } = await supabase.from('estoque').select('custo_total');
        let totalEstoque = 0;
        if (estoque) {
          totalEstoque = estoque.reduce((acc, e) => acc + Number(e.custo_total), 0);
        }

        // 3. Faturamento do Mês Atual e Despesas Extras
        const { data: diarios } = await supabase
          .from('relatorio_diario')
          .select('vendas_total, despesas_total, created_at, data_referencia')
          .order('created_at', { ascending: false });
        
        let totalFat = 0;
        let totalDespesasDiarias = 0;
        
        if (diarios) {
          // KPIs: Apenas do mês atual
          const diariosMesAtual = diarios.filter(d => (d.data_referencia || d.created_at).startsWith(`${year}-${month}`));
          totalFat = diariosMesAtual.reduce((acc, d) => acc + Number(d.vendas_total), 0);
          totalDespesasDiarias = diariosMesAtual.reduce((acc, d) => acc + (d.despesas_total ? Number(d.despesas_total) : 0), 0);

          // GRÁFICO DINÂMICO DOS ÚLTIMOS 7 DIAS
          const ultimos7Dias = diarios.slice(0, 7).reverse();
          const folhaDiaria = totalFolha / 30;

          const formattedGraph = ultimos7Dias.map(r => {
            const faturamentoDia = Number(r.vendas_total) || 0;
            const despesaDia = Number(r.despesas_total) || 0;
            const lucroDia = faturamentoDia - despesaDia - folhaDiaria;

            const dataObj = new Date(r.created_at);
            const diaFormatado = `${dataObj.getDate()}/${dataObj.getMonth() + 1}`;

            return {
              mes: diaFormatado, // Reaproveitando a propriedade 'mes' do gráfico (que na verdade é o eixo X)
              faturamento: faturamentoDia,
              lucro_liquido: lucroDia
            };
          });

          setData(formattedGraph);
        }
        
        setFaturamentoMes(totalFat);

        // 4. Custo Total Operacional (Folha + Estoque + Despesas Extras do diário)
        const custoTotalOperacao = totalFolha + totalEstoque + totalDespesasDiarias;
        setFolhaPagamento(custoTotalOperacao);

        // 5. Cálculo da Margem Real
        if (totalFat > 0) {
          const lucroReal = totalFat - custoTotalOperacao;
          const margem = (lucroReal / totalFat) * 100;
          setMargemLucro(Number(margem.toFixed(1)));
        } else {
          setMargemLucro(0);
        }

      } catch (err) {
        console.error('Erro ao buscar dados do Supabase:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFinanceiro();
  }, []);


  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Bem-vindo ao Comando, Chefe</h1>
            <p className="text-slate-500 mt-1">Acompanhe a saúde financeira e tome decisões baseadas em dados.</p>
          </div>
          
          <Link 
            href="/estrategia"
            className="group flex items-center gap-2 bg-zinc-950 text-white px-5 py-3 rounded-xl font-medium hover:bg-zinc-800 transition-all shadow-sm"
          >
            <BrainCircuit className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Gerar Estratégia (IA)</span>
            <ArrowRight className="w-4 h-4 ml-1 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </Link>
        </header>

        {/* KPIs (Top Cards Bento Box) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Faturamento (Este Mês)</p>
                <h3 className="text-3xl font-bold text-emerald-600">
                  {loading ? '...' : formatCurrency(faturamentoMes)}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs font-medium text-emerald-700 mt-4 bg-emerald-50 inline-block px-2 py-1 rounded-md">
              Atualizado pelo Diário da IA
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Custo Total da Operação</p>
                <h3 className="text-3xl font-bold text-red-600">
                  {loading ? '...' : formatCurrency(folhaPagamento)}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <p className="text-xs font-medium text-red-700 mt-4 bg-red-50 inline-block px-2 py-1 rounded-md">
              (Folha + Estoque + Despesas)
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Margem de Lucro Real</p>
                <h3 className="text-3xl font-bold text-slate-700">
                  {loading ? '...' : `${margemLucro}%`}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-slate-600" />
              </div>
            </div>
            <p className="text-xs font-medium text-slate-600 mt-4 bg-slate-100 inline-block px-2 py-1 rounded-md">
              (Lucro Total / Faturamento)
            </p>
          </div>
        </div>

        {/* GRÁFICO PRINCIPAL */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Evolução Financeira Consolidada</h2>
              <p className="text-sm text-slate-500 mt-1">Comparativo de Faturamento vs Lucro Líquido</p>
            </div>
            
            <div className="flex items-center gap-4 text-sm font-medium">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-slate-200 border border-slate-300"></div>
                <span className="text-slate-600">Faturamento</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-400 border border-emerald-500"></div>
                <span className="text-slate-600">Lucro Líquido</span>
              </div>
            </div>
          </div>

          <div className="h-[400px] w-full">
            {loading ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p>Calculando inteligência financeira...</p>
              </div>
            ) : data.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <p>Nenhum dado financeiro consolidado encontrado no banco.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#cbd5e1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#cbd5e1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="mes" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 13 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 13 }}
                    tickFormatter={(value) => `R$ ${(value / 1000)}k`}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                    labelStyle={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '4px' }}
                  />
                  
                  <Area 
                    type="monotone" 
                    dataKey="faturamento" 
                    name="Faturamento"
                    stroke="#94a3b8" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorFaturamento)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="lucro_liquido" 
                    name="Lucro Líquido"
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorLucro)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
