import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils.js";
import { ChangeEvent, FC, useCallback, useState } from "react";
import styled from "styled-components";
import { UnitOfTime } from "../utils/UnitOfTime";
import Paper from "./Paper";
import PrimaryButton from "./PrimaryButton";
import { Paragraph2, SmallLabel } from "./Typography";

const InputWrapper = styled(Paper)`
  display: grid;
  grid-template-columns: 2fr 41px 1fr;
  align-items: center;
  padding: 18px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.smallPaperBg};
  height: 60px;
`;

const Divider = styled.div`
  background: ${({ theme }) => theme.colors.delimiter};
  width: 1px;
  height: 60px;
  margin: -18px 20px;
`;

const StyledInput = styled.input`
  background: initial;
  border: initial;
  outline: initial;
  box-shadow: initial;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 18px;
  font-weight: 400;
`;

interface SendStreamFormProps {
  isLoading: boolean;
  onSubmit: (flowRateWei: string) => void;
}

const SendStreamForm: FC<SendStreamFormProps> = ({ isLoading, onSubmit }) => {
  const [flowRateEther, setFlowRateEther] = useState("");

  const onFlowRateChange = (e: ChangeEvent<HTMLInputElement>) =>
    setFlowRateEther(e.target.value);

  const onStartStream = useCallback(() => {
    const flowRateWei = BigNumber.from(parseEther(flowRateEther))
      .div(UnitOfTime.Day)
      .toString();

    onSubmit(flowRateWei);
  }, [flowRateEther, onSubmit]);

  return (
    <>
      <div>
        <Paragraph2>Flow Rate</Paragraph2>
        <InputWrapper>
          <StyledInput
            disabled={isLoading}
            value={flowRateEther}
            onChange={onFlowRateChange}
            placeholder="0.0"
          />
          <Divider />
          <SmallLabel>/ day</SmallLabel>
        </InputWrapper>
      </div>

      <Paragraph2 align="center">
        Price: <b>1 $CASH = 1 $ARMY</b>
      </Paragraph2>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <PrimaryButton onClick={onStartStream}>Send Stream</PrimaryButton>
      )}
    </>
  );
};

export default SendStreamForm;
