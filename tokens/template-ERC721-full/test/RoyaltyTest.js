const { expect } = require("chai");
const { ethers } = require("hardhat");
const constants = require("./util/constants");
const deploy = require("./util/deploy");

describe(constants.TOKEN_CONTRACT_ID + ": Royalties (ERC-2981)", function () {		  
	let nft;				//contracts
	let owner, addr1; 		//accounts
	
	beforeEach(async function () {
		[owner, addr1,...addrs] = await ethers.getSigners();
        
        //contract
		nft = await deploy.deployNFT();
	});
    
    function expectRoyaltiesZero(result) {
        expectRoyaltiesEqual(result, constants.ZERO_ADDRESS, 0); 
    }
    
    function expectRoyaltiesDisabled(result) {
        expectRoyaltyInfoEqual(result, constants.ZERO_ADDRESS, 0, 0); 
    }
    
    function expectRoyaltiesEqual(result, expectedReceiver, expectedAmount) {
        expect(result[0]).to.equal(expectedReceiver); 
        expect(result[1]).to.equal(expectedAmount); 
    }
    
    function expectRoyaltyInfoEqual(result, expectedReceiver, expectedNumerator, expectedDenominator) {
        expect(result[0]).to.equal(expectedReceiver); 
        expect(result[1]).to.equal(expectedNumerator); 
        expect(result[2]).to.equal(expectedDenominator); 
    }

	describe("Initial State", function () {
		it("royalty data not set by default", async function () {
            const result = await nft.getRoyaltyInfo(); 
            expectRoyaltiesDisabled(result); 
		});
    });  

	describe("Manage Royalty Info", function () {
		it("can set royalty info", async function () {
			const num = 3; 
			const denom = 1000; 
			
            //admin sets royalty info
            await nft.setRoyaltyInfo(addr1.address, num, denom); 
			
            //ensure royalty info set 
            const result = await nft.getRoyaltyInfo(); 
			expectRoyaltyInfoEqual(result, addr1.address, num, denom); 
		});
        
		it("can clear royalty info", async function () {
			const num = 3; 
			const denom = 1000; 

            //admin sets royalty info
            await nft.setRoyaltyInfo(addr1.address, num, denom); 
			
            let result = await nft.getRoyaltyInfo(); 
			expectRoyaltyInfoEqual(result, addr1.address, num, denom); 

            //admin clears royalty info
			await nft.clearRoyaltyInfo(); 

            //ensure royalty info cleared 
            result = await nft.getRoyaltyInfo(); 
			expectRoyaltiesDisabled(result); 
		});
    });  

	describe("Calculate Royalties", function () {
		it("zero sale price", async function () {
            await nft.setRoyaltyInfo(addr1.address, 1, 100); 
			const result = await nft.royaltyInfo(1, 0); 
			expectRoyaltiesEqual(result, addr1.address, 0); 
		}); 
		
		it("zero numerator", async function () {
            await nft.setRoyaltyInfo(addr1.address, 0, 100); 
			const result = await nft.royaltyInfo(1, ethers.utils.parseEther("1")); 
			expectRoyaltiesEqual(result, addr1.address, 0); 
		}); 
		
		it("zero denominator", async function () {
            await nft.setRoyaltyInfo(addr1.address, 1, 0); 
			const result = await nft.royaltyInfo(1, ethers.utils.parseEther("1")); 
			expectRoyaltiesEqual(result, addr1.address, 0); 
		}); 
		
		it("normal values: 3%", async function () {
            await nft.setRoyaltyInfo(addr1.address, 3, 100); 
			const result = await nft.royaltyInfo(1, ethers.utils.parseEther("1")); 
			expectRoyaltiesEqual(result, addr1.address, ethers.utils.parseEther("0.03")); 
		}); 
		
		it("normal values: 1%", async function () {
            await nft.setRoyaltyInfo(addr1.address, 1, 100); 
			const result = await nft.royaltyInfo(1, ethers.utils.parseEther("1")); 
			expectRoyaltiesEqual(result, addr1.address, ethers.utils.parseEther("0.01")); 
		}); 
		
		it("normal values: 0.2%", async function () {
            await nft.setRoyaltyInfo(addr1.address, 2, 1000); 
			const result = await nft.royaltyInfo(1, ethers.utils.parseEther("1")); 
			expectRoyaltiesEqual(result, addr1.address, ethers.utils.parseEther("0.002")); 
		}); 
		
		it("token id is ignored", async function () {
            await nft.setRoyaltyInfo(addr1.address, 3, 100); 
            
            //passes nonexistent token id 
			const result = await nft.royaltyInfo(10100, ethers.utils.parseEther("1")); 
            
            //royalties should be the same regardless of token id
			expectRoyaltiesEqual(result, addr1.address, ethers.utils.parseEther("0.03")); 
		}); 
    });  
    
    //TODO: is there an event for this? 
});