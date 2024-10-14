const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
require('dotenv').config();

/* Borrows USDC based off your token deposit value
  It will borrow 80% of your maximum available to be safe
*/

// Read JSON files
const referencesPath = path.join(__dirname, '../api3-adaptors/references.json');
const deployedContractsPath = path.join(__dirname, '../deployed-contracts.json');

const tokenThatWasDeposited = "API3";

let references, deployedContracts;

try {
  references = JSON.parse(fs.readFileSync(referencesPath, 'utf8'));
  deployedContracts = JSON.parse(fs.readFileSync(deployedContractsPath, 'utf8'));
} catch (error) {
  console.error('Error reading JSON files:', error.message);
  process.exit(1);
}

// Get addresses from JSON files
const USDCTokenAddress = references.USDCWithFaucet;
const LendingPoolAddress = deployedContracts.LendingPool.custom.address;
const WETHPoolAddress = references.MockWETH;
const AaveOracleAddress = deployedContracts.AaveOracle.custom.address;
const ProtocolDataProviderAddress = deployedContracts.AaveProtocolDataProvider.custom.address;

// Get API3 token address
const API3TokenAddress = references.assets.find(asset => asset.assetSymbol === tokenThatWasDeposited).ERC20;
const WETHTokenAddress = WETHPoolAddress;

console.log('USDC Token Address:', USDCTokenAddress);
console.log(`${tokenThatWasDeposited} Token Address:`, API3TokenAddress);
console.log('WETH Token Address:', WETHPoolAddress);
console.log('Lending Pool Address:', LendingPoolAddress);
console.log('Aave Oracle Address:', AaveOracleAddress);
console.log('Protocol Data Provider Address:', ProtocolDataProviderAddress);

const mnemonic = process.env.MNEMONIC;
const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);
// Use the second generated address from the mnemonic
const hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic);
const wallet = new ethers.Wallet(hdNode.derivePath("m/44'/60'/0'/0/1")).connect(provider);

// console.log('Wallet Address', wallet.address);

const ERC20Abi = [
  'function balanceOf(address account) public view returns (uint256)',
  'function decimals() public view returns (uint8)',
  'function approve(address spender, uint256 amount) public returns (bool)'
];

const lendingPoolAbi = [
  'function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) public',
  'function getUserAccountData(address user) public view returns (uint256 totalCollateralETH, uint256 totalDebtETH, uint256 availableBorrowsETH, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)',
  'function getReserveData(address asset) public view returns (uint256 availableLiquidity, uint256 totalStableDebt, uint256 totalVariableDebt, uint256 liquidityRate, uint256 variableBorrowRate, uint256 stableBorrowRate, uint256 averageStableBorrowRate, uint40 liquidityIndex, uint40 variableBorrowIndex, address aTokenAddress, uint256 lastUpdateTimestamp)'
];

const aaveOracleAbi = [
  'function getAssetPrice(address asset) external view returns (uint256)',
  'function getSourceOfAsset(address asset) external view returns (address)'
];

const protocolDataProviderAbi = [
  'function getUserReserveData(address asset, address user) external view returns (uint256 currentATokenBalance, uint256 currentStableDebt, uint256 currentVariableDebt, uint256 principalStableDebt, uint256 scaledVariableDebt, uint256 stableBorrowRate, uint256 liquidityRate, uint40 stableRateLastUpdated, bool usageAsCollateralEnabled)'
];

const usdcToken = new ethers.Contract(USDCTokenAddress, ERC20Abi, wallet);
const api3Token = new ethers.Contract(API3TokenAddress, ERC20Abi, wallet);
const lendingPool = new ethers.Contract(LendingPoolAddress, lendingPoolAbi, wallet);
const aaveOracle = new ethers.Contract(AaveOracleAddress, aaveOracleAbi, wallet);
const protocolDataProvider = new ethers.Contract(ProtocolDataProviderAddress, protocolDataProviderAbi, wallet);

const referralCode = 0;

//https://docs.aave.com/developers/2.0/the-core-protocol/price-oracle/ipriceoracle

const getAssetPrice = async (assetAddress) => {
  const assetPrice = await aaveOracle.getAssetPrice(assetAddress);
  return assetPrice;
};

