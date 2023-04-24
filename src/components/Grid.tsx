import styled from "styled-components";

interface GridProps {
  columns?: string;
  rows?: string;
  areas?: string;
  gap?: string;
  align?: string;
  justify?: string;
}

const Grid = styled.div<GridProps>`
  width: 100%;
  display: grid;
  ${({ columns }) => columns && `grid-template-columns: ${columns};`}
  ${({ rows }) => rows && `grid-template-rows: ${rows};`}
  ${({ areas }) => areas && `grid-template-areas: ${areas};`}
  ${({ align }) => align && `align-items: ${align};`}
  ${({ justify }) => justify && `justify-content: ${justify};`}
  ${({ gap }) => gap && `grid-gap: ${gap};`}
`;

export default Grid;
