const { ethers } = require('ethers');
require('dotenv').config();

const mnemonic = process.env.MNEMONIC;
const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);
const wallet = ethers.Wallet.fromMnemonic(mnemonic);
const signer = wallet.connect(provider);

console.log('Wallet Address', wallet.address);

const USDCTokenAddress = '0x2728C49201C8E52AA2C24C2b535A993450B97f0c';
const USDCTokenAbi = [
  'function approve(address spender, uint256 amount) public returns (bool)',
  'function balanceOf(address account) public view returns (uint256)',
  'function transfer(address recipient, uint256 amount) public returns (bool)',
  'function faucet()public payable',
  'function allowance(address owner, address spender) public view returns (uint256)'
];
const LendingPoolAddress = '0x4364d3Bf9fc15FD61a9E46d6dD0f0975af532111';
const lendingPoolAbi = [
  'function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) public',
  'function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) public',
];

const usdcToken = new ethers.Contract(USDCTokenAddress, USDCTokenAbi, signer);
const lendingPool = new ethers.Contract(LendingPoolAddress, lendingPoolAbi, signer);
const referralCode = 0;

// const positionWallets = [];
// // I can look in to creat many wallets
// for (let i = 0; i < 10; i++) {
//   const positionWallet = ethers.Wallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${i}`);
//   const positionWalletWithProvider = positionWallet.connect(provider);
//   positionWallets.push(positionWalletWithProvider);
// }

// const transferEtherToPositionWallets = async () => {
//   const Liquidator = await hre.deployments.get("Liquidator");
//   const searcher = (await hre.ethers.getSigners())[0]
//   const liquidator = new hre.ethers.Contract(Liquidator.address, Liquidator.abi, searcher);
//   const positionAddresses = positionWallets.map((wallet) => wallet.address);
//   // create array of 0.1 ETH for each position
//   const nativeCurrencyAmount = positionAddresses.map(() => ethers.utils.parseEther("0.01"));
//   // create empty array for multicall data
//   const multicallData = positionAddresses.map(() => []);
//   // get sum of all amounts
//   const totalAmount = nativeCurrencyAmount.reduce((a, b) => a.add(b), ethers.BigNumber.from(0));
//   console.log("totalAmount", totalAmount.toString());

//   // send in batches of 100
//     const batchSize = 100;
//     const batchCount = Math.ceil(positionAddresses.length / batchSize);
//     for (let i = 0; i < batchCount; i++) {
//       const start = i * batchSize;
//       const end = Math.min((i + 1) * batchSize, positionAddresses.length);
//       const tx = await liquidator.externalMulticallWithValue(
//         positionAddresses.slice(start, end),
//         multicallData.slice(start, end),
//         nativeCurrencyAmount.slice(start, end),
//         { value: totalAmount.div(ethers.BigNumber.from(batchCount)) }
//       );
//       console.log(`Sent batch ${i + 1}/${batchCount}`);
//       await tx.wait(5);
//       console.log(`Batch ${i + 1}/${batchCount} confirmed`);
//     }
//     console.log("All done");

// };

// transfer OEVToken which is an ERC20 token to position wallets using ERC20 transfer
// const transferOEVTokensToPositionWallets = async () => {
//     const Liquidator = await hre.deployments.get("Liquidator");
//     const searcher = (await hre.ethers.getSigners())[0]
//     const liquidator = new hre.ethers.Contract(Liquidator.address, Liquidator.abi, searcher);
//     const OEVTokenAddress = "0x5Df761cB11aEd75618a716e252789Cdc9280f5A6"
//     const OEVTokenAbi = [
//         "function transfer(address recipient, uint256 amount) public returns (bool)",
//         "function approve(address spender, uint256 amount) public returns (bool)"
//     ]
//     const singer = (await hre.ethers.getSigners())[0];
//     const oevToken = new hre.ethers.Contract(OEVTokenAddress, OEVTokenAbi, singer);
//     const positionAddresses = positionWallets.map((wallet) => wallet.address);

//     // create array of 100 OEVToken for each position
//     const tokenAmount = positionAddresses.map((_,index) => ethers.utils.parseUnits(randomValues[index][0].toString(), 18));
//     // create erc20 approve data
//     const approveData = positionAddresses.map((address, index) => oevToken.interface.encodeFunctionData("approve", [address, tokenAmount[index]]));
//     // create erc20 transfer data
//     const transferData = positionAddresses.map((address, index) => oevToken.interface.encodeFunctionData("transfer", [address, tokenAmount[index]]));
//     // create combined data
//     const multicallData = [...approveData, ...transferData];
//     // create address array
//     const multicallAddresses = [...positionAddresses.map(() => OEVTokenAddress), ...positionAddresses.map(() => OEVTokenAddress)];
//     // create empty array for values
//     const values = [...positionAddresses.map(() => ethers.BigNumber.from(0)), ...positionAddresses.map(() => ethers.BigNumber.from(0))]

