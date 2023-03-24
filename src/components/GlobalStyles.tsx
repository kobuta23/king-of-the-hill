import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  html,
  body {
    color: ${({ theme }) => theme.colors.primary};
    padding: 0;
    margin: 0;
    font-family: ${({ theme }) => theme.font.main};
    background: ${({ theme }) => theme.colors.background};
  }

  h1,
  h2,
  h3 {
    font-family: ${({ theme }) => theme.font.title};
    font-weight: 400;
    margin: 0;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  b {
    font-weight: 500;
  }

  button {
    font-family: ${({ theme }) => theme.font.main};
    color: ${({ theme }) => theme.colors.primary};
    background: none;
    color: inherit;
    border: none;
    padding: 0;
    font: inherit;
    cursor: pointer;
    outline: inherit;
  }

  * {
    box-sizing: border-box;
  }
`;

export default GlobalStyle;
