// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title TEMPLATE ERC721 FULL 
 * @author John R. Kosinski 
 * 
 * 
 */
interface IMintable  {

    /**
     * @dev Allows someone to mint. 
     * 
     * @param to The address of the token recipient once minted. 
     * @return The tokenId of the newly minted token.
     */
    function mintNext(address to) external returns (uint256);
    
    /**
     * @dev Allows someone to mint more than one item from the collection at once. 
     * 
     * @param to The address of the token recipient once minted. 
     * @param count The max number of tokens to be minted. 
     * @return The number of tokens minted to the recipient. 
     */
    function multiMint(address to, uint256 count) external returns (uint256);
}