//     // send in batches of 100 to the Liquidator contract
//     const batchSize = 200;
//     const batchCount = Math.ceil(multicallData.length / batchSize);
//     for (let i = 0; i < batchCount; i++) {
//         const start = i * batchSize;
//         const end = Math.min((i + 1) * batchSize, multicallData.length);
//         const tx = await liquidator.externalMulticallWithValue(
//             multicallAddresses.slice(start, end),
//             multicallData.slice(start, end),
//             values.slice(start, end)
//         );
//         console.log(`Sent batch ${i + 1}/${batchCount}`);
//         await tx.wait(2);
//         console.log(`Batch ${i + 1}/${batchCount} confirmed`);
//     }

// }

// deposit positionWallet OEV Tokens to the LendingPool

//USDC deployed address on Sepolia Arbitrum 0x2728C49201C8E52AA2C24C2b535A993450B97f0c
 console.log("about to deposit USDC Tokens to LendingPool");
 const depositUSDCTokensToLendingPool = async () => {
  try {
    const amount = ethers.utils.parseUnits('1000', 6);
    console.log('Wallet Address', wallet.address);

    // Check USDC balance
    const balance = await usdcToken.balanceOf(wallet.address);
    console.log('USDC Balance:', ethers.utils.formatUnits(balance, 6));

    // Check allowance
    const allowance = await usdcToken.allowance(wallet.address, LendingPoolAddress);
    console.log('Current allowance:', ethers.utils.formatUnits(allowance, 6));

    if (allowance.lt(amount)) {
      console.log('Approving USDC Tokens for LendingPool...');
      const approveTx = await usdcToken.approve(LendingPoolAddress, amount, {
        gasLimit: 300000 // Increased gas limit
      });
      await approveTx.wait();
      console.log('Approval transaction completed');
    } else {
      console.log('Sufficient allowance already exists');
    }

    console.log('Depositing USDC Tokens to LendingPool...');
    const depositTx = await lendingPool.deposit(
      USDCTokenAddress,
      amount,
      wallet.address,
      referralCode,
      {
        gasLimit: 500000 // Increased gas limit for deposit
      }
    );
    await depositTx.wait();
    console.log('Deposit transaction completed');

  } catch (error) {
    console.error('Error:', error.message);
    if (error.error && error.error.message) {
      console.error('Detailed error:', error.error.message);
    }
  }
};

// borrow positionWallet USDC from LendingPool



const borrowUSDCFromLendingPool = async () => {
  const amount = ethers.utils.parseUnits('650', 6);
  const borrowTx = await lendingPool.borrow(
    USDCTokenAddress,
    amount,
    1,
    referralCode,
    wallet.address
  );
  await borrowTx.wait(2);
  console.log(`Borrowed USDC from LendingPool`);
};

depositUSDCTokensToLendingPool();
borrowUSDCFromLendingPool();

// const borrowUSDCFromLendingPool = async () => {
//     const USDCAddress = "0x3D5ebDbF134eAf86373c24F77CAA290B7A578D7d"
//     const USDCAbi = [
//         "function approve(address spender, uint256 amount) public returns (bool)",
//         "function balanceOf(address account) public view returns (uint256)"
//     ]
//     const LendingPoolAddress = "0xEeEed4f0cE2B9fe4597b6c99eD34D202b4C03052"
//     const lendingPoolAbi = [
//         "function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) public"
//     ]

//     // use promise.all
//     const promises = []
//     for(let i = 0; i < positionWallets.length; i++) {
//         promises.push(
//             new Promise(async (resolve, reject) => {
//                 const singer = positionWallets[i];
//                 const lendingPool = new hre.ethers.Contract(LendingPoolAddress, lendingPoolAbi, singer);
//                 const referralCode = 0;
//                 const amount = ethers.utils.parseUnits(randomValues[i][2].toString(), 6);
//                 const USDC = new hre.ethers.Contract(USDCAddress, USDCAbi, singer);
//                 const balance = await USDC.balanceOf(positionWallets[i].address);
//                 if(balance.gt(0)) {
//                     console.log(`already borrow USDC for positionWallet ${i}`);
//                     resolve();
//                     return;
//                 }
//                 try{
//                     const borrowTx = await lendingPool.borrow(USDCAddress, amount, 1, referralCode, positionWallets[i].address);
//                     await borrowTx.wait(2);
//                     console.log(`Borrowed USDC from LendingPool for positionWallet ${i}`);
//                     resolve();
//                 }
//                 catch(err) {
//                     console.log(`Error borrowing USDC from LendingPool for positionWallet ${i}`);
//                     console.log(positionWallets[i].address);
//                     reject(err);
//                 }
//             })
//         )
//     }
//     await Promise.all(promises);
// }

// borrowUSDCFromLendingPool();