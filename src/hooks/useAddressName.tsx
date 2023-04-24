import { ensApi } from "../redux/apis/ensApi.slice";
import { getAddress } from "../utils/memoizedEthersUtils";

export interface AddressNameResult {
  addressChecksummed: string;
  name: string | "";
  ensName?: string;
}

const useAddressName = (address: string): AddressNameResult => {
  const ensLookupQuery = ensApi.useLookupAddressQuery(address);
  const addressChecksummed = getAddress(address);

  const ensName = ensLookupQuery.data?.name;

  return {
    addressChecksummed,
    name: ensName || "",
    ensName,
  };
};

export default useAddressName;
