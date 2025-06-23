import React, { createContext, useContext } from "react";
import { Theme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";

// Create a context for the theme
const ThemeContext = createContext<Theme | null>(null);

// Custom hook to use the theme
export const useOrbitalTheme = () => {
  const theme = useContext(ThemeContext);
  if (!theme) {
    // If no theme is provided, we'll just return undefined and let Material UI use its default theme
    return undefined;
  }
  return theme;
};

// Props for the ThemeProvider component
interface OrbitalThemeProviderProps {
  theme?: Theme;
  children: React.ReactNode;
}

// Theme provider component
export const OrbitalThemeProvider: React.FC<OrbitalThemeProviderProps> = ({
  theme,
  children,
}) => {
  // If a theme is provided, use it with the MUI ThemeProvider
  if (theme) {
    return (
      <ThemeContext.Provider value={theme}>
        <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
      </ThemeContext.Provider>
    );
  }

  // If no theme is provided, just render the children
  return <>{children}</>;
};
