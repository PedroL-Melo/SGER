-- Tabela: estoque
CREATE TABLE IF NOT EXISTS public.estoque (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome_insumo TEXT NOT NULL,
    categoria TEXT NOT NULL,
    quantidade NUMERIC(10, 2) NOT NULL DEFAULT 0,
    unidade TEXT NOT NULL, -- Ex: kg, litros, unidades, pacotes
    custo_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS e criar política aberta para MVP
ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for anon users" ON public.estoque FOR ALL USING (true);
