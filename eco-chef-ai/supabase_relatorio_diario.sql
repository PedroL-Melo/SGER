-- Tabela: relatorio_diario
CREATE TABLE IF NOT EXISTS public.relatorio_diario (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    data_referencia DATE NOT NULL DEFAULT CURRENT_DATE,
    texto_original TEXT NOT NULL,
    vendas_total NUMERIC(10, 2) DEFAULT 0.00,
    clientes_atendidos INTEGER DEFAULT 0,
    resumo_ia TEXT NOT NULL,
    ocorrencias JSONB DEFAULT '[]'::jsonb, -- Array de strings ou objetos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS e criar política aberta para MVP
ALTER TABLE public.relatorio_diario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for anon users" ON public.relatorio_diario FOR ALL USING (true);
