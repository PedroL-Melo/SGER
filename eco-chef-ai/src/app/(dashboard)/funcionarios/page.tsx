'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Users, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Tipagem
interface Funcionario {
  id: string;
  nome: string;
  cargo: string;
  salario_base: number;
  status: string;
}

export default function FuncionariosPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ nome: '', cargo: '', salario_base: '' });

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

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const novoFuncionario = {
      nome: formData.nome,
      cargo: formData.cargo,
      salario_base: Number(formData.salario_base),
      status: 'ativo'
    };

    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .insert([novoFuncionario])
        .select();

      if (error) throw error;
      
      if (data) {
        setFuncionarios([...data, ...funcionarios]);
      }
      closeModal();
    } catch (err) {
      console.error('Erro ao adicionar:', err);
      alert('Erro ao salvar no banco. Verifique o console.');
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Deseja realmente remover este colaborador?')) return;

    // Remove localmente primeiro (Optimistic UI)
    const backup = [...funcionarios];
    setFuncionarios(funcionarios.filter(f => f.id !== id));

    try {
      const { error } = await supabase.from('funcionarios').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Erro ao remover:', err);
      alert('Erro ao remover no banco. Revertendo ação.');
      setFuncionarios(backup); // Reverte caso dê erro
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsSubmitting(false);
    setFormData({ nome: '', cargo: '', salario_base: '' });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Regra Empreendedora: 70% de encargos
  const calcularCustoEfetivo = (salarioBase: number) => {
    return salarioBase * 1.70;
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* TOPO: Header e Ações */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-slate-500" />
              Gestão de Equipe e Custos
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Gerencie colaboradores e acompanhe o impacto real da folha de pagamento.
            </p>
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-zinc-900 text-white rounded-xl px-5 py-2.5 font-medium hover:bg-zinc-800 transition-colors flex items-center gap-2 shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" />
            Adicionar Colaborador
          </button>
        </div>

        {/* TABELA DE FUNCIONÁRIOS (Estilo Stripe/Apple) */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-600">Nome do Colaborador</th>
                  <th className="px-6 py-4 font-semibold text-slate-600">Cargo</th>
                  <th className="px-6 py-4 font-semibold text-slate-600">Salário Nominal</th>
                  <th className="px-6 py-4 font-semibold text-slate-900">
                    Custo Efetivo Real <span className="text-xs text-slate-400 font-normal ml-1">(+70% Encargos)</span>
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
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
                    const custoEfetivo = calcularCustoEfetivo(func.salario_base);
                    return (
                      <tr key={func.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 font-medium text-slate-900">{func.nome}</td>
                        <td className="px-6 py-4 text-slate-600">{func.cargo}</td>
                        <td className="px-6 py-4 text-slate-500">{formatCurrency(func.salario_base)}</td>
                        <td className="px-6 py-4 font-semibold text-slate-900 bg-slate-50/30 group-hover:bg-transparent">
                          {formatCurrency(custoEfetivo)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {func.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleRemove(func.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
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

      {/* MODAL: Adicionar Colaborador */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Novo Colaborador</h3>
              <button 
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  placeholder="Ex: Carlos Eduardo"
                  className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Cargo</label>
                <input
                  type="text"
                  required
                  value={formData.cargo}
                  onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                  placeholder="Ex: Cozinheiro"
                  className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Salário Base Nominal (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.salario_base}
                  onChange={(e) => setFormData({...formData, salario_base: e.target.value})}
                  placeholder="2000.00"
                  className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                />
                <p className="text-xs text-slate-500 mt-1">
                  O sistema calculará automaticamente +70% de encargos.
                </p>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-zinc-900 text-white font-medium rounded-xl hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Salvar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
