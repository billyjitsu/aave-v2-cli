const { ethers } = require('ethers');
require('dotenv').config();

const mnemonic = process.env.MNEMONIC;
const provider = new ethers.providers.JsonRpcProvider(
  'https://alien-thrumming-wind.arbitrum-sepolia.quiknode.pro/9e2372398f5f5bd9211072baca92043313851728'
);
const wallet = ethers.Wallet.fromMnemonic(mnemonic[1]);
const signer = wallet.connect(provider);

const API3TokenAddress = '0x1Fb1CC01B913660f94b44e108099d85Ecc19d557';
const API3TokenAbi = [
  'function approve(address spender, uint256 amount) public returns (bool)',
  'function balanceOf(address account) public view returns (uint256)',
  'function transfer(address recipient, uint256 amount) public returns (bool)',
  'function faucet()public payable',
];
const LendingPoolAddress = '0x4364d3Bf9fc15FD61a9E46d6dD0f0975af532111';
const lendingPoolAbi = [
  'function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) public',
  'function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) public',
];

const api3Token = new ethers.Contract(API3TokenAddress, API3TokenAbi, signer);
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
// API3 deployed address on Sepolia Arbitrum  0x1Fb1CC01B913660f94b44e108099d85Ecc19d557

const depositAPI3TokensToLendingPool = async () => {
  
  const amount = ethers.utils.parseUnits('1000', 6);
  console.log('Wallet Address', wallet.address);

  const approveTx = await api3Token.approve(LendingPoolAddress, amount);
  await approveTx.wait(2);
  console.log(`Approved API3 Tokens for LendingPool`);
  const depositTx = await lendingPool.deposit(
    API3TokenAddress,
    amount,
    wallet.address,
    referralCode
  );
  await depositTx.wait(2);
  console.log(`Deposited API3 Tokens to LendingPool`);

  // use promise.all
  // const promises = []
  // for(let i = 0; i < positionWallets.length; i++) {
  //     promises.push(
  //         new Promise(async (resolve, reject) => {
  //             const singer = positionWallets[i];
  //             const oevToken = new hre.ethers.Contract(OEVTokenAddress, OEVTokenAbi, singer);
  //             const lendingPool = new hre.ethers.Contract(LendingPoolAddress, lendingPoolAbi, singer);
  //             const referralCode = 0;
  //             const amount = ethers.utils.parseUnits(randomValues[i][0].toString(), 18);
  //             const balance = await oevToken.balanceOf(positionWallets[i].address);
  //             if(balance.lt(amount)) {
  //                 console.log(`Insufficient OEV Tokens for positionWallet ${i}`);
  //                 resolve();
  //                 return;
  //             }
  //             try{
  //                 const approveTx = await oevToken.approve(LendingPoolAddress, amount);
  //                 await approveTx.wait(2);
  //                 const depositTx = await lendingPool.deposit(OEVTokenAddress, amount, positionWallets[i].address, referralCode);
  //                 await depositTx.wait(2);
  //                 console.log(`Deposited OEV Tokens to LendingPool for positionWallet ${i}`);
  //                 resolve();
  //             }
  //             catch(err) {
  //                 console.log(`Error depositing OEV Tokens to LendingPool for positionWallet ${i}`);
  //                 console.log(positionWallets[i].address);
  //                 reject(err);
  //             }
  //         })
  //     )
  // }
  // await Promise.all(promises);
};

// borrow positionWallet USDC from LendingPool

depositAPI3TokensToLendingPool();

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
