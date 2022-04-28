import { ethers, config } from "hardhat";
import { ContractFactory } from "ethers";

async function main() {
  console.log(config.networks);

  const Token: ContractFactory = await ethers.getContractFactory("TestToken");
  const Airdrop: ContractFactory = await ethers.getContractFactory("Airdrop");

  const token = await Token.deploy("Test Token", "TT", "1000000000000000");
  await token.deployed();
  console.log("Token deployed to:", token.address);

  const airdrop = await Airdrop.deploy(token.address);
  await airdrop.deployed();
  console.log("Airdrop deployed to:", airdrop.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
