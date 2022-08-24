const { expect } = require("chai");
const { ethers } = require("hardhat");
const constants = require("./util/constants");
const deploy = require("./util/deploy");

describe.skip(constants.TOKEN_CONTRACT_ID + ": Deployment", function () {		  
	let nft;				//contracts
	let owner, addr1; 		//accounts
	
	beforeEach(async function () {
		[owner, addr1,...addrs] = await ethers.getSigners();
        
        //contract
		nft = await deploy.deployNFT();
	});
	/*
	describe("Initial State", function () {
		it("initial owner", async function () {
			expect(await nft.hasRole(constants.roles.ADMIN, owner.address)).to.equal(true);
			expect(await nft.hasRole(constants.roles.MINTER, owner.address)).to.equal(true);
		});
    });  
	
	describe("Deployment", function () {
		it("ownership transfer on deployment", async function () {
            const contract = await utils.deployContractSilent(constants.TOKEN_CONTRACT_ID, [
                addr1.address, 
                constants.TOKEN_NAME, 
                constants.TOKEN_SYMBOL, 
                constants.MAX_SUPPLY, 
                constants.COLLECTION_SIZE,
                constants.BASE_URI
            ]);
            
			expect(await contract.hasRole(constants.roles.ADMIN, addr1.address)).to.equal(true);
			expect(await contract.hasRole(constants.roles.MINTER, addr1.address)).to.equal(true);
			expect(await contract.hasRole(constants.roles.ADMIN, owner.address)).to.equal(false);
			expect(await contract.hasRole(constants.roles.MINTER, owner.address)).to.equal(false);
		});
    });  */
});