'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChefHat, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simula um delay de rede para o login
    setTimeout(() => {
      router.push('/');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 text-center bg-zinc-950 text-white">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ChefHat className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">EcoChef AI</h1>
          <p className="text-sm text-zinc-400">Inteligência e Gestão para seu Restaurante</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">E-mail</label>
            <input 
              type="email" 
              required
              defaultValue="admin@ecochef.com"
              className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Senha</label>
            <input 
              type="password" 
              required
              defaultValue="123456"
              className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 text-white rounded-xl py-3.5 px-4 font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Entrar no Sistema
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
