/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    './*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Escala principal de Tecnologia/Governo
        secti: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e', // Sua cor âncora
          900: '#134e4a',
        },
        // Escala de Destaque/Inovação
        inovacao: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
        },
        // Escala Semântica para KPIs
        kpi: {
          success: '#10b981', // Verde esmeralda para métricas positivas
          warning: '#f59e0b', // Âmbar
          danger: '#ef4444',  // Vermelho para pontos de atenção/falhas
          info: '#3b82f6',    // Azul claro
        },
        surface: {
          bg: '#f8fafc',
          card: 'rgba(255, 255, 255, 0.95)', // Fundo de card levemente translúcido
          border: '#e2e8f0',
        }
      },
      boxShadow: {
        // Sombras suaves e modernas para cards
        'glass': '0 8px 32px 0 rgba(15, 23, 42, 0.05)',
        'glass-hover': '0 12px 48px 0 rgba(15, 118, 110, 0.12)',
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    './*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Substitui a fonte sem serifa padrão (font-sans) pela Roboto Flex
        sans: ['"Roboto Flex"', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        // Cria uma classe nova específica para os títulos (font-display)
        display: ['Righteous', 'cursive'],
      },
      colors: {
        // ... (suas cores da SECTI e Inovação continuam aqui)
        secti: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          900: '#134e4a',
        },
        inovacao: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
        },
        surface: {
          bg: '#f8fafc',
          card: 'rgba(255, 255, 255, 0.95)',
          border: '#e2e8f0',
        }
      }
    },
  },
  plugins: [],
}
