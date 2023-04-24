import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils.js";
import { ChangeEvent, FC, useCallback, useMemo, useState } from "react";
import styled from "styled-components";
import { useGameContext } from "../context/GameContext";
import { UnitOfTime } from "../utils/UnitOfTime";
import Amount from "./Amount";
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

const StyledFlowRate = styled.div`
  color: ${({ theme }) => theme.colors.primary};
  font-size: 18px;
  font-weight: 400;
`;

const NOOP = () => {};

interface StreamFormProps {
  isLoading: boolean;
  activeFlowRate?: string;
  onOpenStream: (flowRateWei: string) => void;
  onCancelStream: () => void;
}

const StreamForm: FC<StreamFormProps> = ({
  activeFlowRate,
  isLoading,
  onOpenStream,
  onCancelStream,
}) => {
  const [flowRateEther, setFlowRateEther] = useState("");

  const { armyFlowRate } = useGameContext();

  const onFlowRateChange = (e: ChangeEvent<HTMLInputElement>) =>
    setFlowRateEther(e.target.value);

  const onStartStream = useCallback(() => {
    const flowRateWei = BigNumber.from(parseEther(flowRateEther))
      .div(UnitOfTime.Day)
      .toString();

    onOpenStream(flowRateWei);
  }, [flowRateEther, onOpenStream]);

  const activeFlowRateWei = useMemo(() => {
    if (!activeFlowRate) return null;
    return BigNumber.from(activeFlowRate).mul(UnitOfTime.Day).toString();
  }, [activeFlowRate]);

  return (
    <>
      <div>
        <Paragraph2>Flow Rate</Paragraph2>
        <InputWrapper>
          {activeFlowRateWei ? (
            <StyledFlowRate>
              <Amount wei={activeFlowRateWei} />
            </StyledFlowRate>
          ) : (
            <StyledInput
              disabled={isLoading}
              value={flowRateEther}
              onChange={onFlowRateChange}
              placeholder="0.0"
            />
          )}
          <Divider />
          <SmallLabel>/ day</SmallLabel>
        </InputWrapper>
      </div>

      {armyFlowRate && (
        <Paragraph2 align="center">
          Price:{" "}
          <b>
            1 $CASH = <Amount wei={armyFlowRate.toString()} disableRounding />{" "}
            $ARMY
          </b>
        </Paragraph2>
      )}
      <PrimaryButton
        onClick={
          isLoading ? NOOP : activeFlowRate ? onCancelStream : onStartStream
        }
      >
        {isLoading
          ? "Loading..."
          : activeFlowRate
          ? "Cancel Stream"
          : "Send Stream"}
      </PrimaryButton>
    </>
  );
};

export default StreamForm;
