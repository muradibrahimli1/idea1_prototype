import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef0ff",
          100: "#e2dfff",
          300: "#7464ea",
          400: "#3f29e6",
          500: "#3622c4",
        },
      },
    },
  },
  plugins: [],
};

export default config;
