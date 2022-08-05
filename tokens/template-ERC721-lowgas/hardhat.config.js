require("@nomiclabs/hardhat-waffle");
require("solidity-coverage"); 

const RINKEBY_API_KEY = "<YOUR RINKEBY KEY>";
const ROPSTEN_API_KEY = "<YOUR ROPSTEN KEY>";
const GOERLI_API_KEY = "<YOUR GOERLI KEY>";
const ETH_MAINNET_API_KEY = "<YOUR ETH_MAINNET KEY>";
const POLYGON_API_KEY = "<YOUR POLYGON KEY>";
const PRIVATE_KEY = "<YOUR PRIVATE KEY>";

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    solidity: "0.8.4",
    networks: {
        rinkeby: {
            url: `https://eth-rinkeby.alchemyapi.io/v2/${RINKEBY_API_KEY}`,
            accounts: [`${PRIVATE_KEY}`]
        },
        ropsten: {
            url: `https://eth-ropsten.alchemyapi.io/v2/${ROPSTEN_API_KEY}`,
            accounts: [`${PRIVATE_KEY}`]
        },
        goerli: {
            url: `https://eth-goerli.alchemyapi.io/v2/${GOERLI_API_KEY}`,
            accounts: [`${PRIVATE_KEY}`]
        },
        mainnet: {
            url: `https://eth-mainnet.g.alchemy.com/v2/${ETH_MAINNET_API_KEY}`,
            accounts: [`${PRIVATE_KEY}`]
        },
        polygon: {
            url: `https://polygon-mainnet.g.alchemy.com/v2/${POLYGON_API_KEY}`,
            accounts: [`${PRIVATE_KEY}`]
        },
    }
};



