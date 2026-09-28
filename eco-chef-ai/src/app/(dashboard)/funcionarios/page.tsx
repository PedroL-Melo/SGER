'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Users, Loader2, Calculator, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Funcionario {
  id: string;
  nome: string;
  cargo: string;
  regime_contratacao: string;
  salario_base: number;
  custo_vt: number;
  custo_vr: number;
  custo_total: number;
  status: string;
}

export default function FuncionariosPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ 
    nome: '', 
    cargo: '', 
    regime_contratacao: 'CLT (Simples Nacional)',
    salario_base: '',
    custo_vt: '',
    custo_vr: ''
  });

  useEffect(() => {
    fetchFuncionarios();
  }, []);

  const fetchFuncionarios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setFuncionarios(data);
    } catch (err) {
      console.error('Erro ao buscar funcionários:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- ENGINE DE CÁLCULO TRABALHISTA ---
  const calcularCustoEfetivo = (regime: string, base: number, vt: number, vr: number) => {
    let encargos = 0;

    if (regime === 'CLT (Simples Nacional)') {
      // 32.8% de provisões (Férias, 1/3 Férias, 13º, FGTS Mensal + Provisão FGTS, Multa 40%)
      encargos = base * 0.328; 
    } else if (regime === 'CLT (Lucro Presumido/Real)') {
      // 32.8% de provisões + ~27.8% INSS Patronal/RAT/Terceiros
      encargos = base * 0.606; 
    } else {
      // PJ, Freelancer ou Diarista não tem encargos na folha por padrão
      encargos = 0;
    }

    return {
      encargos,
      total: base + encargos + vt + vr
    };
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const base = Number(formData.salario_base) || 0;
    const vt = Number(formData.custo_vt) || 0;
    const vr = Number(formData.custo_vr) || 0;
    
    const calculo = calcularCustoEfetivo(formData.regime_contratacao, base, vt, vr);

    const novoFuncionario = {
      nome: formData.nome,
      cargo: formData.cargo,
      regime_contratacao: formData.regime_contratacao,
      salario_base: base,
      custo_vt: vt,
      custo_vr: vr,
      custo_total: calculo.total,
      status: 'ativo'
    };

    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .insert([novoFuncionario])
        .select();

      if (error) throw error;
      
      if (data) {
        setFuncionarios([data[0], ...funcionarios]);
      }
      closeModal();
    } catch (err) {
      console.error('Erro ao adicionar:', err);
      alert('Erro ao salvar no banco. Verifique se você rodou o código SQL no Supabase para atualizar a tabela!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Deseja realmente remover este colaborador?')) return;

    const backup = [...funcionarios];
    setFuncionarios(funcionarios.filter(f => f.id !== id));

    try {
      const { error } = await supabase.from('funcionarios').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Erro ao remover:', err);
      alert('Erro ao remover no banco. Revertendo ação.');
      setFuncionarios(backup);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ nome: '', cargo: '', regime_contratacao: 'CLT (Simples Nacional)', salario_base: '', custo_vt: '', custo_vr: '' });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50 dark:bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* TOPO: Header e Ações */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-slate-500" />
              Gestão de Equipe e Custos
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Gerencie colaboradores e descubra o impacto exato com provisões de férias, 13º e FGTS.
            </p>
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl px-5 py-2.5 font-medium hover:bg-zinc-800 transition-colors flex items-center gap-2 shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" />
            Adicionar Colaborador
          </button>
        </div>

        {/* TABELA DE FUNCIONÁRIOS (Estilo Stripe/Apple) */}
        <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/50 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-zinc-400">Colaborador</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-zinc-400">Regime</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-zinc-400">Salário / Benefícios</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-zinc-400">Encargos/Provisões</th>
                  <th className="px-6 py-4 font-semibold text-slate-900 dark:text-zinc-200">Custo Total</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-zinc-400 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Loader2 className="w-6 h-6 text-slate-400 animate-spin mx-auto mb-2" />
                      <p className="text-slate-500">Buscando equipe no banco de dados...</p>
                    </td>
                  </tr>
                ) : funcionarios.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      Nenhum colaborador encontrado no banco de dados. Adicione o primeiro!
                    </td>
                  </tr>
                ) : (
                  funcionarios.map((func) => {
                    const vt = func.custo_vt || 0;
                    const vr = func.custo_vr || 0;
                    const calc = calcularCustoEfetivo(func.regime_contratacao, func.salario_base, vt, vr);
                    const custoApresentado = func.custo_total || calc.total; // Fallback para registros antigos

                    return (
                      <tr key={func.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900 dark:text-slate-200">{func.nome}</p>
                          <p className="text-xs text-slate-500">{func.cargo}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${
                            func.regime_contratacao?.includes('CLT') 
                              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-400' 
                              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-400'
                          }`}>
                            {func.regime_contratacao || 'CLT (Simples Nacional)'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          <div className="flex flex-col gap-1">
                            <span>Base: {formatCurrency(func.salario_base)}</span>
                            {(vt > 0 || vr > 0) && (
                              <span className="text-xs text-slate-400">+ {formatCurrency(vt + vr)} (Ben)</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-zinc-400 text-xs">
                          {calc.encargos > 0 ? (
                            <span className="text-orange-600 dark:text-orange-400 font-medium">
                              {formatCurrency(calc.encargos)}
                            </span>
                          ) : (
                            <span>Isento (PJ/Free)</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white bg-slate-50/30 dark:bg-zinc-900/20 group-hover:bg-transparent">
                          {formatCurrency(custoApresentado)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleRemove(func.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" 
                              title="Remover"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL: Adicionar Colaborador Detalhado */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-zinc-800 shrink-0">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-600" />
                Cadastrar Colaborador
              </h3>
              <button 
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-6 overflow-y-auto">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    placeholder="Ex: Carlos Eduardo"
                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Cargo</label>
                  <input
                    type="text"
                    required
                    value={formData.cargo}
                    onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                    placeholder="Ex: Cozinheiro"
                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Regime de Contratação</label>
                <select
                  value={formData.regime_contratacao}
                  onChange={(e) => setFormData({...formData, regime_contratacao: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                >
                  <option value="CLT (Simples Nacional)">CLT - Simples Nacional (32.8% de Encargos)</option>
                  <option value="CLT (Lucro Presumido/Real)">CLT - Lucro Presumido/Real (~60.6% de Encargos)</option>
                  <option value="PJ / Freelancer">PJ / Freelancer / Diarista (Isento de Encargos Trabalhistas)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  Restaurantes pequenos geralmente operam no Simples Nacional. O sistema calculará Provisão de Férias, 1/3, 13º e FGTS automaticamente.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-100 dark:border-zinc-800 space-y-4">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-zinc-200 mb-2">Remuneração e Benefícios</h4>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Salário Base Nominal (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.salario_base}
                    onChange={(e) => setFormData({...formData, salario_base: e.target.value})}
                    placeholder="Ex: 2000.00"
                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Custo Mensal Vale Transporte</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.custo_vt}
                      onChange={(e) => setFormData({...formData, custo_vt: e.target.value})}
                      placeholder="Ex: 180.00 (Opcional)"
                      className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Custo Mensal Vale Alimentação</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.custo_vr}
                      onChange={(e) => setFormData({...formData, custo_vr: e.target.value})}
                      placeholder="Ex: 300.00 (Opcional)"
                      className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />
                  </div>
                </div>
              </div>

              {/* LIVE PREVIEW DO CUSTO */}
              {Number(formData.salario_base) > 0 && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 uppercase">Custo Total Projetado (Empresa)</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">Base + Benefícios + Encargos</p>
                  </div>
                  <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(calcularCustoEfetivo(
                      formData.regime_contratacao, 
                      Number(formData.salario_base), 
                      Number(formData.custo_vt), 
                      Number(formData.custo_vr)
                    ).total)}
                  </span>
                </div>
              )}

              <div className="pt-2 flex gap-3 shrink-0">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 bg-transparent border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 font-medium rounded-xl hover:bg-slate-50 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-zinc-900 dark:bg-emerald-600 text-white font-medium rounded-xl hover:bg-zinc-800 dark:hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
