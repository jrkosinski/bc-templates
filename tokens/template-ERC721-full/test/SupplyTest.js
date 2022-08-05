const { expect } = require("chai");
const { ethers } = require("hardhat");
const constants = require("./util/constants");
const deploy = require("./util/deploy");

describe(constants.TOKEN_CONTRACT_ID + ": Supply Constraints", function () {		  
	let nft;				        //contracts
	let owner, addr1, addr2; 		//accounts
	
	beforeEach(async function () {
		[owner, addr1, addr2,...addrs] = await ethers.getSigners();
        
        //contract
		nft = await deploy.deployNFT();
        
        await nft.setSupplyParameters(constants.COLLECTION_SIZE * 2, constants.COLLECTION_SIZE); 
	});
    
	describe("Initial State", function () {
		it("property values", async function () {
			expect(await nft.maxSupply()).to.equal(constants.COLLECTION_SIZE * 2); 
			expect(await nft.collectionSize()).to.equal(constants.COLLECTION_SIZE); 
		});
    });  
    
	describe("Collection Size Constraints", function () {
        it("validation of supply parameters", async function () {
            
            //this should revert, as it sets maxSupply to less than collection size 
            await expect(nft.setSupplyParameters(100, 101)).to.be.reverted;
            
            //these should not revert: 
            await expect(nft.setSupplyParameters(100, 100)).to.not.be.reverted;
            await expect(nft.setSupplyParameters(101, 100)).to.not.be.reverted; 
        });
        
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

        it("mint and transfer and mint again", async function () {
            await nft.setSupplyParameters(10, 3);
            await nft.initialMint();

            //tokens 4 & 5 go to addr1
            await nft.mintNext(addr1.address);
            await nft.mintNext(addr1.address);

            //transfer token 5 and 6 to another user 
            await nft.connect(addr1).transferFrom(addr1.address, addr2.address, 4);
            await nft.connect(addr1).transferFrom(addr1.address, addr2.address, 5);

            //verify new ownership 
            expect(await nft.ownerOf(4)).to.equal(addr2.address);
            expect(await nft.ownerOf(5)).to.equal(addr2.address);

            //mint 2 more to addr1. the second one should exceed max per user
            await expect(nft.mintNext(addr1.address)).to.not.be.reverted;
            await expect(nft.mintNext(addr1.address)).to.be.reverted;
        });
    });
});