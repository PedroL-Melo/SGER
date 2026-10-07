# EcoChef AI (SGER) 🍳🤖

> **Sistema de Gestão Estratégica de Restaurantes**
> Uma plataforma SaaS inteligente para micro e pequenos negócios do ramo alimentício.

O **EcoChef AI** revoluciona a forma como pequenos empreendedores (de vendedores de cookies em universidades a donos de restaurantes) gerenciam suas finanças. Em vez de planilhas complexas, o sistema utiliza Inteligência Artificial para interpretar relatos do dia a dia (em linguagem natural) e convertê-los automaticamente em dados financeiros estruturados.

---

## ✨ Principais Funcionalidades

- **🎙️ Lançamento via Linguagem Natural:** O empreendedor digita como se estivesse mandando uma mensagem no WhatsApp ("*Comprei 5kg de farinha por R$ 25 e vendi 30 cookies por R$ 150*") e a IA categoriza receitas e despesas automaticamente.
- **🧠 Consultor Financeiro de Bolso:** Um chat com IA que tem acesso aos dados da sua empresa (Estoque, Folha de Pagamento e Faturamento) para calcular *Ponto de Equilíbrio*, *Margem de Lucro*, sugerir precificação e cortes de desperdício na hora.
- **👥 Gestão Avançada de RH:** Cadastro de funcionários/freelancers, com cálculo automático de custo efetivo (salário + benefícios + provisões/encargos baseados no regime de contratação) e alertas de ocorrências.
- **📊 Dashboard Consolidado:** Gráficos em tempo real mostrando a curva de faturamento vs. lucro líquido, saúde do CMV (Custo de Mercadoria Vendida) e evolução operacional.
- **🏢 Multi-tenancy (SaaS):** Sistema robusto de isolamento de dados com Autenticação e Row Level Security (RLS) no banco de dados. Um restaurante jamais acessa os dados do outro.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS, Lucide Icons, Recharts, KaTeX (para renderização de fórmulas matemáticas da IA).
- **Backend/DB:** Supabase (PostgreSQL, Authentication, Row Level Security).
- **Inteligência Artificial:** Groq API (InfeRência ultra-rápida), Vercel AI SDK, Modelos Open-Source de alta performance (compatibilidade Llama3 / GPT-OSS).

---

## 🔒 Segurança e Privacidade

Este projeto foi construído seguindo as melhores práticas de segurança de aplicações web:
- **Zero Leakage:** Nenhuma chave de API (Groq, Supabase) está exposta no código-fonte. Tudo é gerenciado via variáveis de ambiente seguras (`.env.local` adicionado ao `.gitignore`).
- **Data Isolation:** O banco de dados PostgreSQL utiliza políticas estritas de **Row Level Security (RLS)**. As ações de `SELECT`, `INSERT`, `UPDATE` e `DELETE` são limitadas e validadas criptograficamente pelo `user_id` e o token JWT (Supabase Auth) da sessão ativa.

---

## 🚀 Como Executar Localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/PedroL-Melo/SGER.git
   ```
2. Instale as dependências:
   ```bash
   cd eco-chef-ai
   npm install
   ```
3. Configure as variáveis de ambiente:
   Crie um arquivo `.env.local` na pasta raiz do projeto (`eco-chef-ai`) e insira as chaves do Supabase e Groq.
   ```env
   NEXT_PUBLIC_SUPABASE_URL=seu-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
   GROQ_API_KEY=sua-api-key
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
5. Acesse `http://localhost:3000` no seu navegador.
