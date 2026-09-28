-- Tabela: funcionarios
CREATE TABLE IF NOT EXISTS public.funcionarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    cargo TEXT NOT NULL,
    salario_base NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela: relatorio_financeiro
CREATE TABLE IF NOT EXISTS public.relatorio_financeiro (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mes DATE NOT NULL, -- Recomenda-se armazenar o primeiro dia do mês (ex: 2026-09-01)
    faturamento NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    lucro_liquido NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    custo_operacional NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security) opcionalmente para segurança
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorio_financeiro ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso abertas para o MVP (Permite leitura e escrita anônima caso a chave Anon seja usada direto)
-- IMPORTANTE: Em produção, ajuste essas regras!
CREATE POLICY "Enable all for anon users" ON public.funcionarios FOR ALL USING (true);
CREATE POLICY "Enable all for anon users" ON public.relatorio_financeiro FOR ALL USING (true);
