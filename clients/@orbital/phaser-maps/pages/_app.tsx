import "reflect-metadata";
import type { AppProps } from "next/app";
import { Provider } from "react-redux";
import { store } from "../store";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  StyledEngineProvider,
} from "@mui/material";
import { OrbitalThemeProvider } from "@orbital/react-ui";
import "../styles/global.css";

// Create the theme
const artilioTheme = createTheme({
  palette: {
    primary: { main: "#afa888" },
    secondary: { main: "#c57659" },
    background: { default: "#191d45", paper: "rgba(0, 0, 0, 0.85)" },
    text: { primary: "#e7cfa0", secondary: "#c57659" },
  },
  typography: {
    fontFamily: "'MedievalSharp', cursive",
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#191d45",
          color: "#e7cfa0",
        },
      },
    },
  },
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={artilioTheme}>
        <CssBaseline />
        <Provider store={store}>
          {/* @ts-expect-error Theme type incompatibility between packages */}
          <OrbitalThemeProvider theme={artilioTheme}>
            <Component {...pageProps} />
          </OrbitalThemeProvider>
        </Provider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

export default MyApp;
