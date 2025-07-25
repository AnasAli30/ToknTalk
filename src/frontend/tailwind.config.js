/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Modern theme colors
        'background': {
          DEFAULT: 'hsl(var(--background))',
          'card': 'hsl(var(--background-card))',
          'light': 'hsl(var(--background-light))',
          'input': 'hsl(var(--background-input))',
        },
        'text': {
          DEFAULT: 'hsl(var(--text))',
          'secondary': 'hsl(var(--text-secondary))',
          'muted': 'hsl(var(--text-muted))',
        },
        'primary': {
          DEFAULT: 'hsl(var(--primary))',
          'foreground': 'hsl(var(--primary-foreground))',
          50: 'hsl(var(--primary-50))',
          100: 'hsl(var(--primary-100))',
          200: 'hsl(var(--primary-200))',
          300: 'hsl(var(--primary-300))',
          400: 'hsl(var(--primary-400))',
          500: 'hsl(var(--primary-500))',
          600: 'hsl(var(--primary-600))',
          700: 'hsl(var(--primary-700))',
          800: 'hsl(var(--primary-800))',
          900: 'hsl(var(--primary-900))',
        },
        'secondary': {
          DEFAULT: 'hsl(var(--secondary))',
          'foreground': 'hsl(var(--secondary-foreground))',
          50: 'hsl(var(--secondary-50))',
          100: 'hsl(var(--secondary-100))',
          200: 'hsl(var(--secondary-200))',
          300: 'hsl(var(--secondary-300))',
          400: 'hsl(var(--secondary-400))',
          500: 'hsl(var(--secondary-500))',
          600: 'hsl(var(--secondary-600))',
          700: 'hsl(var(--secondary-700))',
          800: 'hsl(var(--secondary-800))',
          900: 'hsl(var(--secondary-900))',
        },
        'accent': {
          DEFAULT: 'hsl(var(--accent))',
          'foreground': 'hsl(var(--accent-foreground))',
          50: 'hsl(var(--accent-50))',
          100: 'hsl(var(--accent-100))',
          200: 'hsl(var(--accent-200))',
          300: 'hsl(var(--accent-300))',
          400: 'hsl(var(--accent-400))',
          500: 'hsl(var(--accent-500))',
          600: 'hsl(var(--accent-600))',
          700: 'hsl(var(--accent-700))',
          800: 'hsl(var(--accent-800))',
          900: 'hsl(var(--accent-900))',
        },
        'success': {
          DEFAULT: 'hsl(var(--success))',
          'foreground': 'hsl(var(--success-foreground))',
        },
        'warning': {
          DEFAULT: 'hsl(var(--warning))',
          'foreground': 'hsl(var(--warning-foreground))',
        },
        'error': {
          DEFAULT: 'hsl(var(--error))',
          'foreground': 'hsl(var(--error-foreground))',
        },
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'glow': '0 0 20px hsla(var(--accent), 0.3)',
        'glow-lg': '0 0 40px hsla(var(--accent), 0.4)',
        'neon': '0 0 10px hsla(var(--accent), 0.5)',
        'neon-lg': '0 0 20px hsla(var(--accent), 0.6)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px hsla(var(--accent), 0.3)' },
          '50%': { boxShadow: '0 0 40px hsla(var(--accent), 0.6)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200px 0' },
          '100%': { backgroundPosition: 'calc(200px + 100%) 0' },
        },
        'fadeIn': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slideUp': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slideDown': {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scaleIn': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      backgroundImage: {
        'gradient': 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
        'accent-gradient': 'linear-gradient(45deg, hsl(var(--accent)), hsl(var(--accent-600)))',
      },
    },
  },
  plugins: [],
} 