import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FC } from "react";
import styled from "styled-components";
import PrimaryButton from "./PrimaryButton";
import Typography, { H1, H2, Paragraph } from "./Typography";

const StyledTitle = styled(H1)`
  margin: -8px 0 0;
`;

const ConnectLayout = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-image: url("/intro-bg.png");
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
`;

const ConnectCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  row-gap: 32px;

  margin-top: 25vh;
  max-width: 1020px;
  width: 100%;
  padding: 64px;

  align-self: center;
  background: linear-gradient(
    116.22deg,
    rgba(255, 255, 255, 0.2) 18.53%,
    rgba(255, 255, 255, 0) 107.05%
  );
  backdrop-filter: blur(2px);
  border-radius: 20px;
  text-align: center;

  h2 {
    margin: 0;
  }
`;

const ConnectionButton = styled(PrimaryButton)`
  max-width: 500px;
  width: 100%;
`;

interface ConnectViewProps {}

const ConnectView: FC<ConnectViewProps> = ({}) => {
  return (
    <ConnectLayout>
      <ConnectCard>
        <div>
          <H2>Become the</H2>
          <StyledTitle>King of a Hill</StyledTitle>
        </div>

        <Paragraph>
          Get ready to conquer the Hill and become the ultimate King. Collect
          taxes from other knights and reap the rewards, but watch out - the
          competition is fierce and only the strongest can reign supreme.
          <br />
          Join now and take on the challenge to become the King of the Hill!
        </Paragraph>

        <ConnectButton.Custom>
          {(connectButtonContext) => (
            <ConnectionButton onClick={connectButtonContext.openConnectModal}>
              Connect
            </ConnectionButton>
          )}
        </ConnectButton.Custom>
      </ConnectCard>
    </ConnectLayout>
  );
};

export default ConnectView;
