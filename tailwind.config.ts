import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'selector',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
       
      },
      colors:{
        "black":'#0f172a',
        "black-bg":'#1f293a',
        "black-icon":'#65758b',
        "theme":'#39bcf8',
      }
    },
    screens:{
      sm:'575px',
      md:'767px',
      lg:'992px',
      xl:'1200px',
    },
  },
  plugins: [],
};
export default config;
