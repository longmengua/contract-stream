import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, ContractFactory, BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

enum Test {
  case1 = "check reward token address is correct",
  case2 = "setup airdrop",
  case3 = "activate airdrop without setup airdrop",
  case4 = "activate airdrop with insufficient allowance",
  case5 = "activate airdrop without enough balance",
  case6 = "activate airdrop successfully",
  case7 = "user claim reward",
  case8 = "call init method after activate contract",
  case9 = "deactivate contract",
  case10 = "deactivate contract after claim",
}

describe("Stream", function () {
  let Token: ContractFactory;
  let Airdrop: ContractFactory;
  let token: Contract;
  let airdrop: Contract;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addrs: Array<SignerWithAddress>;

  before(async () => {
    Token = await ethers.getContractFactory("TestToken");
    Airdrop = await ethers.getContractFactory("Stream");
  });

  beforeEach(async () => {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    token = await Token.deploy("Test Token", "TT", "1000000000000000");
    await token.deployed();

    airdrop = await Airdrop.deploy(token.address);
    await airdrop.deployed();
  });

  it(`${Test.case1}`, async () => {
    await expect((await airdrop.rewardToken()).toString()).to.equal(
      token.address
    );
  });

  it(`${Test.case2}`, async () => {
    const users: Array<{
      account: string;
      reward: string;
    }> = [
      {
        account: addr1.address,
        reward: "1000000000000000000",
      },
    ];

    await expect(await airdrop["init"](users)).to.emit(airdrop, "Setup");

    await expect(await airdrop["totalReward"](addr1.address)).to.equal(
      "1000000000000000000"
    );
    await expect(await airdrop["claimedReward"](addr1.address)).to.equal("0");
  });

  it(`${Test.case3}`, async () => {
    const result1: BigNumber = await airdrop["quantity"]();
    // console.log('result1', result1);
    await expect(result1.toString()).to.equal("0");

    const result2: BigNumber = await airdrop["total"]();
    // console.log('result2', result2);
    await expect(result2.toString()).to.equal("0");

    await expect(airdrop["activate"](0, 0)).to.be.revertedWith(
      "setup airdrop list first"
    );
  });

  it(`${Test.case4}`, async () => {
    const users: Array<{
      account: string;
      reward: string;
    }> = [
      {
        account: addr1.address,
        reward: "1000000000000000000",
      },
    ];

    await expect(await airdrop["init"](users)).to.emit(airdrop, "Setup");

    const result1: BigNumber = await airdrop["quantity"]();
    // console.log('result1', result1);
    await expect(result1.toString()).to.equal("1");

    const result2: BigNumber = await airdrop["total"]();
    // console.log('result2', result2);
    await expect(result2.toString()).to.equal("1000000000000000000");

    await expect(airdrop["activate"](0, 0)).to.revertedWith(
      "ERC20: insufficient allowance"
    );
  });

  it(`${Test.case5}`, async () => {
    const users: Array<{
      account: string;
      reward: string;
    }> = [
      {
        account: addr1.address,
        reward: "1000000000000000000",
      },
    ];

    await airdrop["init"](users);

    const quantity: BigNumber = await airdrop["quantity"]();
    // console.log('quantity', result1);
    await expect(quantity.toString()).to.equal("1");

    const total: BigNumber = await airdrop["total"]();
    // console.log('total', result2);
    await expect(total.toString()).to.equal("1000000000000000000");

    await token["approve"](airdrop.address, "1000000000000000000");

    await expect(airdrop["activate"](0, 0)).to.revertedWith(
      "ERC20: transfer amount exceeds balance"
    );
  });

  it(`${Test.case6}`, async () => {
    const now = new Date().getTime();
    const todayTimestamp = new Date(new Date().toLocaleDateString()).getTime();
    const milliseconds = 1000*60*60*24; // a day
    const tomorrowTimestamp = todayTimestamp + milliseconds;
    const yesterdayTimestamp = todayTimestamp - milliseconds;
    const users: Array<{
      account: string;
      reward: string;
    }> = [
      {
        account: owner.address,
        reward: "300000000",
      },
      {
        account: addr1.address,
        reward: "300000000",
      },
    ];

    await airdrop["init"](users);

    const quantity: BigNumber = await airdrop["quantity"]();
    // console.log('quantity', result1);
    await expect(quantity.toString()).to.equal("2");

    const total: BigNumber = await airdrop["total"]();
    // console.log('total', result2);
    await expect(total.toString()).to.equal("600000000");

    await token["approve"](airdrop.address, "600000000");

    await expect(airdrop["activate"](yesterdayTimestamp/1000, tomorrowTimestamp/1000)).to.emit(airdrop, "Fill");

    await expect(await token["balanceOf"](airdrop.address)).to.equal("600000000");

    const period = tomorrowTimestamp - yesterdayTimestamp;
    const passed = now - yesterdayTimestamp;
    const availableReward: BigNumber = await airdrop["availableReward"](owner.address);
    const result = BigNumber.from((300000000 * (passed / period)).toFixed(0));
    await expect(availableReward.mul(100).div(result).toNumber()).to.lte(100); // difference should under 100
    await expect(availableReward.mul(100).div(result).toNumber()).to.gte(90); // difference should above 90
  });

  it(`${Test.case7}`, async () => {
    const now = new Date().getTime();
    const todayTimestamp = new Date(new Date().toLocaleDateString()).getTime();
    const milliseconds = 1000*60*60*24; // a day
    const tomorrowTimestamp = todayTimestamp + milliseconds;
    const yesterdayTimestamp = todayTimestamp - milliseconds;
    const users: Array<{
      account: string;
      reward: string;
    }> = [
      {
        account: owner.address,
        reward: "100000000",
      },
      {
        account: addr1.address,
        reward: "100000000",
      },
    ];

    await airdrop["init"](users);
    const quantity: BigNumber = await airdrop["quantity"]();
    const total: BigNumber = await airdrop["total"]();

    await expect(quantity.toString()).to.equal("2");
    await expect(total.toString()).to.equal("200000000");

    await token["approve"](airdrop.address, "200000000");

    // before activate contract
    await expect(await token["balanceOf"](owner.address)).to.equal("1000000000000000");

    await expect(airdrop["activate"](yesterdayTimestamp/1000, tomorrowTimestamp/1000)).to.emit(airdrop, "Fill");

    // after activate contract, the sender's balance minus 200000000(owner reward + addr1 reward)
    await expect(await token["balanceOf"](owner.address)).to.equal("999999800000000");

    await expect(await token["balanceOf"](airdrop.address)).to.equal("200000000");

    await expect(await airdrop["claim"]()).to.emit(airdrop, "Claim");

    await expect(await token["balanceOf"](owner.address)).to.gte("999999800000000");

    const claimedReward: BigNumber = await airdrop["claimedReward"](owner.address);
    await expect(claimedReward.toNumber()).to.gt(0);
  });

  it(`${Test.case8}`, async () => {
    const users: Array<{
      account: string;
      reward: string;
    }> = [
      {
        account: owner.address,
        reward: "100000000",
      },
      {
        account: addr1.address,
        reward: "100000000",
      },
    ];

    const newUsers: Array<{
      account: string;
      reward: string;
    }> = [
      {
        account: owner.address,
        reward: "200000000",
      },
      {
        account: addr2.address,
        reward: "100000000",
      },
    ];

    await airdrop["init"](users);

    const quantity: BigNumber = await airdrop["quantity"]();
    // console.log('quantity', result1);
    await expect(quantity.toString()).to.equal("2");

    const total: BigNumber = await airdrop["total"]();
    // console.log('total', result2);
    await expect(total.toString()).to.equal("200000000");

    await token["approve"](airdrop.address, "9999999999999999999");
    await airdrop["activate"](0, 0);
    await expect(await token["balanceOf"](airdrop.address)).to.equal(
      "200000000"
    );

    await expect(airdrop["init"](newUsers)).to.revertedWith(
      "use update function"
    );
  });

  it(`${Test.case9}`, async () => {
    const now = new Date().getTime();
    const todayTimestamp = new Date(new Date().toLocaleDateString()).getTime();
    const milliseconds = 1000*60*60*24; // a day
    const tomorrowTimestamp = todayTimestamp + milliseconds;
    const yesterdayTimestamp = todayTimestamp - milliseconds;
    const users: Array<{
      account: string;
      reward: string;
    }> = [
      {
        account: owner.address,
        reward: "300000000",
      },
      {
        account: addr1.address,
        reward: "300000000",
      },
    ];

    await airdrop["init"](users);

    const quantity: BigNumber = await airdrop["quantity"]();
    // console.log('quantity', result1);
    await expect(quantity.toString()).to.equal("2");

    const total: BigNumber = await airdrop["total"]();
    // console.log('total', result2);
    await expect(total.toString()).to.equal("600000000");

    await token["approve"](airdrop.address, "600000000");

    await expect(airdrop["activate"](yesterdayTimestamp/1000, tomorrowTimestamp/1000)).to.emit(airdrop, "Fill");

    await expect(await token["balanceOf"](airdrop.address)).to.equal("600000000");

    const period = tomorrowTimestamp - yesterdayTimestamp;
    const passed = now - yesterdayTimestamp;
    const availableReward: BigNumber = await airdrop["availableReward"](owner.address);
    const result = BigNumber.from((300000000 * (passed / period)).toFixed(0));
    await expect(availableReward.mul(100).div(result).toNumber()).to.lte(100); // difference should under 100
    await expect(availableReward.mul(100).div(result).toNumber()).to.gte(90); // difference should above 90

    await expect(airdrop["deActivate"]()).to.emit(airdrop, "Stop");
  });

  it(`${Test.case10}`, async () => {
    const now = new Date().getTime();
    const todayTimestamp = new Date(new Date().toLocaleDateString()).getTime();
    const milliseconds = 1000*60*60*24; // a day
    const tomorrowTimestamp = todayTimestamp + milliseconds;
    const yesterdayTimestamp = todayTimestamp - milliseconds;
    const users: Array<{
      account: string;
      reward: string;
    }> = [
      {
        account: owner.address,
        reward: "300000000",
      },
      {
        account: addr1.address,
        reward: "300000000",
      },
    ];

    await airdrop["init"](users);

    const quantity: BigNumber = await airdrop["quantity"]();
    // console.log('quantity', result1);
    await expect(quantity.toString()).to.equal("2");

    const total: BigNumber = await airdrop["total"]();
    // console.log('total', result2);
    await expect(total.toString()).to.equal("600000000");

    await token["approve"](airdrop.address, "600000000");

    await expect(airdrop["activate"](yesterdayTimestamp/1000, tomorrowTimestamp/1000)).to.emit(airdrop, "Fill");

    await expect(await token["balanceOf"](airdrop.address)).to.equal("600000000");

    const period = tomorrowTimestamp - yesterdayTimestamp;
    const passed = now - yesterdayTimestamp;
    const availableReward: BigNumber = await airdrop["availableReward"](owner.address);
    const result = BigNumber.from((300000000 * (passed / period)).toFixed(0));
    await expect(availableReward.mul(100).div(result).toNumber()).to.lte(100); // difference should under 100
    await expect(availableReward.mul(100).div(result).toNumber()).to.gte(90); // difference should above 90

    await expect(await airdrop["claim"]()).to.emit(airdrop, "Claim");

    await expect(airdrop["deActivate"]()).to.emit(airdrop, "Stop");
  });
});
