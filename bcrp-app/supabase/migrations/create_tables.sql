-- Crear tabla para caché de indicadores
CREATE TABLE IF NOT EXISTS indicadores_cache (
  id SERIAL PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  datos JSONB NOT NULL,
  ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT pk_indicadores_cache_codigo UNIQUE (codigo)
);

-- Crear índice para búsquedas rápidas por código
CREATE INDEX IF NOT EXISTS idx_indicadores_cache_codigo ON indicadores_cache (codigo);

-- Crear función para crear la tabla de caché desde RPC
CREATE OR REPLACE FUNCTION crear_tabla_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar si la tabla ya existe
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'indicadores_cache'
  ) THEN
    -- Crear la tabla
    CREATE TABLE public.indicadores_cache (
      id SERIAL PRIMARY KEY,
      codigo TEXT NOT NULL UNIQUE,
      datos JSONB NOT NULL,
      ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT pk_indicadores_cache_codigo UNIQUE (codigo)
    );
    
    -- Crear índice
    CREATE INDEX idx_indicadores_cache_codigo ON public.indicadores_cache (codigo);
  END IF;
END;
$$; 