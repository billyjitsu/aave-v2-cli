const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
require('dotenv').config();

// Read JSON files
const referencesPath = path.join(__dirname, '../api3-adaptors/references.json');
const deployedContractsPath = path.join(__dirname, '../deployed-contracts.json');

let references, deployedContracts;

try {
  references = JSON.parse(fs.readFileSync(referencesPath, 'utf8'));
  deployedContracts = JSON.parse(fs.readFileSync(deployedContractsPath, 'utf8'));
} catch (error) {
  console.error('Error reading JSON files:', error.message);
  process.exit(1);
}

const mnemonic = process.env.MNEMONIC;
const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);
// Use the second generated address from the mnemonic
const hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic);
const wallet = new ethers.Wallet(hdNode.derivePath("m/44'/60'/0'/0/0")).connect(provider);

console.log('Wallet Address', wallet.address);

// ABI for LendingPool (only including the liquidationCall function)
const LENDING_POOL_ADDRESS = deployedContracts.LendingPool.custom.address;
const LENDING_POOL_ABI = [
  "function liquidationCall(address collateralAsset, address debtAsset, address user, uint256 debtToCover, bool receiveAToken) external returns (uint256, string memory)"
];

const liquidationWallet = new ethers.Wallet(hdNode.derivePath("m/44'/60'/0'/0/1")).connect(provider);
console.log('Liquidation Wallet Address:', liquidationWallet.address);
//Aave V2 deployer wallet address
const LIQUIDATION_USER = liquidationWallet.address;

const lendingPool = new ethers.Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, wallet);

// Asset addresses
const API3_ADDRESS = references.assets.find(asset => asset.assetSymbol === "API3").ERC20;
const USDC_ADDRESS = references.USDCWithFaucet;

console.log('Lending Pool Address:', LENDING_POOL_ADDRESS);
console.log('API3 Address:', API3_ADDRESS);
console.log('USDC Address:', USDC_ADDRESS);

async function performLiquidation() {
  // Approve USDC spending if necessary (assuming you have enough USDC)
  const usdcContract = new ethers.Contract(USDC_ADDRESS, ['function approve(address spender, uint256 amount) public returns (bool)'], wallet);
  const maxUint256 = ethers.constants.MaxUint256;
  await usdcContract.approve(LENDING_POOL_ADDRESS, maxUint256);

  try {
    // Perform liquidation
    // We're setting debtToCover to MaxUint256 to repay the maximum amount possible
    const tx = await lendingPool.liquidationCall(
      API3_ADDRESS,  // collateralAsset
      USDC_ADDRESS,  // debtAsset
      LIQUIDATION_USER,
      maxUint256,    // debtToCover (max uint256 to repay maximum amount)
      false          // receiveAToken (false to receive the underlying asset)
    );

    console.log('Liquidation transaction sent:', tx.hash);
    await tx.wait();
    console.log('Liquidation successful!');
  } catch (error) {
    console.error('Liquidation failed:', error);
    if (error.error && error.error.message) {
      console.error('Detailed error:', error.error.message);
    }
    // Log transaction details if available
    if (error.transaction) {
      console.error('Transaction details:', JSON.stringify(error.transaction, null, 2));
    }
  }
}

// Main execution function
async function main() {
  try {
    await performLiquidation();
    console.log('Liquidation process completed.');
  } catch (error) {
    console.error('An error occurred in the main execution:', error.message);
  }
}

// Run the main function
main().then(() => {
  console.log('All operations completed.');
}).catch((error) => {
  console.error('Unhandled error in main execution:', error);
});