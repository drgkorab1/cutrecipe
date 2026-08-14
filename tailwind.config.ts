import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design tokens — §5
        bg: '#FBF7F1',
        card: '#FFFFFF',
        ink: '#1E1B18',
        muted: '#6E655C',
        line: '#E7DFD4',
        accent: '#C0532A',
        'accent-soft': '#F6E7DE',
        'brand-green': '#3F6B4A',
      },
      fontFamily: {
        serif: ['var(--font-fraunces)', 'Georgia', '"Times New Roman"', 'serif'],
      },
      borderRadius: {
        btn: '11px',
        card: '16px',
        recipe: '20px',
        pill: '99px',
      },
      maxWidth: {
        page: '1080px',
        recipe: '820px',
      },
      boxShadow: {
        card: '0 2px 16px 0 rgba(30,27,24,0.06)',
        input: '0 4px 32px 0 rgba(192,83,42,0.10)',
      },
    },
  },
  plugins: [],
}

export default config
