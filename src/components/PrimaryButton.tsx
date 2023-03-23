import { FC, PropsWithChildren } from "react";

interface PrimaryButtonProps extends PropsWithChildren {
  onClick?: () => void;
}

const PrimaryButton: FC<PrimaryButtonProps> = ({ onClick, children }) => {
  return <button onClick={onClick}>{children}</button>;
};

export default PrimaryButton;
