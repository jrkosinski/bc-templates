const { expect } = require("chai");
const { ethers } = require("hardhat");
const utils = require("../scripts/lib/utils");
const constants = require("./util/constants");
const deploy = require("./util/deploy");

/*
describe(constants.TOKEN_CONTRACT_ID + ": Supply Constraints", function () {		  
	let nft;				        //contracts
	let owner, addr1, addr2; 		//accounts
	
	beforeEach(async function () {
		[owner, addr1, addr2,...addrs] = await ethers.getSigners();
        
        //contract
		nft = await deploy.deployNFT();
        
        await nft.setMaxSupply(constants.COLLECTION_SIZE * 2); 
	});
    
	describe("Initial State", function () {
		it("property values", async function () {
			expect(await nft.maxSupply()).to.equal(constants.COLLECTION_SIZE * 2); 
			expect(await nft.collectionSize()).to.equal(constants.COLLECTION_SIZE); 
		});
    });  
    
	describe("Collection Size Constraints", function () {
		it("cannot mint more than max supply", async function () {
            await nft.multiMint(owner.address, constants.COLLECTION_SIZE); 
            await nft.multiMint(addr1.address, constants.COLLECTION_SIZE); 
            
            //the next single mint exceeds max supply
            await expect(nft.mintNext(addr2.address)).to.be.reverted;
		});
    });  
    
	describe("Max Per User Constraints", function () {
		it("cannot mint more than collection size per user", async function () {
            await nft.initialMint(); 

            //this would exceed max allowed per user 
            await expect(nft.multiMint(addr1.address, constants.COLLECTION_SIZE+1)).to.be.reverted;
            await nft.multiMint(addr1.address, constants.COLLECTION_SIZE); 
            
            //the next mint would exceed max allowed per user 
            await expect(nft.mintNext(addr1.address)).to.be.reverted;
		});
        
		it("user balance won't exceed collection size on multi-mint", async function () {
            //await nft.initialMint(); 
            
            //try to mint more than allowed per user 
            await nft.mintNext(addr1.address); 
            await nft.multiMint(addr1.address, constants.COLLECTION_SIZE); 
            
            //balance should not exceed collection size regardless
            expect(await nft.balanceOf(addr1.address)).to.be.equal(constants.COLLECTION_SIZE); 
		});
    });  
});*/