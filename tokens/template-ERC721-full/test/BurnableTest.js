const { expect } = require("chai");
const { ethers } = require("hardhat");
const constants = require("./util/constants");
const deploy = require("./util/deploy");
const testEvent = require("./util/testEvent");

describe(constants.TOKEN_CONTRACT_ID + ": Burning", function () {		  
	let nft;					//contracts
	let owner, addr1, addr2;	//accounts
	
	beforeEach(async function () {
		[owner, addr1, addr2,...addrs] = await ethers.getSigners();
        
        //contract
		nft = await deploy.deployNFT();
	});
	
	describe("Burning Tokens", function() {        
		it("owner can burn a token", async function () {
            await nft.mintNext(addr1.address); 
            
            //owner burns a token 
            expect(await nft.ownerOf(1)).to.equal(addr1.address); 
			await nft.connect(addr1).burn(1); 
			
            //expect balance to be zero 
            expect(await nft.balanceOf(addr1.address)).to.equal(0); 
            
            //expect burnt token to be nonexistent 
            await expect(nft.ownerOf(1)).to.be.reverted;
		});
		
		it("non-owner cannot burn another's token without approval", async function () {
            await nft.mintNext(addr1.address); 
			
            //expect attempt to be reverted 
            expect(await nft.ownerOf(1)).to.equal(addr1.address); 
			await expect(
				nft.connect(addr2).burn(1)
			).to.be.revertedWith("ERC721Burnable: caller is not owner nor approved"); 
		});
		
		it("approved non-owner can burn another's token", async function () {
            await nft.mintNext(addr1.address); 
			
            expect(await nft.ownerOf(1)).to.equal(addr1.address); 
			
			//approve addr2 and burn
            await nft.connect(addr1).approve(addr2.address, 1); 
			await nft.connect(addr2).burn(1); 
			
            //expect balances to be zero 
            expect(await nft.balanceOf(addr1.address)).to.equal(0); 
            expect(await nft.balanceOf(addr2.address)).to.equal(0); 

            //expect burnt token to be nonexistent 
            await expect(nft.ownerOf(1)).to.be.reverted;
        });
        
        it("cannot burn non-existent token", async () => {
            await expect(nft.connect(addr1).burn(1)).to.be.reverted;
        });
    });

    describe("Events", function () {
        it('transfer event fires on burn', async () => {
            await nft.mintNext(addr1.address);

            testEvent(async () => await nft.connect(addr1).burn(1),
                "Transfer", [addr1.address, 0, 1]);
        });
    });
});