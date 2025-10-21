import { ethers } from 'ethers';

// Local Ganache configuration
export const GANACHE_RPC_URL = 'http://127.0.0.1:7545';
export const GANACHE_CHAIN_ID = 5777;

// Deployed contract addresses from Ganache
export const CONTRACT_ADDRESSES = {
  FarmerRegistry: '0x3953f56cFDC7874875130B09CC6afaEb5403f74D',
  CarbonCreditNFT: '0xE67683a63cD48F243a071FE10395Ee47c735288C',
  CarbonMarketplace: '0x45dE5EBB8E936B15E56d3a57d463a1937Ef020C0',
} as const;

// Lazy load contract ABIs
let contractABIs: any = null;
const getContractABIs = async () => {
  if (!contractABIs) {
    const [CarbonCreditNFT, CarbonMarketplace, FarmerRegistry] = await Promise.all([
      import('@/contracts/CarbonCreditNFT.json'),
      import('@/contracts/CarbonMarketplace.json'),
      import('@/contracts/FarmerRegistry.json'),
    ]);
    contractABIs = {
      CarbonCreditNFT: CarbonCreditNFT.default || CarbonCreditNFT,
      CarbonMarketplace: CarbonMarketplace.default || CarbonMarketplace,
      FarmerRegistry: FarmerRegistry.default || FarmerRegistry,
    };
  }
  return contractABIs;
};

// Get provider (local Ganache or MetaMask)
export const getProvider = () => {
  if (window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  // Fallback to Ganache RPC
  return new ethers.JsonRpcProvider(GANACHE_RPC_URL);
};

// Get signer (requires MetaMask)
export const getSigner = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  return provider.getSigner();
};

// Connect wallet - this will show MetaMask's account selection UI
export const connectWallet = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed. Please install MetaMask to continue.');
  }

  try {
    // Request account access - this opens MetaMask for user to select accounts
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found. Please unlock MetaMask and try again.');
    }

    // Get the actual chain ID from Ganache
    const provider = new ethers.JsonRpcProvider(GANACHE_RPC_URL);
    const network = await provider.getNetwork();
    const actualChainId = Number(network.chainId);

    console.log('Detected Ganache Chain ID:', actualChainId);
    console.log('Available accounts:', accounts);

    // Switch to Ganache network if not already connected
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${actualChainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      // If network doesn't exist, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${actualChainId.toString(16)}`,
              chainName: 'Ganache Local',
              nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: [GANACHE_RPC_URL],
            },
          ],
        });
      } else {
        throw switchError;
      }
    }

    // Return the first account (user's selected account from MetaMask)
    // MetaMask will show the currently selected account in the popup
    return accounts[0];
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
};

// Request to switch accounts - this will prompt MetaMask to show account selector
export const requestAccountSwitch = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }
  
  try {
    // Request permissions - this opens MetaMask's account selector
    const permissions = await window.ethereum.request({
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {} }],
    });
    
    // After permission is granted, get the new account
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
    
    console.log('Switched to account:', accounts[0]);
    return accounts[0];
  } catch (error) {
    console.error('Error switching account:', error);
    throw error;
  }
};

// Get currently connected accounts
export const getConnectedAccounts = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }
  
  try {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    });
    return accounts;
  } catch (error) {
    console.error('Error getting accounts:', error);
    throw error;
  }
};

// Get contract instances
export const getFarmerRegistryContract = async (withSigner = false) => {
  const abis = await getContractABIs();
  const provider = withSigner ? await getSigner() : getProvider();
  return new ethers.Contract(
    CONTRACT_ADDRESSES.FarmerRegistry,
    abis.FarmerRegistry.abi,
    provider
  );
};

export const getCarbonCreditNFTContract = async (withSigner = false) => {
  const abis = await getContractABIs();
  const provider = withSigner ? await getSigner() : getProvider();
  return new ethers.Contract(
    CONTRACT_ADDRESSES.CarbonCreditNFT,
    abis.CarbonCreditNFT.abi,
    provider
  );
};

