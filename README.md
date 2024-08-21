[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Build pass](https://github.com/AAVE/protocol-v2/actions/workflows/node.js.yml/badge.svg)](https://github.com/aave/protocol-v2/actions/workflows/node.js.yml)

# Aave Protocol v2 with dAPIs

This repository contains the smart contracts source code and market configuration for Aave Protocol V2. The repository uses Docker Compose and Hardhat as development environments for compilation, testing and deployment tasks.

This forked version of aave-v2 uses API3's dAPIs for data feeds for assets. Check out the [API3 Docs](https://docs.api3.org) [API3 Market](https://market.api3.org) for more information.

## What is Aave?

Aave is a decentralized non-custodial liquidity markets protocol where users can participate as depositors or borrowers. Depositors provide liquidity to the market to earn a passive income, while borrowers are able to borrow in an overcollateralized (perpetually) or undercollateralized (one-block liquidity) fashion.

## What is API3

API3 is a collaborative project to deliver traditional API services to smart contract platforms in a decentralized and trust-minimized way.

API3 is building secure first-party oracles and OEV-enabled data feeds for DeFi protocols and users. The data feeds are continuously updated by first-party oracles using signed data.

## Setup

### Installing docker and docker-compose

Follow the next steps to install `docker` and `docker-compose`:

- [Install Docker](https://docs.docker.com/get-docker/)
- [Install Docker Compose](https://docs.docker.com/compose/install/linux/#install-the-plugin-manually)

### Deploying the Aggregator Adaptors and tokens

`/api3-adaptors` contains the necessary scripts to deploy and add the API3 Aggregator Adaptors and Token contracts required for the Aave deployment on the Sepolia Testnet.

### Prerequisites

- change directory to `api3-adaptors`

    ```bash
    cd api3-adaptors
    ```

- Install all the packages

    ```bash
    yarn
    ```

- Open `config.json` and add your asset and network details. You also need proxy contract address for each asset you are going to add. Head over to the [API3 Market](https://market.api3.org) and get the proxy contract address for the assets you want to add.

    The config file should look like this:

    ```json
    {
    "assets": [
        {
            "assetName": "Wrapped Bitcoin",
            "assetSymbol": "WBTC",
            "pairName": "WBTC/USDC",
            "proxyAddress": "0xa6B2F52b35785F82875A547e8E70F86D05f02400"
        },
        ...
        // add more assets here
        ],
    // add the ETH/USD and USDC/USD proxy addresses
    "EthUsdProxyAddress": "0xa5FCEcf0B99777B04E8054845d5fEFEa95CeCE9d",
    "UsdcUsdProxyAddress": "0x995364F8AC1D76abbd48f346B4E17f1537D32B37",
    "network": {
        "chainId": 11155111,
        "name": "Sepolia",
        "rpc": "https://rpc2.sepolia.org",
        "nativeCurrency" : {
            "name": "Ether",
            "symbol": "ETH",
            "wrapped": "WETH",
            "decimals": 18
        },
        "explorerLink": "https://sepolia.etherscan.io/"
        }
    }
    ```

*NOTE: It is advisable to use a private RPC for the deployments. If the protocol deployment fails, try using another RPC.*

- Make a `.env` file and add your mnemonic. This wallet needs to be funded to cover the gas costs for the deployments.

    ```bash
    mnemonic=""
    ```

- You can now go forward and deploy the contracts.

    ```bash
    yarn deploy:adaptors
    ```

    This would deploy the Aggregator Adaptors and Token contracts for the assets you have added in the `config.json` file.

### Setting up the Aave deployer

Follow the next steps to set up the repository:

- Head back to the root directory

    ```bash
    cd ..
    ```

- Create an environment file named `.env` and fill the next environment variables

    ```
    # Mnemonic, only first address will be used
    MNEMONIC=""
    ```

## Aave Markets configuration

The configurations related with the Aave Markets, assets, network details and dAPIs are located at `api3-adaptors/config.json`.

The Aave deployment uses `references.json` generated after deploying the adaptors and tokens. This file contains the addresses of the adaptors and tokens deployed.

## Deploying the Aave Protocol V2 contracts

After deploying the adaptors and tokens, you can deploy the Aave Protocol V2 contracts:

- Run the following command
```
docker-compose up
```

- Open another tab or terminal within the same directory and run the next command to connect to the container

```
docker-compose exec contracts-env bash
```

- A new Bash terminal will be prompted, connected to the container. Run the next command to deploy the Aave Protocol V2 contracts

```
yarn run aave:custom:full:migration
```

Let the script run, and the Aave Protocol V2 contracts will be deployed to the network specified in the `config.json` file.

## Spinning up the frontend

The repository contains a frontend application that interacts with the Aave Protocol V2 contracts. To start the frontend, run the next command:

```
yarn frontend:codegen
```

This command generates the necessary code for the frontend application. After that, run the next command to start the frontend:

```
yarn frontend:dev
```