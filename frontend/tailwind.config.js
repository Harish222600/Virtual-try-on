/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                primary: '#000000',
                secondary: '#FFFFFF',
                accent: '#D4AF37', // Gold
                gray: {
                    50: '#F9FAFB',
                    100: '#F3F4F6',
                    200: '#E5E7EB',
                    500: '#6B7280',
                    800: '#1F2937',
                    900: '#111827',
                }
            }
        },
    },
    plugins: [],
}
