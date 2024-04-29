import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";
import { parseEther, formatEther, Address } from "viem";


/**
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployLottery: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network sepolia`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` which will fill DEPLOYER_PRIVATE_KEY
    with a random private key in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;
  let contractAddress: Address;
  let tokenAddress: Address;
  
  const BET_PRICE = "1";
  const BET_FEE = "0.05";
  const TOKEN_RATIO = 100n;
  await deploy("Lottery", {
    from: deployer,
    // Contract constructor arguments
    args: [
        "LotteryToken",
        "LT0",
        TOKEN_RATIO,
        parseEther(BET_PRICE),
        parseEther(BET_FEE),],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const lottery = await hre.ethers.getContract<Contract>("Lottery", deployer);
  await lottery.transferOwnership("0x0a33D8CE6a69E8f31F649E30885BD993117b6269");
  console.log("👋 Initial greeting:", await lottery.getAddress());
};

export default deployLottery;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags YourContract
deployLottery.tags = ["Lottery"];
