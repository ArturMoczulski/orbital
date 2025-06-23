import "reflect-metadata";
import type { AppProps } from "next/app";
import { Provider } from "react-redux";
import { store } from "../store";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import "../styles/global.css";

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