const borrowUSDCFromLendingPool = async () => {
  try {
    // Get ETH price
    const ethPrice = await getAssetPrice(WETHTokenAddress);
    console.log('ETH Price (in USD):', ethers.utils.formatUnits(ethPrice, 8));

    // Get API3 price
    const api3Price = await getAssetPrice(API3TokenAddress);
    console.log(`tokenThatWasDeposited Price (in USD):`, ethers.utils.formatUnits(api3Price, 8));

    // Get deposited API3 balance using Protocol Data Provider
    const userReserveData = await protocolDataProvider.getUserReserveData(API3TokenAddress, wallet.address);
    const depositedAPI3Balance = userReserveData.currentATokenBalance;
    const api3Decimals = await api3Token.decimals();
    console.log(`Deposited ${tokenThatWasDeposited} Balance:`, ethers.utils.formatUnits(depositedAPI3Balance, api3Decimals));

    // Calculate API3 value in USD
    const api3ValueInUsd = depositedAPI3Balance.mul(api3Price).div(ethers.BigNumber.from(10).pow(api3Decimals));
    const totalCollateralUSD = parseFloat(ethers.utils.formatUnits(api3ValueInUsd, 8));
    console.log('Total Collateral USD:', totalCollateralUSD.toFixed(2));

    // Get user's account data
    const accountData = await lendingPool.getUserAccountData(wallet.address);
    
    // Calculate total debt in USD
    const totalDebtETH = parseFloat(ethers.utils.formatEther(accountData.totalDebtETH));
    const totalDebtUSD = totalDebtETH * parseFloat(ethers.utils.formatUnits(ethPrice, 8));
    console.log('Total Debt USD:', totalDebtUSD.toFixed(2));

    // LTV is returned in basis points, so 7000 means 70%
    const ltvPercentage = accountData.ltv.toNumber() / 100;
    console.log('LTV:', `${ltvPercentage}%`);

    // Calculate available borrows
    const availableBorrowsUSD = totalCollateralUSD * (ltvPercentage / 100) - totalDebtUSD;
    console.log('Available Borrows USD:', availableBorrowsUSD.toFixed(2));

    // Get USDC price (should be close to 1 USD)
    const usdcPrice = await getAssetPrice(USDCTokenAddress);
    console.log('USDC Price (in USD):', ethers.utils.formatUnits(usdcPrice, 8));

    // Calculate maximum borrow amount in USDC
    const maxBorrowUSDC = availableBorrowsUSD; // Already in USD, no need to convert
    console.log('Maximum Borrowable (USDC):', maxBorrowUSDC.toFixed(6));

    // // Get reserve data for API3 and USDC
    // const api3ReserveData = await lendingPool.getReserveData(API3TokenAddress);
    // const usdcReserveData = await lendingPool.getReserveData(USDCTokenAddress);
    // console.log('API3 Reserve Data:', api3ReserveData);
    // console.log('USDC Reserve Data:', usdcReserveData);

    // Set borrow amount to 80% of the maximum borrowable amount
    const borrowPercentage = 80;
    const borrowAmount = Math.floor(maxBorrowUSDC * borrowPercentage / 100);
    console.log('Attempting to borrow:', borrowAmount.toFixed(6), 'USDC');

    // Check if borrowing is possible
    if (borrowAmount === 0) {
      console.log('Cannot borrow: Borrow amount is zero');
      return;
    }

    // Convert borrowAmount to Wei (USDC has 6 decimal places)
    const borrowAmountWei = ethers.utils.parseUnits(borrowAmount.toFixed(6), 6);
    console.log('Borrow Amount (Wei):', borrowAmountWei.toString());

    // Estimate gas for the borrow transaction
    const estimatedGas = await lendingPool.estimateGas.borrow(
      USDCTokenAddress,
      borrowAmountWei,
      1, // 1 for variable rate, 2 for stable rate
      referralCode,
      wallet.address
    );

    console.log('Estimated gas:', estimatedGas.toString());

    // Add a buffer to the estimated gas (e.g., 20% more)
    const gasLimit = estimatedGas.mul(120).div(100);
    console.log('Gas limit with buffer:', gasLimit.toString());

    console.log('Executing borrow transaction...');
    const borrowTx = await lendingPool.borrow(
      USDCTokenAddress,
      borrowAmountWei,
      1, // 1 for variable rate, 2 for stable rate
      referralCode,
      wallet.address,
      {
        gasLimit: gasLimit
      }
    );

    console.log('Borrow transaction sent. Waiting for confirmation...');
    const receipt = await borrowTx.wait();
    
    if (receipt.status === 1) {
      console.log('Borrow transaction completed successfully');
    } else {
      console.log('Borrow transaction failed');
    }

    // Check USDC balance after borrowing
    const balance = await usdcToken.balanceOf(wallet.address);
    console.log('USDC Balance after borrowing:', ethers.utils.formatUnits(balance, 6));

    accountData = await lendingPool.getUserAccountData(wallet.address);
    console.log('Health Factor:', ethers.utils.formatEther(accountData.healthFactor));

  } catch (error) {
    console.error('Error:', error.message);
    if (error.error && error.error.message) {
      console.error('Detailed error:', error.error.message);
    }
    // Log transaction details if available
    if (error.transaction) {
      console.error('Transaction details:', JSON.stringify(error.transaction, null, 2));
    }
  }
};

// Main execution function
async function main() {
  try {
    await borrowUSDCFromLendingPool();
    console.log('Borrow process completed.');
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