'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  BrainCircuit, 
  Send, 
  MessageSquare, 
  TrendingDown, 
  Wallet, 
  Users,
  Target,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';

export default function EstrategiaPage() {
  const [contexto, setContexto] = useState<string>('');
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  
  const [pergunta, setPergunta] = useState('');
  const [isConsulting, setIsConsulting] = useState(false);
  const [chat, setChat] = useState<{role: 'user' | 'ai', content: string}[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  // Carregar contexto financeiro secreto do Supabase
  useEffect(() => {
    const carregarContexto = async () => {
      try {
        // 1. Estoque
        const { data: estoque } = await supabase.from('estoque').select('custo_total');
        const custoEstoque = estoque ? estoque.reduce((acc, item) => acc + Number(item.custo_total), 0) : 0;

        // 2. Faturamento Diário
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const firstDay = `${year}-${month}-01`;
        
        const { data: diarios } = await supabase
          .from('relatorio_diario')
          .select('vendas_total, despesas_total');
        
        let fatTotal = 0;
        let despExtras = 0;
        if (diarios) {
          fatTotal = diarios.reduce((acc, d) => acc + Number(d.vendas_total), 0);
          despExtras = diarios.reduce((acc, d) => acc + Number(d.despesas_total || 0), 0);
        }

        // 3. Funcionários e Observações
        const { data: funcs } = await supabase.from('funcionarios').select('nome, cargo, custo_total, observacoes');
        let custoRH = 0;
        let rhResumo = '';

        if (funcs) {
          custoRH = funcs.reduce((acc, f) => acc + Number(f.custo_total), 0);
          rhResumo = funcs.map(f => `- ${f.nome} (${f.cargo}): Custo R$ ${f.custo_total}. Ocorrências/Info: ${f.observacoes || 'Nenhuma'}`).join('\n');
        }

        const textoContexto = `
[DADOS REAIS DO RESTAURANTE]
Custo Mensal RH Projetado: R$ ${custoRH}
Custo de Estoque Atual: R$ ${custoEstoque}
Faturamento Total Registrado: R$ ${fatTotal}
Despesas Extras Inesperadas: R$ ${despExtras}

[DETALHAMENTO DA EQUIPE]
${rhResumo}
`;
        setContexto(textoContexto);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingContext(false);
      }
    };
    carregarContexto();
  }, []);

  const handleSubmit = async (e?: React.FormEvent, atalhoStr?: string) => {
    e?.preventDefault();
    const textoAEnviar = atalhoStr || pergunta;
    if (!textoAEnviar.trim()) return;

    setChat(prev => [...prev, { role: 'user', content: textoAEnviar }]);
    setPergunta('');
    setIsConsulting(true);

    try {
      const res = await fetch('/api/estrategia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pergunta: textoAEnviar, 
          contexto: contexto 
        })
      });

      if (!res.ok) throw new Error('Falha na API');

      const data = await res.json();
      setChat(prev => [...prev, { role: 'ai', content: data.resposta }]);
    } catch (err) {
      setChat(prev => [...prev, { role: 'ai', content: '⚠️ Erro ao acessar o servidor da IA. Tente novamente mais tarde.' }]);
    } finally {
      setIsConsulting(false);
    }
  };

  const atalhos = [
    {
      icon: <Wallet className="w-5 h-5 text-emerald-500" />,
      titulo: "Raio-X de Preços",
      prompt: "Analise a precificação do meu prato principal. Ele custa R$ X. Com base na minha folha e estoque atual, estou tendo lucro?",
      cor: "bg-emerald-50 border-emerald-100 hover:border-emerald-300"
    },
    {
      icon: <TrendingDown className="w-5 h-5 text-red-500" />,
      titulo: "Detetive de Desperdício",
      prompt: "Audite minhas compras. O valor do meu estoque condiz com o meu faturamento atual? Onde posso cortar gastos?",
      cor: "bg-red-50 border-red-100 hover:border-red-300"
    },
    {
      icon: <Users className="w-5 h-5 text-blue-500" />,
      titulo: "Análise de Equipe (RH)",
      prompt: "Com base nas observações de RH e nos custos da minha equipe atual, eu devo demitir ou contratar alguém para melhorar a margem?",
      cor: "bg-blue-50 border-blue-100 hover:border-blue-300"
    },
    {
      icon: <Target className="w-5 h-5 text-purple-500" />,
      titulo: "Ponto de Equilíbrio",
      prompt: "Calcule meu ponto de equilíbrio (Break-even). Quanto eu preciso faturar neste mês só para pagar os custos atuais?",
      cor: "bg-purple-50 border-purple-100 hover:border-purple-300"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex flex-col h-[calc(100vh-64px)]">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <BrainCircuit className="w-8 h-8 text-slate-700" />
          Consultor Financeiro de Bolso
        </h1>
        <p className="text-slate-500 mt-1">A IA lê os números do seu banco de dados e aconselha sobre gestão e equipe.</p>
      </header>

      {/* CHAT AREA */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden mb-4">
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {chat.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto opacity-70">
              <MessageSquare className="w-12 h-12 text-slate-300 mb-4" />
              <h2 className="text-xl font-semibold text-slate-700 mb-2">Qual o plano para hoje, Chefe?</h2>
              <p className="text-slate-500 text-sm">
                Eu já analisei sua Folha de Pagamento, seu Estoque e o Faturamento que você lançou.
                Faça uma pergunta livre ou escolha um atalho abaixo.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 w-full">
                {atalhos.map((a, i) => (
                  <button
                    key={i}
                    onClick={() => setPergunta(a.prompt)}
                    className={`p-4 rounded-xl border text-left transition-colors flex items-start gap-3 ${a.cor}`}
                  >
                    <div className="shrink-0 mt-0.5">{a.icon}</div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{a.titulo}</p>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{a.prompt}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {chat.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-5 ${
                msg.role === 'user' 
                  ? 'bg-slate-900 text-white rounded-br-none' 
                  : 'bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-none prose prose-sm prose-slate'
              }`}>
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                )}
              </div>
            </div>
          ))}
          {isConsulting && (
            <div className="flex justify-start">
              <div className="bg-slate-100 border border-slate-200 rounded-2xl rounded-bl-none p-5 flex items-center gap-3 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                Analisando as finanças da casa...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <form 
            onSubmit={(e) => handleSubmit(e)} 
            className="flex gap-2 max-w-4xl mx-auto relative"
          >
            {isLoadingContext && (
              <div className="absolute -top-10 left-0 bg-yellow-100 text-yellow-800 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-yellow-200">
                <Loader2 className="w-3 h-3 animate-spin" /> Carregando contexto financeiro do banco...
              </div>
            )}
            <input
              type="text"
              value={pergunta}
              onChange={(e) => setPergunta(e.target.value)}
              placeholder="Digite sua dúvida ou selecione um atalho acima..."
              disabled={isConsulting || isLoadingContext}
              className="flex-1 rounded-full border border-slate-300 py-3.5 px-6 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 disabled:opacity-50 disabled:bg-slate-100"
            />
            <button
              type="submit"
              disabled={!pergunta.trim() || isConsulting || isLoadingContext}
              className="bg-slate-900 text-white rounded-full p-3.5 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0 w-14 h-14"
            >
              <Send className="w-5 h-5 ml-1" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
