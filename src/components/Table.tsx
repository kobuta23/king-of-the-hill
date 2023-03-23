import styled from "styled-components";

export const TH = styled.th<{ align?: string; width?: string }>`
  color: ${({ theme }) => theme.colors.tableHead};
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 21px;
  margin: 0;
  padding: 20px 12px;
  ${({ align }) => align && `text-align: ${align};`}
  ${({ width }) => width && `width: ${width};`}
`;

export const TD = styled.td<{ align?: string }>`
  font-style: normal;
  font-weight: 400;
  font-size: 18px;
  padding: 12px;
  ${({ align }) => align && `text-align: ${align};`}
`;

export const Table = styled.table`
  width: 100%;
`;
