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
        // SvaraRx design system — aligned with DESIGN.md
        green: {
          DEFAULT: "#9fe870",
          hover: "#cdffad",
          pale: "#e2f6d5",
          neutral: "#c5edab",
        },
        ink: {
          DEFAULT: "#0e0f0c",
          deep: "#163300",
        },
        canvas: {
          DEFAULT: "#ffffff",
          soft: "#e8ebe6",
        },
        body: "#454745",
        mute: "#868685",
        positive: {
          DEFAULT: "#2ead4b",
          deep: "#054d28",
        },
        warning: {
          DEFAULT: "#ffd11a",
          deep: "#b86700",
          content: "#4a3b1c",
        },
        negative: {
          DEFAULT: "#d03238",
          deep: "#a72027",
          bg: "#320707",
        },
        // shadcn/ui semantic tokens
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        pill: "9999px",
        lgShadcn: "var(--radius)",
        mdShadcn: "calc(var(--radius) - 2px)",
        smShadcn: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      keyframes: {
        wave: {
          "0%, 100%": { transform: "scaleY(0.4)" },
          "50%": { transform: "scaleY(1)" },
        },
        pulse_dot: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
        recpulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(208,50,56,0.4)" },
          "50%": { boxShadow: "0 0 0 12px rgba(208,50,56,0)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-6px)" },
          "40%, 80%": { transform: "translateX(6px)" },
        },
      },
      animation: {
        wave: "wave 1.2s ease-in-out infinite",
        pulse_dot: "pulse_dot 2s ease-in-out infinite",
        recpulse: "recpulse 1s ease-in-out infinite",
        shake: "shake 0.45s ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;
