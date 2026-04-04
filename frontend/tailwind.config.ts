import type { Config } from 'tailwindcss';

export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                background: {
                    DEFAULT: '#0f172a', // Deep navy
                    secondary: '#1e293b', // Charcoal
                },
                accent: {
                    DEFAULT: '#10b981', // Emerald green
                    hover: '#059669',
                },
            },
            fontFamily: {
                sans: ['"DM Sans"', 'sans-serif'],
                heading: ['Syne', 'sans-serif'],
            },
        },
    },
    plugins: [],
} satisfies Config;
