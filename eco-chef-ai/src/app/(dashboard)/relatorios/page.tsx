'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Send, 
  BrainCircuit, 
  Loader2, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Users,
  CheckCircle2
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Tipagem
interface RelatorioDiario {
  id?: string;
  data_referencia: string;
  texto_original: string;
  vendas_total: number;
  despesas_total: number;
  clientes_atendidos: number;
  resumo_ia: string;
  ocorrencias: string[];
  created_at?: string;
}

export default function RelatoriosPage() {
  const [relato, setRelato] = useState('');
  const [loading, setLoading] = useState(false);
  const [historico, setHistorico] = useState<RelatorioDiario[]>([]);
  const [fetchingHistorico, setFetchingHistorico] = useState(true);

  useEffect(() => {
    fetchHistorico();
  }, []);

  const fetchHistorico = async () => {
    setFetchingHistorico(true);

    try {
      const { data, error } = await supabase
        .from('relatorio_diario')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setHistorico(data);
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
    } finally {
      setFetchingHistorico(false);
    }
  };

  const handleProcessarRelato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relato.trim()) return;
    
    setLoading(true);

    try {
      // 1. Passa o texto para a IA interpretar (Gemini)
      const res = await fetch('/api/processar-diario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relato }),
      });

      if (!res.ok) throw new Error('Falha na API da IA');
      const dadosExtraidos = await res.json();

      const novoRelatorio: RelatorioDiario = {
        data_referencia: new Date().toISOString().split('T')[0],
        texto_original: relato,
        vendas_total: dadosExtraidos.vendas_total || 0,
        despesas_total: dadosExtraidos.despesas_total || 0,
        clientes_atendidos: dadosExtraidos.clientes_atendidos || 0,
        resumo_ia: dadosExtraidos.resumo_ia,
        ocorrencias: dadosExtraidos.ocorrencias || [],
      };

      // 2. Salva o resultado no banco
      const { data, error } = await supabase
        .from('relatorio_diario')
        .insert([novoRelatorio])
        .select();

      if (error) throw error;
      if (data) {
        setHistorico([data[0], ...historico]);
      }

      setRelato(''); // limpa o form
    } catch (err: any) {
      console.error(err);
      alert('⚠️ Os servidores da Groq estão indisponíveis no momento. Aguarde alguns segundos e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatDate = (dateStr: string) => 
    new Date(dateStr).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* TOPO: Input com IA */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Diário de Operação (IA)</h1>
                <p className="text-sm text-slate-500">Escreva como o humano fala. A IA se encarrega de organizar os dados.</p>
              </div>
            </div>

            <form onSubmit={handleProcessarRelato}>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-1 mb-4">
                <textarea
                  required
                  value={relato}
                  onChange={(e) => setRelato(e.target.value)}
                  placeholder="Ex: Hoje o dia foi corrido. Fechamos em R$ 4500 de vendas, mas o Ribamar faltou e a chapa deu problema na hora do almoço. Atendemos umas 120 pessoas."
                  className="w-full bg-transparent resize-none p-4 text-slate-700 focus:outline-none min-h-[120px] text-base"
                />
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-400 max-w-[60%]">
                  Dica: Mencione valores de vendas, faltas de funcionários e imprevistos.
                </p>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-zinc-950 text-white rounded-xl py-3 px-6 font-medium hover:bg-zinc-800 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      Registrar Dia
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* FEED DE RELATÓRIOS (CONSULTA) */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-400" />
            Histórico de Diários Processados
          </h2>

          {fetchingHistorico ? (
            <div className="text-center py-12 text-slate-400 flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-slate-300" />
              <p>Carregando histórico do banco de dados...</p>
            </div>
          ) : historico.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <FileText className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Nenhum relatório ainda</h3>
              <p className="text-slate-500 text-sm">
                Escreva seu primeiro diário acima para ver a Inteligência Artificial em ação organizando os dados.
              </p>
            </div>
          ) : (
            historico.map((item, idx) => (
              <div key={item.id || idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  
                  {/* Info Esquerda */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        {formatDate(item.data_referencia)}
                      </p>
                      <p className="text-slate-900 text-lg leading-relaxed">
                        {item.resumo_ia}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Relato Original</p>
                      <p className="text-slate-600 text-sm italic border-l-2 border-slate-300 pl-3">
                        "{item.texto_original}"
                      </p>
                    </div>
                  </div>

                  {/* Info Direita (Métricas estruturadas pela IA) */}
                  <div className="w-full md:w-64 space-y-3 shrink-0">
                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <div className="flex items-center gap-2 text-emerald-700">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs font-semibold">Vendas (Entrada)</span>
                      </div>
                      <span className="font-bold text-emerald-800">{formatCurrency(item.vendas_total)}</span>
                    </div>

                    {(item.despesas_total && item.despesas_total > 0) ? (
                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                        <div className="flex items-center gap-2 text-red-700">
                          <TrendingDown className="w-4 h-4" />
                          <span className="text-xs font-semibold">Despesas (Saída)</span>
                        </div>
                        <span className="font-bold text-red-800">{formatCurrency(item.despesas_total)}</span>
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="flex items-center gap-2 text-blue-700">
                        <Users className="w-4 h-4" />
                        <span className="text-xs font-semibold">Fluxo</span>
                      </div>
                      <span className="font-bold text-blue-800">{item.clientes_atendidos} cli.</span>
                    </div>

                    {(item.ocorrencias && item.ocorrencias.length > 0) ? (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                        <div className="flex items-center gap-2 text-amber-700 mb-2">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-xs font-semibold">Ocorrências Extraídas</span>
                        </div>
                        <ul className="space-y-1.5">
                          {item.ocorrencias.map((oc, i) => (
                            <li key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
                              <span className="mt-0.5">•</span>
                              <span className="leading-tight">{oc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center gap-2 text-slate-500">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-xs font-medium">Sem ocorrências graves</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
