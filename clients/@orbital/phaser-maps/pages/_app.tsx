import "reflect-metadata";
import type { AppProps } from "next/app";
import { Provider } from "react-redux";
import { store } from "../store";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import "../styles/global.css";

const artilioTheme = createTheme({
  palette: {
    primary: {
      main: "#3366cc",
    },
    secondary: {
      main: "#4caf50",
    },
    background: {
      default: "#f4f4f4",
      paper: "#ffffff",
    },
    text: {
      primary: "#333333",
      secondary: "#757575",
    },
  },
  typography: {
    fontFamily: "'MedievalSharp', sans-serif",
  },
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={artilioTheme}>
      <CssBaseline />
      <Provider store={store}>
        <Component {...pageProps} />
      </Provider>
    </ThemeProvider>
  );
}

export default MyApp;