export const getCarbonMarketplaceContract = async (withSigner = false) => {
  const abis = await getContractABIs();
  const provider = withSigner ? await getSigner() : getProvider();
  return new ethers.Contract(
    CONTRACT_ADDRESSES.CarbonMarketplace,
    abis.CarbonMarketplace.abi,
    provider
  );
};

// Farmer Registry functions
export const registerFarmer = async (
  name: string,
  location: string
) => {
  const contract = await getFarmerRegistryContract(true);
  const tx = await contract.registerFarmer(name, location);
  await tx.wait();
  return tx;
};

export const getFarmerInfo = async (address: string) => {
  const contract = await getFarmerRegistryContract(false);
  return contract.farmers(address);
};

export const isFarmerRegistered = async (address: string): Promise<boolean> => {
  try {
    const farmerInfo = await getFarmerInfo(address);
    // Check if farmer is registered (has a name)
    return farmerInfo.name && farmerInfo.name.length > 0;
  } catch (error) {
    console.error('Error checking farmer registration:', error);
    return false;
  }
};

export const verifyFarmer = async (farmerAddress: string) => {
  const contract = await getFarmerRegistryContract(true);
  const tx = await contract.verifyFarmer(farmerAddress);
  await tx.wait();
  return tx;
};

// Carbon Credit NFT functions
export const mintCarbonCredit = async (
  to: string,
  co2Amount: number,
  metadataURI: string
) => {
  const contract = await getCarbonCreditNFTContract(true);
  // The contract method is called mintNFT and only takes farmer address and tokenURI
  const tx = await contract.mintNFT(to, metadataURI);
  await tx.wait();
  return tx;
};

export const getCarbonCreditInfo = async (tokenId: number) => {
  const contract = await getCarbonCreditNFTContract(false);
  return contract.carbonCredits(tokenId);
};

export const getUserCarbonCredits = async (address: string) => {
  const contract = await getCarbonCreditNFTContract(false);
  const balance = await contract.balanceOf(address);
  const credits = [];
  
  for (let i = 0; i < Number(balance); i++) {
    const tokenId = await contract.tokenOfOwnerByIndex(address, i);
    const creditInfo = await contract.carbonCredits(tokenId);
    credits.push({
      tokenId: Number(tokenId),
      ...creditInfo,
    });
  }
  
  return credits;
};

export const getTokenURI = async (tokenId: number) => {
  const contract = await getCarbonCreditNFTContract(false);
  return contract.tokenURI(tokenId);
};

// Marketplace functions
export const listCarbonCredit = async (tokenId: number, priceInWei: string) => {
  const nftContract = await getCarbonCreditNFTContract(true);
  const marketplaceContract = await getCarbonMarketplaceContract(true);
  
  // First approve marketplace to transfer NFT
  const approveTx = await nftContract.approve(
    CONTRACT_ADDRESSES.CarbonMarketplace,
    tokenId
  );
  await approveTx.wait();
  
  // Then list on marketplace
  const listTx = await marketplaceContract.listCarbonCredit(tokenId, priceInWei);
  await listTx.wait();
  return listTx;
};

export const buyListedCredit = async (listingId: number, priceInWei: string) => {
  const contract = await getCarbonMarketplaceContract(true);
  const tx = await contract.buyListedCredit(listingId, {
    value: priceInWei,
  });
  await tx.wait();
  return tx;
};

export const cancelListing = async (listingId: number) => {
  const contract = await getCarbonMarketplaceContract(true);
  const tx = await contract.cancelListing(listingId);
  await tx.wait();
  return tx;
};

export const getActiveListing = async (listingId: number) => {
  const contract = await getCarbonMarketplaceContract(false);
  return contract.activeListings(listingId);
};

export const getListingCounter = async () => {
  const contract = await getCarbonMarketplaceContract(false);
  return contract.listingCounter();
};

// Utility functions
export const formatEther = (wei: bigint) => ethers.formatEther(wei);
export const parseEther = (ether: string) => ethers.parseEther(ether);
