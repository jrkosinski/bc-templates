const { expect, util } = require("chai");
const { ethers } = require("hardhat");
const constants = require("./util/constants");
const deploy = require("./util/deploy");
const testEvent = require("./util/testEvent"); 

describe(constants.TOKEN_CONTRACT_ID + ": Transferring", function () {		  
	let nft;					//contracts
	let owner, addr1, addr2;	//accounts
	
	beforeEach(async function () {
		[owner, addr1, addr2,...addrs] = await ethers.getSigners();
        
        //contract
		nft = await deploy.deployNFT();
        
        //mint 3 to owner 
        nft.mintNext(owner.address); 
        nft.mintNext(owner.address); 
        nft.mintNext(owner.address); 
	});
	
	describe("Initial State", function() { 
        it("Initial balances", async function () {
            //owner has been minted 3 tokens
            expect(await nft.balanceOf(owner.address)).to.equal(3); 
            expect(await nft.ownerOf(1)).to.equal(owner.address); 
            expect(await nft.ownerOf(2)).to.equal(owner.address); 
            expect(await nft.ownerOf(3)).to.equal(owner.address); 
		});
	});
	
	describe("Simple Transfer", function() {
		it("owner can transfer a token without data", async function () {
            await nft.transferFrom(owner.address, addr1.address, 1); 
            
            //check that transfer was credited and debited
            expect(await nft.balanceOf(owner.address)).to.equal(2); 
            expect(await nft.balanceOf(addr1.address)).to.equal(1); 
            expect(await nft.ownerOf(1)).to.equal(addr1.address); 
		});
          
		it("double transfer without data", async function () {
            //transfer 1 from owner to addr1
            await nft.transferFrom(owner.address, addr1.address, 1); 
            
            //then transfer it from addr1 to addr2
            await nft.connect(addr1).transferFrom(addr1.address, addr2.address, 1); 

            //check that transfer was credited and debited accordingly
            expect(await nft.balanceOf(owner.address)).to.equal(2); 
            expect(await nft.balanceOf(addr1.address)).to.equal(0); 
            expect(await nft.balanceOf(addr2.address)).to.equal(1); 
            expect(await nft.ownerOf(1)).to.equal(addr2.address); 
		});
	});
	
	describe("Approve and Transfer", function() {
        describe("Approve Single", function () {
            it("owner can approve", async function () {
                await nft.approve(addr1.address, 1);
                expect(await nft.getApproved(1)).to.equal(addr1.address);
            });

            it("approve and transfer", async function () {
                await nft.approve(addr1.address, 1);
                await nft.connect(addr1).transferFrom(owner.address, addr1.address, 1);

                //check that transfer was credited and debited
                expect(await nft.balanceOf(owner.address)).to.equal(2);
                expect(await nft.balanceOf(addr1.address)).to.equal(1);
                expect(await nft.ownerOf(1)).to.equal(addr1.address);
            });

            it("approve and transfer to a third user", async function () {
                await nft.approve(addr1.address, 1);
                expect(await nft.getApproved(1)).to.equal(addr1.address); 
                
                await nft.connect(addr1).transferFrom(owner.address, addr2.address, 1);

                //check that transfer was credited and debited
                expect(await nft.balanceOf(owner.address)).to.equal(2);
                expect(await nft.balanceOf(addr2.address)).to.equal(1);
                expect(await nft.ownerOf(1)).to.equal(addr2.address);
            });

            it("cannot approve and double transfer", async function () {
                await nft.approve(addr1.address, 1);
                expect(await nft.getApproved(1)).to.equal(addr1.address); 

                //transfer from owner to addr2, using addr1 as middleman after approval
                await nft.connect(addr1).transferFrom(owner.address, addr2.address, 1);

                //try to transfer another one
                await expect(
                    nft.connect(addr1).transferFrom(addr2.address, addr1.address, 1)
                ).to.be.revertedWith("ERC721: caller is not token owner nor approved");

                expect(await nft.balanceOf(owner.address)).to.equal(2);
                expect(await nft.balanceOf(addr2.address)).to.equal(1);
                expect(await nft.ownerOf(1)).to.equal(addr2.address);
            });

            it("approval clears on transfer by operator", async function () {
                await nft.approve(addr1.address, 1);
                expect(await nft.getApproved(1)).to.equal(addr1.address); 
                
                await nft.connect(addr1).transferFrom(owner.address, addr2.address, 1); 
                
                expect(await nft.getApproved(1)).to.equal(constants.ZERO_ADDRESS); 
            });

            it("approval clears on transfer by owner", async function () {
                await nft.approve(addr1.address, 1);
                expect(await nft.getApproved(1)).to.equal(addr1.address);

                await nft.transferFrom(owner.address, addr2.address, 1);

                expect(await nft.getApproved(1)).to.equal(constants.ZERO_ADDRESS);
            });

            it("approving clears previous approval", async function () {
                await nft.approve(addr1.address, 1);
                expect(await nft.getApproved(1)).to.equal(addr1.address);

                await nft.approve(addr2.address, 1);
                expect(await nft.getApproved(1)).to.equal(addr2.address);
            });

            it("setting approval for all does not revoke previous approval", async function () {
                await nft.approve(addr1.address, 1);
                expect(await nft.getApproved(1)).to.equal(addr1.address);
                expect(await nft.isApprovedForAll(owner.address, addr1.address)).to.equal(false);
                expect(await nft.isApprovedForAll(owner.address, addr2.address)).to.equal(false);

                await nft.setApprovalForAll(addr2.address, true);
                expect(await nft.getApproved(1)).to.equal(addr1.address);
                expect(await nft.isApprovedForAll(owner.address, addr1.address)).to.equal(false);
                expect(await nft.isApprovedForAll(owner.address, addr2.address)).to.equal(true);
            });
        }); 
        
        describe("Approve All", function () {
            it("owner can set approval for all", async function () {
                await nft.setApprovalForAll(addr1.address, true);
                expect(await nft.isApprovedForAll(owner.address, addr1.address)).to.equal(true); 
            });

            it("owner can revoke approval for all", async function () {
                await nft.setApprovalForAll(addr1.address, true);
                expect(await nft.isApprovedForAll(owner.address, addr1.address)).to.equal(true);

                await nft.setApprovalForAll(addr1.address, false);
                expect(await nft.isApprovedForAll(owner.address, addr1.address)).to.equal(false);
            });

            it("setting approval for all does not revoke previous approval", async function () {
                await nft.setApprovalForAll(addr1.address, true);
                expect(await nft.isApprovedForAll(owner.address, addr1.address)).to.equal(true);
                expect(await nft.isApprovedForAll(owner.address, addr2.address)).to.equal(false);

                await nft.setApprovalForAll(addr2.address, true);
                expect(await nft.isApprovedForAll(owner.address, addr1.address)).to.equal(true);
                expect(await nft.isApprovedForAll(owner.address, addr2.address)).to.equal(true);
            });
            
            it("approve for all and transfer", async function () {
                await nft.setApprovalForAll(addr1.address, true);
                
                await nft.connect(addr1).transferFrom(owner.address, addr1.address, 1);

                //check that transfer was credited and debited
                expect(await nft.balanceOf(owner.address)).to.equal(2);
                expect(await nft.balanceOf(addr1.address)).to.equal(1);
                expect(await nft.ownerOf(1)).to.equal(addr1.address);
            });

            it("approve for all and transfer to a third user", async function () {
                await nft.setApprovalForAll(addr1.address, true);

                await nft.connect(addr1).transferFrom(owner.address, addr2.address, 1);
                
                //check that transfer was credited and debited
                expect(await nft.balanceOf(owner.address)).to.equal(2);
                expect(await nft.balanceOf(addr2.address)).to.equal(1);
                expect(await nft.ownerOf(1)).to.equal(addr2.address);
            });

            it("cannot set approval for all and double transfer", async function () {
                await nft.setApprovalForAll(addr1.address, true);

                //transfer from owner to addr2, using addr1 as middleman after approval
                await nft.connect(addr1).transferFrom(owner.address, addr2.address, 1);

                //try to transfer another one
                await expect(
                    nft.connect(addr1).transferFrom(addr2.address, addr1.address, 1)
                ).to.be.revertedWith("ERC721: caller is not token owner nor approved");

                expect(await nft.balanceOf(owner.address)).to.equal(2);
                expect(await nft.balanceOf(addr2.address)).to.equal(1);
                expect(await nft.ownerOf(1)).to.equal(addr2.address);
            });
        }); 
	});
	
	describe("Exceptional Cases", function() {
        it("non-owner cannot transfer a token", async function () {
            await expect(
                nft.transferFrom(addr1.address, addr2.address, 1)
            ).to.be.revertedWith("ERC721: transfer from incorrect owner"); 
        }); 
        
        it("non-owner cannot approve a token transfer", async function () {
            await expect(
                nft.connect(addr1).approve(addr2.address, 1)
            ).to.be.revertedWith("ERC721: approve caller is not token owner nor approved for all"); 
        }); 
        
        it("cannot approve self", async function () {
            await expect(
                nft.approve(owner.address, 1)
            ).to.be.revertedWith("ERC721: approval to current owner"); 
        }); 
	});

    describe("Events", function () {
        it('transfer event fires on transferFrom', async () => {
            testEvent(async () => await nft.transferFrom(owner.address, addr1.address, 100),
                "Transfer", [owner.address, addr1.address, 100]);
        });

        it('approve event fires on approve', async () => {
            testEvent(async () => await nft.approve(addr1.address, 10),
                "Approve", [owner.address, addr1.address, 10]);
        });
        
        it ("ApprovalForAll event fires on setApprovalForAll", async() => {
            testEvent(async() => await nft.setApprovalForAll(addr1.address, true), 
                "ApprovalForAll", [owner.address, addr1.address, true]);
                
            testEvent(async () => await nft.setApprovalForAll(addr1.address, false),
                "ApprovalForAll", [owner.address, addr1.address, false]);
        });
    });
});