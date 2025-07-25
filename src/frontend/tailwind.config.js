/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#A259FF',
          50: '#F5F0FF',
          100: '#EBE1FF',
          200: '#D7C3FF',
          300: '#C3A5FF',
          400: '#B287FF',
          500: '#A259FF',
          600: '#8E3BFF',
          700: '#7A1DFF',
          800: '#6600FF',
          900: '#5200CC',
        },
        secondary: {
          DEFAULT: '#111111',
          50: '#F8F8F8',
          100: '#E0E0E0',
          200: '#C6C6C6',
          300: '#ACACAC',
          400: '#919191',
          500: '#777777',
          600: '#5D5D5D',
          700: '#434343',
          800: '#292929',
          900: '#111111',
        },
        background: {
          DEFAULT: '#000000',
          light: '#121212',
          card: '#1E1E1E',
          input: '#2A2A2A',
        },
        text: {
          DEFAULT: '#FFFFFF',
          secondary: '#CCCCCC',
          muted: '#999999',
        },
        accent: {
          DEFAULT: '#A259FF',
          hover: '#B287FF',
          pressed: '#8E3BFF',
        },
        success: '#00CC99',
        warning: '#FFCC00',
        error: '#FF3B30',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(162, 89, 255, 0.5)',
      },
    },
  },
  plugins: [],
}; 