# EVM Faucet

A non production ready smart contract which behave as a faucet for any EVM compatible platform.


## Compile
To compile the project execute:

```shell
npx hardhat compile
```

## Deploy
To deploy the project execute:
```shell
npx hardhat run scripts/deploy.js
```

Or pass the network if you want to deploy in a specific network provider:
```shell
npx hardhat run scripts/deploy.js --network <NETWORK_DEFINED_IN_HARDHATCONFIG>
```

## Run Tests
To run the tests execute:
```shell
npx hardhat test
```