import styled, { keyframes } from "styled-components";

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

const PrimaryButton = styled.button`
  font-weight: 500;
  font-size: 20px;
  line-height: 23px;
  border-radius: 100px;
  padding: 16px;
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
`;

export default PrimaryButton;
