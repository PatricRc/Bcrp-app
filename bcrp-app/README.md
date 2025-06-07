# App de Análisis Macroeconómico BCRP

Aplicación web para el análisis y visualización de indicadores macroeconómicos del Banco Central de Reserva del Perú (BCRP), utilizando inteligencia artificial para generar análisis automáticos.

## Características

- **Dashboard**: Visualización de indicadores económicos clave en tiempo real
- **Explorador**: Selección y análisis detallado de indicadores por categoría (Diario, Mensual, Anual)
- **Chatbot de IA**: Asistente virtual para consultas sobre economía peruana, potenciado por Gemini API
- **Playground**: Herramienta de análisis avanzado para comparar indicadores y generar análisis con IA
- **Exportación**: Descarga de datos, análisis y conversaciones en PDF o CSV

## Tecnologías Utilizadas

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Gráficos**: Recharts
- **IA**: Google Gemini API
- **API de Datos**: BCRP API (estadisticas.bcrp.gob.pe)
- **Exportación**: jsPDF

## Requisitos

- Node.js 18.x o superior
- Clave API de Google AI (Gemini API)

## Instalación

1. Clonar el repositorio:
   ```
   git clone https://github.com/tu-usuario/bcrp-app.git
   cd bcrp-app
   ```

2. Instalar dependencias:
   ```
   npm install
   ```

3. Configurar variables de entorno:
   - Copiar el archivo `.env.local.example` a `.env.local`
   - Añadir la clave API de Gemini API
   ```
   GEMINI_API_KEY=tu_clave_aqui
   ```

4. Iniciar la aplicación en modo desarrollo:
   ```
   npm run dev
   ```

## Uso

La aplicación estará disponible en `http://localhost:3000`. Desde allí podrás:

- Ver el dashboard de indicadores económicos
- Explorar y analizar indicadores por categoría
- Interactuar con el asistente virtual para consultas
- Utilizar el playground para comparar indicadores y generar análisis automáticos

## Estructura del Proyecto

```
bcrp-app/
├── app/                  # Páginas y rutas de la aplicación
├── components/           # Componentes reutilizables
├── lib/                  # Utilidades, tipos y servicios
│   ├── constants.ts      # Constantes y configuración
│   ├── types.ts          # Tipos de TypeScript
│   ├── utils.ts          # Funciones de utilidad
│   └── services/         # Servicios para APIs externas
├── public/               # Archivos estáticos
└── ...                   # Archivos de configuración
```

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo LICENSE para más detalles.

---

Creado por el equipo de desarrollo para aplicaciones de análisis económico.

© 2024
