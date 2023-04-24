import type { AppProps } from "next/app";
import { DefaultTheme, ThemeProvider } from "styled-components";
import GlobalStyle from "../components/GlobalStyles";
import WagmiManager, {
  RainbowKitManager,
} from "../components/Wallet/WagmiProvider";
import GameContextProvider from "../context/GameContext";
import ReduxProvider from "../redux/ReduxProvider";

const theme: DefaultTheme = {
  font: {
    main: `'Roboto', sans-serif`,
    title: `'Righteous', cursive`,
  },
  colors: {
    primary: "#fff",
    secondary: "#C6BFEA",
    background: "#010021",
    border: "#544987",
    opaque: "#ABA4CE",
    delimiter: "#544987",
    smallPaperBg: "#2E2556",
  },
  layout: {
    width: "1600px",
  },
};

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiManager>
      <ReduxProvider>
        <RainbowKitManager>
          <GameContextProvider>
            <ThemeProvider theme={theme}>
              <GlobalStyle />
              <Component {...pageProps} />
            </ThemeProvider>
          </GameContextProvider>
        </RainbowKitManager>
      </ReduxProvider>
    </WagmiManager>
  );
}
