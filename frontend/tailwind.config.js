/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Duolingo green — primary action + correct/success ──────────────
        primary: {
          50:  '#f7fef0',
          100: '#DDF4B7',
          200: '#b8ec6e',
          300: '#8ddc3a',
          400: '#74d020',
          500: '#58CC02',
          600: '#46A302',
          700: '#358201',
          800: '#276100',
          900: '#1a4500',
        },
        // brand mirrors primary (keeps all bg-brand-* JSX classes working)
        brand: {
          50:  '#f7fef0',
          100: '#DDF4B7',
          200: '#b8ec6e',
          300: '#8ddc3a',
          400: '#74d020',
          500: '#58CC02',
          600: '#46A302',
          700: '#358201',
          800: '#276100',
          900: '#1a4500',
        },
        // ── Duolingo blue — secondary / info ───────────────────────────────
        accent: {
          50:  '#e3f4fe',
          100: '#DDF4FE',
          200: '#a7dcfb',
          300: '#72c5f7',
          400: '#3dbbf7',
          500: '#1CB0F6',
          600: '#14A0E6',
          700: '#0E8FC7',
          800: '#0b70a0',
          900: '#053d5a',
        },
        // ── Semantic neutrals ──────────────────────────────────────────────
        ink:     '#3C3C3C',
        canvas:  '#FFFFFF',
        surface: '#F7F7F7',
        // ── Status ─────────────────────────────────────────────────────────
        danger:  '#FF4B4B',
        warning: '#FFC800',
      },
      fontFamily: {
        sans:    ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-8deg)' },
          '50%':      { transform: 'rotate(8deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        'bounce-in': {
          '0%':   { transform: 'scale(0.3)', opacity: '0' },
          '50%':  { transform: 'scale(1.05)', opacity: '0.8' },
          '70%':  { transform: 'scale(0.9)', opacity: '0.9' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'slide-up': {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'pulse-ring': {
          '0%':   { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
        'xp-pop': {
          '0%':   { transform: 'scale(0) translateY(0)', opacity: '1' },
          '50%':  { transform: 'scale(1.2) translateY(-20px)', opacity: '1' },
          '100%': { transform: 'scale(1) translateY(-40px)', opacity: '0' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        nod: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%':      { transform: 'rotate(-5deg)' },
          '75%':      { transform: 'rotate(5deg)' },
        },
        tilt: {
          '0%, 100%': { transform: 'rotate(-15deg)' },
          '50%':      { transform: 'rotate(15deg)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%':      { transform: 'translateX(-6px)' },
          '40%':      { transform: 'translateX(6px)' },
          '60%':      { transform: 'translateX(-4px)' },
          '80%':      { transform: 'translateX(4px)' },
        },
        'correct-flash': {
          '0%':   { transform: 'scale(1)' },
          '40%':  { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        wiggle:          'wiggle 0.5s ease-in-out infinite',
        float:           'float 3s ease-in-out infinite',
        'bounce-in':     'bounce-in 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        'slide-up':      'slide-up 0.4s ease-out',
        'pulse-ring':    'pulse-ring 1.5s ease-out infinite',
        'xp-pop':        'xp-pop 1s ease-out forwards',
        shimmer:         'shimmer 2s infinite linear',
        nod:             'nod 1s ease-in-out infinite',
        tilt:            'tilt 2s ease-in-out infinite',
        shake:           'shake 0.4s ease-in-out',
        'correct-flash': 'correct-flash 0.25s ease-out',
      },
      boxShadow: {
        // Duolingo-style 4px solid bottom shadows (no floaty drops)
        'brand':         '0 4px 0 #46A302',
        'brand-lg':      '0 4px 0 #46A302',
        'primary':       '0 4px 0 #46A302',
        'accent':        '0 4px 0 #0E8FC7',
        'duo-secondary': '0 4px 0 #0E8FC7',
        'duo-error':     '0 4px 0 #D63333',
        'duo-reward':    '0 4px 0 #E0A500',
        // Flat cards — no drop shadow
        'card':          'none',
        'card-hover':    'none',
      },
    },
  },
  plugins: [],
}
