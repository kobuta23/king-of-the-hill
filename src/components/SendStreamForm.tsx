import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils.js";
import { ChangeEvent, FC, useCallback, useState } from "react";
import { UnitOfTime } from "../utils/UnitOfTime";
import PrimaryButton from "./PrimaryButton";

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
    <div>
      <input
        disabled={isLoading}
        value={flowRateEther}
        onChange={onFlowRateChange}
        placeholder="0.0"
      />

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <PrimaryButton onClick={onStartStream}>Send Stream</PrimaryButton>
      )}
    </div>
  );
};

export default SendStreamForm;
