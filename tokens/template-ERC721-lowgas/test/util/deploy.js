
const constants = require("./constants");
const utils = require("../../scripts/lib/utils");

module.exports = {
    deployNFT : async () => {
		return await utils.deployContractSilent(constants.TOKEN_CONTRACT_ID, [
            constants.TOKEN_NAME, 
            constants.TOKEN_SYMBOL,
            constants.MAX_SUPPLY,
            constants.COLLECTION_SIZE, 
        ]); 
    },

    deployStore: async (nftAddr) => {
        return await utils.deployContractSilent(constants.STORE_CONTRACT_ID, [
            nftAddr,
            constants.MINT_PRICE   
        ]);
    }, 
    
    deployReceiver: async() => {
        return await utils.deployContractSilent("TestERC721Receiver"); 
    }
};