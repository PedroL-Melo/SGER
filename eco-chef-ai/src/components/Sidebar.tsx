'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ChefHat, 
  LayoutDashboard, 
  Users, 
  Package, 
  BrainCircuit, 
  Settings, 
  LogOut,
  Receipt
} from 'lucide-react';

const menuItems = [
  { name: 'Visão de Negócios', icon: LayoutDashboard, path: '/' },
  { name: 'Equipe e Custos', icon: Users, path: '/funcionarios' },
  { name: 'Estoque de Produtos', icon: Package, path: '/estoque' },
  { name: 'Relatórios', icon: Receipt, path: '/relatorios' },
  { name: 'IA Estratégica (Gemini)', icon: BrainCircuit, path: '/estrategia' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 bg-zinc-950 text-slate-300 min-h-screen flex flex-col fixed left-0 top-0 border-r border-zinc-900 z-50">
      <div className="p-6 flex items-center gap-3 border-b border-zinc-900/50">
        <div className="p-2 bg-emerald-500/10 rounded-xl">
          <ChefHat className="w-7 h-7 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">EcoChef AI</h2>
          <p className="text-xs text-zinc-500">Gestão Inteligente</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <p className="px-3 text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-4 mt-2">Menu Principal</p>
        
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-zinc-800 text-white shadow-sm' 
                  : 'hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-emerald-400'}`} />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}

        <p className="px-3 text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-4 mt-8">Configurações</p>
        <Link
          href="/configuracoes"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-zinc-900 hover:text-white group"
        >
          <Settings className="w-5 h-5 text-zinc-500 group-hover:text-zinc-400" />
          <span className="font-medium text-sm">Ajustes da Conta</span>
        </Link>
      </nav>

      <div className="p-4 border-t border-zinc-900/50">
        <Link
          href="/login"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 group"
        >
          <LogOut className="w-5 h-5 text-zinc-500 group-hover:text-red-400" />
          <span className="font-medium text-sm">Sair do Sistema</span>
        </Link>
      </div>
    </aside>
  );
}
