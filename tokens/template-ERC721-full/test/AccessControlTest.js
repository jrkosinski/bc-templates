const { expect } = require("chai");
const { ethers } = require("hardhat");
const constants = require("./util/constants");
const deploy = require("./util/deploy");
const testEvent = require("./util/testEvent");

//TODO: make sure every error case is covered 
//TODO: add revertedWith with error msg variables 

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
        let admin, nonAdmin; 
        
        beforeEach(async function () {
            await nft.grantRole(constants.roles.ADMIN, addr1.address); 
            admin = addr1;
            nonAdmin = addr2; 
        });
        
		it("non-admin cannot grant role", async function () {
            await expect(nft.connect(nonAdmin).grantRole(constants.roles.MINTER, admin.address)).to.be.reverted;
            await expect(nft.connect(admin).grantRole(constants.roles.MINTER, admin.address)).to.not.be.reverted;
		});
        
		it("non-admin cannot revoke role", async function () {
            await expect(nft.connect(nonAdmin).revokeRole(constants.roles.MINTER, owner.address)).to.be.reverted;
            await expect(nft.connect(admin).revokeRole(constants.roles.MINTER, owner.address)).to.not.be.reverted;
		});
        
		it("non-admin cannot pause", async function () {
            await expect(nft.connect(nonAdmin).pause()).to.be.reverted;
            await expect(nft.connect(admin).pause()).to.not.be.reverted;
        });

        it("non-admin cannot unpause", async function () {
            await nft.connect(addr1).pause();
            await expect(nft.connect(nonAdmin).unpause()).to.be.reverted;
            await expect(nft.connect(admin).unpause()).to.not.be.reverted;
        });
        
		it("non-admin cannot set supply parameters", async function () {
            await expect(nft.connect(nonAdmin).setSupplyParameters(10, 10)).to.be.reverted;
            await expect(nft.connect(admin).setSupplyParameters(10, 10)).to.not.be.reverted;
        });
        
		it("non-admin set base URI", async function () {
            await expect(nft.connect(nonAdmin).setBaseUri("uri")).to.be.reverted;
            await expect(nft.connect(admin).setBaseUri("uri")).to.not.be.reverted;
		});

        it("non-admin cannot set royalty info", async function () {
            await expect(nft.connect(nonAdmin).setRoyaltyInfo(admin.address, 3, 1000)).to.be.reverted;
            await expect(nft.connect(admin).setRoyaltyInfo(admin.address, 3, 1000)).to.not.be.reverted;
        });

        it("non-admin cannot clear royalty info", async function () {
            await expect(nft.connect(nonAdmin).clearRoyaltyInfo()).to.be.reverted;
            await expect(nft.connect(admin).clearRoyaltyInfo()).to.not.be.reverted;
        });

        it("non-admin cannot call initialMint", async function () {
            expect(await nft.totalSupply()).to.equal(0); 
            
            await expect(nft.connect(nonAdmin).initialMint()).to.be.reverted;
            await expect(nft.connect(admin).initialMint()).to.not.be.reverted;
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
            const minter = addr1; 
            
            await (nft.grantRole(constants.roles.MINTER, minter.address)); 
            await nft.connect(minter).mintNext(minter.address); 
            expect(await nft.balanceOf(minter.address)).to.equal(1); 
        });

        it("minter role can mint multiple", async function () {
            const minter = addr1; 
            
            await (nft.grantRole(constants.roles.MINTER, minter.address));
            await nft.connect(minter).multiMint(minter.address, 3);
            expect(await nft.balanceOf(minter.address)).to.equal(3);
        });

        it("minter role cannot initialMint", async function () {
            const minter = addr1;

            await (nft.grantRole(constants.roles.MINTER, minter.address));
            await expect(nft.connect(minter).initialMint()).to.be.reverted;
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