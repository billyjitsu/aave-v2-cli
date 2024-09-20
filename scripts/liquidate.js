const { ethers } = require('ethers');
require('dotenv').config();

const mnemonic = process.env.MNEMONIC;
const provider = new ethers.providers.JsonRpcProvider(
  'https://alien-thrumming-wind.arbitrum-sepolia.quiknode.pro/9e2372398f5f5bd9211072baca92043313851728'
);
const wallet = ethers.Wallet.fromMnemonic(mnemonic);
const signer = wallet.connect(provider);
console.log('Wallet Address', wallet.address);

// ABI for LendingPool (only including the liquidationCall function)
const LENDING_POOL_ADDRESS = '0x4364d3Bf9fc15FD61a9E46d6dD0f0975af532111';
const LENDING_POOL_ABI = [
  "function liquidationCall(address collateralAsset, address debtAsset, address user, uint256 debtToCover, bool receiveAToken) external returns (uint256, string memory)"
];

//Aave V2 deployer wallet address
const LIQUIDATION_USER = '0x62394a362ba1BbD5125dD39e42bEa8B984b303B8';

const lendingPool = new ethers.Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, signer);

  // Asset addresses
  const ARB_ADDRESS = '0xCAb77e19e6863AdF49Ce23Cc566448539B84abb0';
  const USDC_ADDRESS = '0x2728C49201C8E52AA2C24C2b535A993450B97f0c';

async function performLiquidation() {

  // Approve USDC spending if necessary (assuming you have enough USDC)
  const usdcContract = new ethers.Contract(USDC_ADDRESS, ['function approve(address spender, uint256 amount) public returns (bool)'], signer);
  const maxUint256 = ethers.constants.MaxUint256;
  await usdcContract.approve(LENDING_POOL_ADDRESS, maxUint256);

  try {
    // Perform liquidation
    // We're setting debtToCover to MaxUint256 to repay the maximum amount possible
    const tx = await lendingPool.liquidationCall(
      ARB_ADDRESS,  // collateralAsset
      USDC_ADDRESS, // debtAsset
      LIQUIDATION_USER,
      maxUint256,   // debtToCover (max uint256 to repay maximum amount)
      false         // receiveAToken (false to receive the underlying asset)
    );

    console.log('Liquidation transaction sent:', tx.hash);
    await tx.wait();
    console.log('Liquidation successful!');
  } catch (error) {
    console.error('Liquidation failed:', error);
  }
}

performLiquidation().catch(console.error);