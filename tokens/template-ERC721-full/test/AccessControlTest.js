const { expect } = require("chai");
const { ethers } = require("hardhat");
const constants = require("./util/constants");
const deploy = require("./util/deploy");
const testEvent = require("./util/testEvent");

//TODO: make sure every error case is covered 
//TODO: make sure all access control cases are covered 
//TODO: add revertedWith with error msg variables 
//TODO: remove all unused requires

describe(constants.TOKEN_CONTRACT_ID + ": Access Control", function () {		  
	let nft;				    //contracts
	let owner, addr1, addr2; 	//accounts
	
	beforeEach(async function () {
		[owner, addr1, addr2,...addrs] = await ethers.getSigners();
        
        //contract
		nft = await deploy.deployNFT();
	});
	
	describe("Initial State", function () {
		it("default admin role", async function () {
			expect(await nft.hasRole(constants.roles.ADMIN, owner.address)).to.equal(true);
			expect(await nft.hasRole(constants.roles.ADMIN, addr1.address)).to.equal(false);
			expect(await nft.hasRole(constants.roles.ADMIN, addr2.address)).to.equal(false);
		});
        
		it("minter role", async function () {
			expect(await nft.hasRole(constants.roles.MINTER, owner.address)).to.equal(true);
			expect(await nft.hasRole(constants.roles.MINTER, addr1.address)).to.equal(false);
		    expect(await nft.hasRole(constants.roles.MINTER, addr2.address)).to.equal(false);
		});
    });  
    
	describe("Managing Roles", function () {
        it("admin can grant a role", async function () {
			await nft.grantRole(constants.roles.MINTER, addr1.address); 
            
			expect(await nft.hasRole(constants.roles.MINTER, addr1.address)).to.equal(true);
		});
        
        it("admin can revoke a role", async function () {
			await nft.grantRole(constants.roles.MINTER, addr1.address); 
            
			expect(await nft.hasRole(constants.roles.MINTER, addr1.address)).to.equal(true);
            
            await nft.revokeRole(constants.roles.MINTER, addr1.address); 

			expect(await nft.hasRole(constants.roles.MINTER, addr1.address)).to.equal(false);
		});
        
        it("anyone can renounce a role", async function () {
			await(nft.grantRole(constants.roles.MINTER, addr1.address)); 
            
			expect(await nft.hasRole(constants.roles.MINTER, addr1.address)).to.equal(true);
            
            await(nft.connect(addr1).renounceRole(constants.roles.MINTER, addr1.address)); 

			expect(await nft.hasRole(constants.roles.MINTER, addr1.address)).to.equal(false);
		});
        
		it("transfer ownership", async function () {
			await(nft.grantRole(constants.roles.ADMIN, addr1.address)); 
            await(nft.renounceRole(constants.roles.ADMIN, owner.address)); 

			expect(await nft.hasRole(constants.roles.ADMIN, owner.address)).to.equal(false);
			expect(await nft.hasRole(constants.roles.ADMIN, addr1.address)).to.equal(true);
		});
    }); 
    
	describe("Admin Role", function () {
        beforeEach(async function () {
            await nft.grantRole(constants.roles.ADMIN, addr1.address); 
        });
        
		it("non-admin cannot grant role", async function () {
            await expect(nft.connect(addr2).grantRole(constants.roles.MINTER, addr1.address)).to.be.reverted;
            await expect(nft.connect(addr1).grantRole(constants.roles.MINTER, addr1.address)).to.not.be.reverted;
		});
        
		it("non-admin cannot revoke role", async function () {
            await expect(nft.connect(addr2).revokeRole(constants.roles.MINTER, owner.address)).to.be.reverted;
            await expect(nft.connect(addr1).revokeRole(constants.roles.MINTER, owner.address)).to.not.be.reverted;
		});
        
		it("non-admin cannot pause", async function () {
            await expect(nft.connect(addr2).pause()).to.be.reverted;
            await expect(nft.connect(addr1).pause()).to.not.be.reverted;
		});
        
		it("non-admin cannot set supply parameters", async function () {
            await expect(nft.connect(addr2).setSupplyParameters(10, 10)).to.be.reverted;
            await expect(nft.connect(addr1).setSupplyParameters(10, 10)).to.not.be.reverted;
        });
        
		it("non-admin set base URI", async function () {
            await expect(nft.connect(addr2).setBaseUri("uri")).to.be.reverted;
            await expect(nft.connect(addr1).setBaseUri("uri")).to.not.be.reverted;
		});

        it("non-admin cannot set royalty info", async function () {
            await expect(nft.connect(addr2).setRoyaltyInfo(addr1.address, 3, 1000)).to.be.reverted;
            await expect(nft.connect(addr1).setRoyaltyInfo(addr1.address, 3, 1000)).to.not.be.reverted;
        });

        it("non-admin cannot clear royalty info", async function () {
            await expect(nft.connect(addr2).clearRoyaltyInfo()).to.be.reverted;
            await expect(nft.connect(addr1).clearRoyaltyInfo()).to.not.be.reverted;
        });
    }); 
    
	describe("Minter Role", function () {
		it("initial owner/admin can mint", async function () {
			await nft.mintNext(owner.address); 
            expect(await nft.balanceOf(owner.address)).to.equal(1); 
		});
        
		it("non-minter cannot mint", async function () {
			await expect(nft.connect(addr1).mintNext(addr1.address)).to.be.reverted;
		});
        
		it("minter role can mint", async function () {
			await(nft.grantRole(constants.roles.MINTER, addr1.address)); 
			await nft.connect(addr1).mintNext(addr1.address); 
            expect(await nft.balanceOf(addr1.address)).to.equal(1); 
		});
    });

    describe("Events", function () {
        it('rolegranted event fires on grantRole', async () => {
            testEvent(async () => await nft.grantRole(constants.roles.MINTER, addr1.address),
                "RoleGranted", [constants.roles.MINTER, addr1.address, owner.address]);
        });

        it('rolerevoked event fires on revokeRole', async () => {
            await (nft.grantRole(constants.roles.MINTER, addr1.address)); 

            testEvent(async () => await nft.revokeRole(constants.roles.MINTER, addr1.address),
                "RoleRevoked", [constants.roles.MINTER, addr1.address, owner.address]);
        });
    });
});