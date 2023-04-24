import { FC, PropsWithChildren } from "react";
import styled from "styled-components";

export const H1 = styled.h1`
  font-size: 92px;
`;

export const H2 = styled.h2`
  font-size: 56px;
`;

export const H3 = styled.h3`
  font-size: 34px;
`;

export const H4 = styled.h4`
  font-size: 50px;
  font-weight: 700;
  line-height: 150%;
  margin: 0;
`;

export const H6 = styled.h6`
  color: ${({ theme }) => theme.colors.secondary};
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 21px;
  margin: 0;
`;

export const H7 = styled.h6`
  font-size: 18px;
  font-weight: 400;
  margin: 0;
`;

export const Label = styled.span`
  font-size: 13px;
  line-height: 140%;
  letter-spacing: -0.008em;
  opacity: 0.4;
`;

export const SmallLabel = styled.span`
  font-weight: 400;
  font-size: 16px;
  color: ${({ theme }) => theme.colors.opaque};
`;

export const Paragraph2 = styled.div<{ align?: string }>`
  font-weight: 400;
  font-size: 16px;
  margin-bottom: 8px;
  ${({ align }) => align && `text-align: ${align};`}
`;
export const Paragraph = styled.p`
  font-weight: 400;
  font-size: 20px;
  line-height: 125%;
  margin: 0;
`;

interface TypographyProps extends PropsWithChildren {
  tag: keyof JSX.IntrinsicElements;
}

const Typography: FC<TypographyProps> = ({ tag: Tag = "p", children }) => {
  return <Tag>{children}</Tag>;
};

export default Typography;
