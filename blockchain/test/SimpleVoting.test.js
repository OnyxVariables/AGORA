const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleVoting", function () {
  let contract;
  let admin;
  let other;

  beforeEach(async function () {
    [admin, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("SimpleVoting", admin);
    contract = await Factory.deploy();
    await contract.waitForDeployment();
  });

  it("sets deployer as admin", async function () {
    expect(await contract.admin()).to.equal(admin.address);
  });

  it("createVotation emits and stores active votation", async function () {
    const id = 1n;
    const now = BigInt(Math.floor(Date.now() / 1000));
    const end = now + 3600n;
    await expect(
      contract.createVotation(id, "T", "D", now, end),
    ).to.emit(contract, "VotationCreated");
  });

  it("createVotation reverts on invalid dates", async function () {
    const id = 2n;
    const now = BigInt(Math.floor(Date.now() / 1000));
    await expect(
      contract.createVotation(id, "T", "D", now + 10n, now),
    ).to.be.revertedWith("Fechas invalidas");
  });

  it("createVotation reverts duplicate id", async function () {
    const id = 3n;
    const now = BigInt(Math.floor(Date.now() / 1000));
    await contract.createVotation(id, "T", "D", now, now + 100n);
    await expect(
      contract.createVotation(id, "T2", "D", now, now + 200n),
    ).to.be.revertedWith("VotationId ya existe");
  });

  it("submitVote records vote when active", async function () {
    const id = 10n;
    const block = await ethers.provider.getBlock("latest");
    const now = BigInt(block.timestamp);
    await contract.createVotation(id, "T", "D", now, now + 7200n);
    const hash = ethers.keccak256(ethers.toUtf8Bytes("vote1"));
    await expect(contract.submitVote(1n, id, 5n, hash)).to.emit(
      contract,
      "VoteSubmitted",
    );
  });

  it("submitVote reverts duplicate hash", async function () {
    const id = 11n;
    const block = await ethers.provider.getBlock("latest");
    const now = BigInt(block.timestamp);
    await contract.createVotation(id, "T", "D", now, now + 7200n);
    const hash = ethers.keccak256(ethers.toUtf8Bytes("dup"));
    await contract.submitVote(1n, id, 1n, hash);
    await expect(
      contract.submitVote(2n, id, 2n, hash),
    ).to.be.revertedWith("Voto duplicado");
  });

  it("non-admin cannot createVotation", async function () {
    const c = contract.connect(other);
    const id = 20n;
    const now = BigInt(Math.floor(Date.now() / 1000));
    await expect(
      c.createVotation(id, "T", "D", now, now + 100n),
    ).to.be.revertedWith("Solo administrador");
  });

  it("cancelVotation emits VotationCancelled", async function () {
    const id = 30n;
    const now = BigInt(Math.floor(Date.now() / 1000));
    await contract.createVotation(id, "T", "D", now, now + 7200n);
    await expect(
      contract.cancelVotation(id, "reason"),
    ).to.emit(contract, "VotationCancelled");
  });

  it("finishVotation after endDate", async function () {
    const id = 40n;
    const block = await ethers.provider.getBlock("latest");
    const now = BigInt(block.timestamp);
    const start = now - 7200n;
    const end = now - 3600n;
    await contract.createVotation(id, "T", "D", start, end);
    await expect(contract.finishVotation(id)).to.emit(
      contract,
      "VotationFinished",
    );
  });

  it("transferAdmin changes admin", async function () {
    await contract.transferAdmin(other.address);
    expect(await contract.admin()).to.equal(other.address);
  });
});
