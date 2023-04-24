import { FC, PropsWithChildren } from "react";
import styled, { css, keyframes } from "styled-components";

const GradientAnimation = keyframes`
	0% {
		background-position: 0% 50%;
	}
	50% {
		background-position: 100% 50%;
	}
	100% {
		background-position: 0% 50%;
	}
`;

const StyledPrimaryButton = styled.button<{
  disabled?: boolean;
  isLoading?: boolean;
}>`
  font-weight: 500;
  font-size: 20px;
  line-height: 23px;
  border-radius: 100px;
  padding: 16px;

  ${({ isLoading }) =>
    isLoading &&
    css`
      cursor: initial;
    `}

  ${({ disabled }) =>
    !disabled &&
    css`
      background: linear-gradient(
        45deg,
        #162beb 0%,
        #9639c2 23%,
        #9639c2 27%,
        #162beb 50%,
        #9639c2 73%,
        #9639c2 77%,
        #162beb 100%
      );
      background-size: 300% 300%;
      animation: ${GradientAnimation} 15s ease infinite;
    `}

  ${({ disabled, theme }) =>
    disabled &&
    css`
      cursor: initial;
      font-size: 18px;
      background: ${theme.colors.border};
      font-weight: 400;
    `}
`;

interface PrimaryButtonProps extends PropsWithChildren {
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

const noop = () => {};

const PrimaryButton: FC<PrimaryButtonProps> = ({
  onClick,
  disabled,
  isLoading,
  children,
  className,
}) => {
  return (
    <StyledPrimaryButton
      className={className}
      onClick={isLoading ? noop : onClick}
      isLoading={isLoading}
      disabled={disabled}
    >
      {isLoading ? "Loading..." : children}
    </StyledPrimaryButton>
  );
};
export default PrimaryButton;
