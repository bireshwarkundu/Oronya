// Contract ABI types
export interface ContractABI {
  abi: any[];
  contractName: string;
  networks?: {
    [key: string]: {
      address: string;
      transactionHash: string;
    };
  };
}
