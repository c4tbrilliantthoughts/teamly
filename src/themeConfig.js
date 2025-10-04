// themeConfig.js - adapted to use CSS variables from Vercel globals
const themeConfig = {
  light: {
    background: "var(--background)",
    bubbleUser: "var(--primary)",
    bubbleBot: "var(--card)",
    textUser: "var(--primary-foreground)",
    textBot: "var(--card-foreground)",
    buttonPrimary: "var(--primary)",
    buttonDanger: "var(--destructive)",
    suggestionButton: "var(--muted)",
    suggestionText: "var(--muted-foreground)",
  },
  dark: {
    background: "var(--background)",
    bubbleUser: "var(--primary)",
    bubbleBot: "var(--card)",
    textUser: "var(--primary-foreground)",
    textBot: "var(--card-foreground)",
    buttonPrimary: "var(--primary)",
    buttonDanger: "var(--destructive)",
    suggestionButton: "var(--muted)",
    suggestionText: "var(--muted-foreground)",
  },
};

export default themeConfig;
