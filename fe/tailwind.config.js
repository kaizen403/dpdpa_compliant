/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Pandawa theme colors
                primary: {
                    50: '#fdf8f6',
                    100: '#f9ebe5',
                    200: '#f0d4c8',
                    300: '#e5b8a6',
                    400: '#d69578',
                    500: '#c67654',
                    600: '#a85d3d',
                    700: '#8a4a32',
                    800: '#6d3a28',
                    900: '#411E10', // Main primary color
                    950: '#2a1309',
                },
                // Electric blue accent
                accent: {
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    300: '#a5b4fc',
                    400: '#818cf8',
                    500: '#6366f1',
                    600: '#0000EE', // Main accent color
                    700: '#0000CC',
                    800: '#0000AA',
                    900: '#000088',
                    950: '#000066',
                },
                // Background colors for dark theme
                dark: {
                    50: '#1a1a1a',
                    100: '#141414',
                    200: '#0f0f0f',
                    300: '#0a0a0a',
                    400: '#050505',
                    500: '#020202', // Main background
                    600: '#000000',
                },
                // Data category colors
                identity: '#6366f1',
                contact: '#10b981',
                financial: '#f59e0b',
                usage: '#a855f7',
                activity: '#ec4899',
                sensitive: '#ef4444',
            },
            fontFamily: {
                sans: ['Public Sans', 'system-ui', 'sans-serif'],
                heading: ['Libre Caslon Condensed', 'Georgia', 'serif'],
                mono: ['Roboto Mono', 'Consolas', 'monospace'],
            },
            fontSize: {
                'display-1': ['72px', { lineHeight: '1.1', fontWeight: '700' }],
                'display-2': ['56px', { lineHeight: '1.15', fontWeight: '600' }],
                'body-sm': ['12px', { lineHeight: '1.6' }],
            },
            borderRadius: {
                'none': '0px',
                'button': '14px',
            },
            boxShadow: {
                'button': 'rgba(0, 0, 0, 0.11) 0px 0.361312px 0.505837px -0.75px, rgba(0, 0, 0, 0.12) 0px 1.37312px 1.92237px -1.5px, rgba(0, 0, 0, 0.14) 0px 6px 8.4px -2.25px',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                glow: {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(0, 0, 238, 0.3)' },
                    '50%': { boxShadow: '0 0 40px rgba(0, 0, 238, 0.6)' },
                },
            },
        },
    },
    plugins: [],
};
