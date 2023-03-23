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
      tableHead: string;
      delimiter: string;
    };
    layout: {
      width: string;
    };
  }
}
