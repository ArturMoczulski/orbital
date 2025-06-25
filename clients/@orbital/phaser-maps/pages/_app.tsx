import "reflect-metadata";
import type { AppProps } from "next/app";
import { Provider } from "react-redux";
import { store } from "../store";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { StyledEngineProvider } from "@mui/styled-engine";
import { OrbitalThemeProvider } from "@orbital/react-ui";
import "../styles/global.css";

// Create the theme
const artilioTheme = createTheme({
  palette: {
    primary: { main: "rgba(175,168,136,1)" }, // #afa888
    secondary: { main: "rgba(197,118,89,1)" }, // #c57659
    background: {
      default: "rgba(25,29,69,1)", // #191d45
      paper: "rgba(0,0,0,0.85)",
    },
    text: {
      primary: "rgba(231,207,160,1)", // #e7cfa0
      secondary: "rgba(197,118,89,1)", // #c57659
    },
  },
  typography: {
    fontFamily: "'MedievalSharp', cursive",
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "rgba(25,29,69,1)", // #191d45
          color: "rgba(231,207,160,1)", // #e7cfa0
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          border: "2px solid",
          borderColor: "primary.main",
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
