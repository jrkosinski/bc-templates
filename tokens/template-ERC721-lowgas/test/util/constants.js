module.exports = {

    TOKEN_NAME: "Template NFT",
    TOKEN_SYMBOL: "NFT",
    TOKEN_CONTRACT_ID: "Template721",
    STORE_CONTRACT_ID: "TokenMintStore",
    BASE_URI: "ipfs://base_uri/",
    MAX_SUPPLY: 5,
    COLLECTION_SIZE : 5, 
    MINT_PRICE: 10000000000,
    ZERO_ADDRESS: "0x0000000000000000000000000000000000000000",
    
    roles: {
        ADMIN: "0xdf8b4c520ffe197c5343c6f5aec59570151ef9a492f2c624fd45ddde6135ec42",
        MINTER: "0xf0887ba65ee2024ea881d91b74c2450ef19e1557f03bed3ea9f16b037cbe2dc9"
    }, 
    
    //TODO: calculate these instead of hard-coding
    interfaceIds : {
        IERC2981:           "0x2a55205a", 
        IERC165:            "0x01ffc9a7", 
        IAccessControl:     "0x7965db0b", 
        IERC721:            "0x80ac58cd", 
        IERC721Metadata:    "0x5b5e139f", 
        IERC721Enumerable:  "0x780e9d63", 
        IERC20:             "0x36372b07", 
        IERC777:            "0xe58e113c"
    }
};
