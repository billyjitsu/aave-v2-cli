const { ethers } = require('ethers');
require('dotenv').config();
const path = require('path');
const referenceData = require(path.join(__dirname, '..', 'api3-adaptors', 'references.json'));

// Simplified wallet setup
const mnemonic = process.env.MNEMONIC;
const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);
const wallet = ethers.Wallet.fromMnemonic(mnemonic);
const signer = wallet.connect(provider);

// Correct ABI for the contract functions
const abi = [
  "function changeProxyAddress(address _assetProxy, address _UsdcUsdProxy) external",
  "function latestAnswer() view returns (int256)",
  "function owner() view returns (address)"
];

// Configuration
const assetToUpdate = "ARB"; // Change this to the asset symbol you want to update
const newAssetProxyAddress = "0x10D9b183FCcFDA464e9fbfC2D373A70f6AA3B1Fe"; // This is API3 on Arbisepolia to test

async function updateProxyAddress(assetSymbol, newAssetProxy) {
  const asset = referenceData.assets.find(a => a.assetSymbol === assetSymbol);
  if (!asset) {
    console.error(`Asset ${assetSymbol} not found in references.json`);
    return;
  }

  const contractAddress = asset.Api3AggregatorAdaptor;
  const newUsdcUsdProxy = referenceData.AggregatorAdaptorUsdc;

  // Create contract instance
  const contract = new ethers.Contract(contractAddress, abi, signer);

  try {
    // Check if the signer is the owner of the contract
    const contractOwner = await contract.owner();
    if (contractOwner.toLowerCase() !== signer.address.toLowerCase()) {
      console.error(`Error: The signer (${signer.address}) is not the owner of the contract (${contractOwner})`);
      return;
    }

    // const currentValue = await contract.latestAnswer();
    // console.log('Current value:', currentValue.toString());

    console.log(`Updating proxy addresses for ${assetSymbol}...`);
    console.log(`Contract Address: ${contractAddress}`);
    console.log(`New Asset Proxy: ${newAssetProxy}`);
    console.log(`New USDC/USD Proxy: ${newUsdcUsdProxy}`);

    // Call changeProxyAddress function
    const tx = await contract.changeProxyAddress(newAssetProxy, newUsdcUsdProxy);
    console.log('Transaction sent:', tx.hash);
    
    // Wait for transaction to be mined
    await tx.wait();
    console.log('Transaction confirmed');

    // const newValue = await contract.latestAnswer();
    // console.log('New value:', newValue.toString());
  } catch (error) {
    console.error('Error:', error.message);
    if (error.data) {
      console.error('Error data:', error.data);
    }
  }
}

async function main() {
  await updateProxyAddress(assetToUpdate, newAssetProxyAddress);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });