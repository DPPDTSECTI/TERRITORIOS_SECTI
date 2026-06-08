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
        // Paleta Oficial do Governo da Bahia (Manual 2023)
        gov: {
          // Preto (B)
          black: '#000000', 
          
          // Vermelho (A)
          red: {
            100: '#fde8e9',
            500: '#E30613', // Cor exata do manual
            700: '#a3040e',
          },
          
          // Azul Escuro (H)
          blueDark: {
            100: '#e6f0fa',
            500: '#034991', // Cor exata do manual
            700: '#023468',
            900: '#011e3c',
          },
          
          // Amarelo (Letra i)
          yellow: {
            100: '#fffbf0',
            500: '#FCBE00', // Cor exata do manual
            700: '#b88b00',
          },
          
          // Magenta (Parte do A invertido)
          magenta: {
            100: '#fdedf9',
            500: '#E6007E', // Cor exata do manual
            700: '#a3005a',
          },
          
          // Verde (Parte do A invertido)
          green: {
            100: '#f4fbf0',
            500: '#95C11F', // Cor exata do manual
            700: '#6a8a16',
          },
          
          // Laranja (Parte do A invertido)
          orange: {
            100: '#fdf5f0',
            500: '#EF7D00', // Cor exata do manual
            700: '#b35e00',
          },
          
          // Azul Claro / Ciano (Triângulo interno do i)
          cyan: {
            100: '#eaf8f9',
            500: '#31B7BC', // Cor exata do manual
            700: '#238387',
          }
        },

        // Mantivemos as cores semânticas e de superfície
        kpi: {
          success: '#95C11F', // Usando o Verde do Gov para sucesso
          warning: '#FCBE00', // Usando o Amarelo do Gov para alerta
          danger: '#E30613',  // Usando o Vermelho do Gov para perigo/falha
          info: '#31B7BC',    // Usando o Ciano do Gov para informação
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
        'glass-hover': '0 12px 48px 0 rgba(3, 73, 145, 0.12)', // Sombra hover adaptada pro Azul Escuro do Gov
      }
    },
  },
  plugins: [],
}