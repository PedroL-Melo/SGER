'use client';

import { useState, useEffect } from 'react';
import { Package, Search, Edit2, Trash2, BrainCircuit, Send, Loader2, Plus, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Produto {
  id?: string;
  nome_insumo: string;
  categoria: string;
  quantidade: number;
  unidade: string;
  custo_total: number;
}

export default function EstoquePage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  
  // AI Form States
  const [relato, setRelato] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Manual Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nome_insumo: '',
    categoria: 'Outros',
    quantidade: '',
    unidade: 'un',
    custo_total: ''
  });

  useEffect(() => {
    fetchEstoque();
  }, []);

  const fetchEstoque = async () => {
    setLoadingInitial(true);
    try {
      const { data, error } = await supabase
        .from('estoque')
        .select('*')
        .order('nome_insumo', { ascending: true });

      if (error) throw error;
      if (data) setProdutos(data);
    } catch (err) {
      console.error('Erro ao buscar estoque:', err);
    } finally {
      setLoadingInitial(false);
    }
  };

  // Função central para adicionar ou atualizar (Custo Médio Ponderado)
  const upsertItem = async (novoItem: Produto, listaAtual: Produto[]) => {
    const nomeBusca = novoItem.nome_insumo.trim().toLowerCase();
    const itemExistente = listaAtual.find(p => p.nome_insumo.trim().toLowerCase() === nomeBusca);

    if (itemExistente) {
      // ATUALIZAR (Soma quantidade e custo total para fazer o preço médio)
      const novaQtd = Number(itemExistente.quantidade) + Number(novoItem.quantidade);
      const novoCustoTotal = Number(itemExistente.custo_total) + Number(novoItem.custo_total);

      const { data, error } = await supabase
        .from('estoque')
        .update({ quantidade: novaQtd, custo_total: novoCustoTotal })
        .eq('id', itemExistente.id)
        .select();

      if (error) throw error;
      return { action: 'updated', item: data[0] };
    } else {
      // INSERIR NOVO
      const { data, error } = await supabase
        .from('estoque')
        .insert([{
          nome_insumo: novoItem.nome_insumo.trim(),
          categoria: novoItem.categoria,
          quantidade: Number(novoItem.quantidade),
          unidade: novoItem.unidade,
          custo_total: Number(novoItem.custo_total)
        }])
        .select();

      if (error) throw error;
      return { action: 'inserted', item: data[0] };
    }
  };

  // --- LÓGICA DA INTELIGÊNCIA ARTIFICIAL ---
  const handleProcessarEstoque = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relato.trim()) return;
    
    setIsProcessing(true);

    try {
      const res = await fetch('/api/processar-estoque', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relato }),
      });

      if (!res.ok) throw new Error('Falha na API da IA');
      const dadosExtraidos = await res.json();
      const itens: Produto[] = dadosExtraidos.itens_inseridos || [];

      if (itens.length === 0) {
        alert('A IA não encontrou produtos no seu texto.');
        setIsProcessing(false);
        return;
      }

      // Processa cada item sequencialmente para agrupar corretamente
      let listaAtualizada = [...produtos];
      
      for (const item of itens) {
        const resultado = await upsertItem(item, listaAtualizada);
        
        if (resultado.action === 'inserted') {
          listaAtualizada.push(resultado.item);
        } else {
          // Substitui o item atualizado na lista
          listaAtualizada = listaAtualizada.map(p => p.id === resultado.item.id ? resultado.item : p);
        }
      }

      setProdutos(listaAtualizada);
      setRelato('');
    } catch (err: any) {
      console.error(err);
      alert('⚠️ Os servidores da Groq estão indisponíveis no momento. Use o Lançamento Manual.');
    } finally {
      setIsProcessing(false);
    }
  };

  // --- LÓGICA MANUAL (MODAL) ---
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const novoItem = {
      nome_insumo: formData.nome_insumo,
      categoria: formData.categoria,
      quantidade: Number(formData.quantidade),
      unidade: formData.unidade,
      custo_total: Number(formData.custo_total)
    };

    try {
      const resultado = await upsertItem(novoItem, produtos);
      
      if (resultado.action === 'inserted') {
        setProdutos([...produtos, resultado.item]);
      } else {
        setProdutos(produtos.map(p => p.id === resultado.item.id ? resultado.item : p));
      }
      
      closeModal();
    } catch (err) {
      console.error('Erro ao adicionar manualmente:', err);
      alert('Erro ao salvar no banco. Verifique o console.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ nome_insumo: '', categoria: 'Outros', quantidade: '', unidade: 'un', custo_total: '' });
  };

  // --- LÓGICA DE REMOÇÃO ---
  const handleRemove = async (id: string | undefined) => {
    if (!id) return;
    if (!confirm('Deseja realmente remover este item do estoque?')) return;

    const backup = [...produtos];
    setProdutos(produtos.filter(p => p.id !== id));

    try {
      const { error } = await supabase.from('estoque').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Erro ao remover:', err);
      alert('Erro ao remover no banco. Revertendo.');
      setProdutos(backup);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50 dark:bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* TOPO */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Package className="w-6 h-6 text-slate-500" />
              Estoque de Ingredientes
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Lance insumos pela IA ou adicione manualmente.
            </p>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-zinc-900 dark:bg-zinc-800 text-white rounded-xl px-5 py-2.5 font-medium hover:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2 shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Insumo Manual
          </button>
        </div>

        {/* INPUT DA IA */}
        <div className="bg-white dark:bg-[#121212] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Lançamento Inteligente de Estoque</h1>
                <p className="text-sm text-slate-500">
                  Escreva os itens que você comprou (em texto livre). A IA organizará automaticamente.
                </p>
              </div>
            </div>

            <form onSubmit={handleProcessarEstoque}>
              <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl p-1 mb-4">
                <textarea
                  required
                  value={relato}
                  onChange={(e) => setRelato(e.target.value)}
                  placeholder='Ex: "Comprei 15kg de contrafilé por R$ 600 e 10 pacotes de arroz por 50 reais."'
                  className="w-full bg-transparent resize-none p-4 text-slate-700 dark:text-slate-300 focus:outline-none min-h-[100px] text-base"
                />
              </div>
              <div className="flex justify-end items-center">
                <button 
                  type="submit" 
                  disabled={isProcessing}
                  className="bg-blue-600 text-white rounded-xl py-3 px-6 font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm shadow-sm"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processando IA...
                    </>
                  ) : (
                    <>
                      Lançar Insumos (IA)
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* TABELA DE ESTOQUE */}
        <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          {loadingInitial ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center">
              <Loader2 className="w-6 h-6 animate-spin mb-3 text-slate-400" />
              Buscando catálogo...
            </div>
          ) : produtos.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 rounded-full flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-slate-300 dark:text-zinc-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-200 mb-1">Estoque Vazio</h3>
              <p className="text-slate-500 max-w-sm text-sm">
                Use a Inteligência Artificial logo acima ou cadastre manualmente.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50/50 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-zinc-400">Insumo</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-zinc-400">Categoria</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-zinc-400">Qtd.</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-zinc-400">Custo Total</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-zinc-400">Unitário (Médio)</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-zinc-400 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {produtos.map(p => {
                    // Cálculo inteligente do Preço Médio
                    const unitarioMedio = p.quantidade > 0 ? (p.custo_total / p.quantidade) : 0;
                    
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">{p.nome_insumo}</td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 px-2 py-1 rounded-md text-xs font-medium border border-slate-200 dark:border-zinc-700">
                            {p.categoria}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-900 dark:text-slate-200 font-medium">
                          {p.quantidade} <span className="text-slate-400 dark:text-zinc-500 text-xs">{p.unidade}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-900 dark:text-slate-200 font-semibold">{formatCurrency(p.custo_total)}</td>
                        <td className="px-6 py-4 text-slate-500 dark:text-zinc-400 text-xs font-medium">
                          {formatCurrency(unitarioMedio)} / {p.unidade}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleRemove(p.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Remover"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: CADASTRO MANUAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121212] rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-zinc-800">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Cadastrar Insumo Manual</h3>
              <button 
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Nome do Insumo</label>
                <input
                  type="text"
                  required
                  value={formData.nome_insumo}
                  onChange={(e) => setFormData({...formData, nome_insumo: e.target.value})}
                  placeholder="Ex: Alcatra"
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent py-2.5 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10 transition-all"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Categoria</label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent py-2.5 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10"
                  >
                    <option>Carnes</option>
                    <option>Vegetais</option>
                    <option>Laticínios</option>
                    <option>Secos</option>
                    <option>Bebidas</option>
                    <option>Outros</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Unidade</label>
                  <select
                    value={formData.unidade}
                    onChange={(e) => setFormData({...formData, unidade: e.target.value})}
                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent py-2.5 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10"
                  >
                    <option>kg</option>
                    <option>g</option>
                    <option>litros</option>
                    <option>ml</option>
                    <option>un</option>
                    <option>pacotes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Quantidade Comprada</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.quantidade}
                    onChange={(e) => setFormData({...formData, quantidade: e.target.value})}
                    placeholder="Ex: 10"
                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent py-2.5 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Valor Total Pago (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.custo_total}
                    onChange={(e) => setFormData({...formData, custo_total: e.target.value})}
                    placeholder="Ex: 150.00"
                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent py-2.5 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10 transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 bg-transparent border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
