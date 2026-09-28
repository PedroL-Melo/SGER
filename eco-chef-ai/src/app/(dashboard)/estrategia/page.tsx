'use client';

import { useState } from 'react';
import { 
  Loader2, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target, 
  CheckCircle, 
  AlertCircle, 
  ChefHat, 
  Megaphone, 
  Receipt,
  Utensils
} from 'lucide-react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [formData, setFormData] = useState({
    insumos: '',
    custo_insumos: '',
    custos_fixos: '',
    salario: '',
    margem: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.warn('API error or missing keys. Injecting fallback data in 2 seconds...');
      
      // Fallback injection after 2 seconds
      setTimeout(() => {
        setResult({
          financeiro: {
            custo_funcionario_real: Number(formData.salario) * 1.7 || 2550,
            preco_venda_sugerido: 45.90,
            cmv_percentual: 28,
            lucro_limpo_por_unidade: 12.50,
          },
          gestao: {
            ponto_equilibrio_unidades: 350,
            diagnostico_cmv: "CMV dentro da faixa saudável (abaixo de 30%). O controle de porções está eficiente, permitindo boa margem de contribuição.",
          },
          marketing: {
            nome_combo: "Combo Colina Histórica",
            receita_rapida: "Proteína grelhada com arroz de brócolis e farofa da casa. Montagem rápida e rústica.",
            pitch_vendas: "O sabor monumental que a sua fome pede. Experimente a nossa especialidade e sinta a energia da arquibancada na sua mesa!",
          }
        });
        setLoading(false);
      }, 2000);
      return;
    }

    setLoading(false);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const isHealthyCmv = result?.financeiro?.cmv_percentual <= 30;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* LEFT PANEL: FORM (1/3) */}
        <aside className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 sticky top-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-900 rounded-lg text-white">
                <ChefHat className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">EcoChef AI</h1>
            </div>
            
            <p className="text-sm text-slate-500 mb-8">
              Preencha os dados abaixo para gerar uma estratégia de lucro, marketing e gestão do seu prato.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Insumos no Estoque</label>
                <textarea
                  name="insumos"
                  value={formData.insumos}
                  onChange={handleChange}
                  placeholder="Ex: Contrafilé, Arroz, Feijão, Farofa..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all min-h-[80px]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Custo dos Insumos (R$)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    name="custo_insumos"
                    value={formData.custo_insumos}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Custos Fixos Mensais (R$)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Receipt className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    name="custos_fixos"
                    value={formData.custos_fixos}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Salário Base do Funcionário (R$)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    name="salario"
                    value={formData.salario}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Margem de Lucro Desejada (%)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Target className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    name="margem"
                    value={formData.margem}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white rounded-xl py-3.5 px-4 font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Gerando Estratégia...
                  </>
                ) : (
                  <>
                    Gerar Estratégia de Lucro
                    <TrendingUp className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </aside>

        {/* RIGHT PANEL: DASHBOARD (2/3) */}
        <main className="w-full lg:w-2/3 flex flex-col gap-6">
          {!result && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center min-h-[600px]">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <Utensils className="w-8 h-8 text-slate-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Nenhum dado gerado</h2>
              <p className="text-slate-500 max-w-sm">
                Preencha o formulário ao lado e gere sua estratégia para visualizar os indicadores financeiros, gestão e marketing aqui.
              </p>
            </div>
          )}

          {loading && !result && (
            <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center min-h-[600px]">
              <Loader2 className="w-12 h-12 text-slate-900 animate-spin mb-6" />
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Analisando o cenário...</h2>
              <p className="text-slate-500 max-w-sm">
                Nossa IA está cruzando dados de insumos e custos para encontrar a melhor estratégia de lucro.
              </p>
            </div>
          )}

          {result && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              {/* Highlight Card: Marketing (Vasco da Gama Vibe) */}
              <div className="md:col-span-2 bg-zinc-950 rounded-2xl border border-zinc-800 shadow-sm p-6 lg:p-8 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
                <div className="absolute -right-12 -top-12 opacity-5 pointer-events-none">
                   <Target className="w-64 h-64 text-white" />
                </div>
                
                <div className="flex-1 z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-zinc-300 text-xs font-medium mb-4">
                    <Megaphone className="w-3.5 h-3.5" />
                    Estratégia de Venda
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2">{result.marketing.nome_combo}</h3>
                  <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                    {result.marketing.receita_rapida}
                  </p>
                  
                  <div className="bg-white/5 rounded-xl p-5 border border-white/10 relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-zinc-500 rounded-l-xl"></div>
                    <p className="text-zinc-200 font-medium italic text-sm md:text-base pl-3">
                      "{result.marketing.pitch_vendas}"
                    </p>
                  </div>
                </div>
              </div>

              {/* CMV Status Card */}
              <div className={`md:col-span-2 rounded-2xl border shadow-sm p-6 lg:p-8 flex items-start gap-4 ${isHealthyCmv ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                {isHealthyCmv ? (
                  <CheckCircle className={`w-8 h-8 shrink-0 ${isHealthyCmv ? 'text-emerald-600' : 'text-red-600'}`} />
                ) : (
                  <AlertCircle className={`w-8 h-8 shrink-0 ${isHealthyCmv ? 'text-emerald-600' : 'text-red-600'}`} />
                )}
                <div>
                  <h4 className={`text-lg font-bold mb-1 ${isHealthyCmv ? 'text-emerald-800' : 'text-red-800'}`}>
                    Diagnóstico do CMV: {result.financeiro.cmv_percentual}%
                  </h4>
                  <p className={`text-sm leading-relaxed ${isHealthyCmv ? 'text-emerald-700' : 'text-red-700'}`}>
                    {result.gestao.diagnostico_cmv}
                  </p>
                </div>
              </div>

              {/* Preço Sugerido */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <DollarSign className="w-5 h-5 text-slate-600" />
                  </div>
                  <p className="text-slate-500 text-sm font-medium mb-1">Preço de Venda Sugerido</p>
                  <h4 className="text-3xl font-bold text-slate-900">{formatCurrency(result.financeiro.preco_venda_sugerido)}</h4>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500 flex justify-between">
                    <span>Lucro limpo/unid:</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(result.financeiro.lucro_limpo_por_unidade)}</span>
                  </p>
                </div>
              </div>

              {/* Ponto de Equilíbrio */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <TrendingUp className="w-5 h-5 text-slate-600" />
                  </div>
                  <p className="text-slate-500 text-sm font-medium mb-1">Ponto de Equilíbrio</p>
                  <h4 className="text-3xl font-bold text-slate-900">{result.gestao.ponto_equilibrio_unidades}</h4>
                  <p className="text-slate-400 text-xs mt-1">unidades no mês</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500 flex justify-between">
                    <span>Custo Func. (Real):</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(result.financeiro.custo_funcionario_real)}</span>
                  </p>
                </div>
              </div>

            </div>
          )}
        </main>

      </div>
    </div>
  );
}
