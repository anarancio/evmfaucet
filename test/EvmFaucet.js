const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EvmFaucet", () => {
  let EvmFaucet;
  let evmFaucet;
  let owner, otherAccount;

  beforeEach(async () => {
    EvmFaucet = await ethers.getContractFactory("EvmFaucet");
    evmFaucet = await EvmFaucet.deploy();
    [owner, otherAccount] = await ethers.getSigners();
  });

  it("should have an initial transferEthAmount of 0.01 ETH", async () => {
    const TRANSFER_AMOUNT = ethers.utils.parseUnits("0.01", "ether");
    
    const transferEthAmount = await evmFaucet.transferEthAmount();
    expect(transferEthAmount.toString()).to.equal(TRANSFER_AMOUNT.toString());
  });

  it("should allow the owner to change the transferEthAmount value", async () => {
    const TRANSFER_AMOUNT = ethers.utils.parseUnits("0.02", "ether");
    await evmFaucet.setTransferEthAmount(TRANSFER_AMOUNT);
    const newTransferEthAmount = await evmFaucet.transferEthAmount();
    expect(newTransferEthAmount.toString()).to.equal(TRANSFER_AMOUNT.toString());
  });

  it("should not allow non-owners to change the transferEthAmount value", async () => {
    const TRANSFER_AMOUNT = ethers.utils.parseUnits("0.01", "ether");
    
    let otherAccountContract = await evmFaucet.connect(otherAccount);
    await expect(otherAccountContract.setTransferEthAmount(TRANSFER_AMOUNT)).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should accept ether when the value is greater than zero", async () => {
    const initialBalance = await evmFaucet.provider.getBalance(evmFaucet.address);

    await owner.sendTransaction({to: evmFaucet.address, value: ethers.utils.parseEther("0.1") });
    const newBalance =  await evmFaucet.provider.getBalance(evmFaucet.address);
    expect(newBalance.sub(initialBalance).toString()).to.equal(ethers.utils.parseEther("0.1").toString());
  });

  it("should not accept ether when the value is zero", async () => {
    await expect(owner.sendTransaction({to: evmFaucet.address, value: ethers.utils.parseEther("0") })).to.be.revertedWith("You must send a positive value");
  });

  it("should not allow non-owners to withdraw ether", async () => {
    await otherAccount.sendTransaction({ to: evmFaucet.address, value: ethers.utils.parseEther("1") });

    let otherAccountContract = await evmFaucet.connect(otherAccount);
    await expect(otherAccountContract.withdraw()).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should not allow to request ETH if the contract balance is insufficient", async () => {
    await expect(evmFaucet.requestEth(otherAccount.address)).to.be.revertedWith("The contract balance is insufficient");
  });

  it("should transfer the specified amount to the user", async () => {
    // we get the balance of the account we want to send eth
    const initialBalance = await evmFaucet.provider.getBalance(otherAccount.address);

    // fund the faucet
    await owner.sendTransaction({ to: evmFaucet.address, value: ethers.utils.parseEther("1") });

    // ask eth to otherAccount.address
    await evmFaucet.requestEth(otherAccount.address);

    // get the new balance of otherAccount address
    const finalBalance = await evmFaucet.provider.getBalance(otherAccount.address);

    // the difference of balances should be 0.1 eth
    expect(finalBalance.sub(initialBalance).toString()).to.equal(ethers.utils.parseEther("0.01").toString());
  });

  it("should not allow re-ask for eth within a 24 hours period", async () => {
    // we get the balance of the account we want to send eth
    const initialBalance = await evmFaucet.provider.getBalance(otherAccount.address);

    // fund the faucet
    await owner.sendTransaction({ to: evmFaucet.address, value: ethers.utils.parseEther("1") });

    // ask eth to otherAccount.address
    await evmFaucet.requestEth(otherAccount.address);

    await expect(evmFaucet.requestEth(otherAccount.address)).to.be.revertedWith("You must wait 24 hours to request again");
  });

  it("should allow re-ask for eth after a 24 hours period", async () => {
    // fund the faucet
    await owner.sendTransaction({ to: evmFaucet.address, value: ethers.utils.parseEther("1") });

    // ask eth to otherAccount.address
    await evmFaucet.requestEth(otherAccount.address);

    await expect(evmFaucet.requestEth(otherAccount.address)).to.be.revertedWith("You must wait 24 hours to request again");

    // increase the current time 24 hours + 1 second
    await time.increase(3600 * 24 + 1);

    // we get the balance of the account we want to send eth
    const initialBalance = await evmFaucet.provider.getBalance(otherAccount.address);
    // ask eth to otherAccount.address
    await evmFaucet.requestEth(otherAccount.address);
    // get the new balance of otherAccount address
    const finalBalance = await evmFaucet.provider.getBalance(otherAccount.address);

    // the difference of balances should be 0.1 eth
    expect(finalBalance.sub(initialBalance).toString()).to.equal(ethers.utils.parseEther("0.01").toString());
  });

});