import "styled-components";

declare module "styled-components" {
  export interface DefaultTheme {
    font: {
      main: string;
      title: string;
    };
    colors: {
      primary: string;
      secondary: string;
      background: string;
      border: string;
      opaque: string;
      delimiter: string;
      smallPaperBg: string;
    };
    layout: {
      width: string;
    };
  }
}
