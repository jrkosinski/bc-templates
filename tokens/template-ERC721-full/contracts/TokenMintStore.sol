// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IMintable.sol";

/**
 * @title TEMPLATE ERC721 FULL 
 * @author John R. Kosinski 
 * 
 * 
 */
contract TokenMintStore is Pausable, Ownable {
    IMintable public nftContract; 
    uint256 public mintPrice = 0; 
    mapping(address => uint256) private specialPrices;
    
    /**
     * @dev Emitted when an attempt is made to withdraw ether from contract.
     */
    event Withdraw (
        address sender,
        uint256 amount,
        bool success
    );
    
    /**
     * @dev Emitted when a request to mint completes without reverting. 
     */
    event Mint (
        address sender, 
        address to, 
        uint256 amount,
        uint256 number
    );
    
    /**
     * @dev Constructor. 
     * 
     * @param _nftContract The address of the NFT contract whose items are being sold. 
     * @param _mintPrice The price charged per unit to mint. 
     */
    constructor(IMintable _nftContract, uint256 _mintPrice) {
        nftContract = _nftContract;
        mintPrice = _mintPrice;
    }
    
    /**
     * @dev Owner can set the price to mint an NFT. 
     * 
     * @param _mintPrice The price to set. 
     */
    function setMintPrice(uint256 _mintPrice) external onlyOwner {
        mintPrice = _mintPrice;
    }
    
    /**
     * @dev Owner can pause execution. 
     */
    function pause() external onlyOwner {
        _pause(); 
    }
    
    /**
     * @dev Owner can unpause execution if paused. 
     */
    function unpause() external onlyOwner {
        _unpause(); 
    }
    
    /**
     * Owner can set custom prices for specific address recipients. 
     * 
     * @param to The recipient for whom to set a custom price. 
     * @param price The price to set for the given recipient. 
     */
    function setSpecialPrice(address to, uint256 price) external onlyOwner {
        specialPrices[to] = price;
    }
    
    /**
     * Owner can set clear a custom price set previously for a recipient. 
     * 
     * @param to The recipient for whom to clear a custom price. 
     */
    function clearSpecialPrice(address to) external onlyOwner {
        specialPrices[to] = 0;
    }
    
    /**
     * @dev Anyone can purchase the right to mint, and mint an NFT from contract. 
     * 
     * @param to The NFT token recipient. 
     * @return tokenId The ID of the minted token. 
     */
    function mintNext(address to) external payable whenNotPaused returns(uint256) {
        require(address(nftContract) != address(0), "TokenMintStore: NFT address not set");
        require(msg.value >= getMintPrice(_msgSender()), "TokenMintStore: transferred value less than price");
        
        uint256 id = nftContract.mintNext(to); 
        
        emit Mint(_msgSender(), to, msg.value, 1); 
        
        return id; 
    }
    
    /**
     * @dev Sell multiple mints in the collection to a single user. Will be reverted if the 
     * number to be minted exceeds the number allowed.
     * 
     * @param to The NFT token recipient. 
     * @return The number minted and sold. 
     */
    function multiMint(address to, uint256 count) external payable whenNotPaused returns (uint256) {
        require(address(nftContract) != address(0), "TokenMintStore: NFT address not set");
        
        uint256 numberMinted = nftContract.multiMint(to, count); 
        require(msg.value >= (numberMinted * getMintPrice(_msgSender())), "TokenMintStore: transferred value less than price");
        
        emit Mint(_msgSender(), to, msg.value, numberMinted); 
        
        return numberMinted;
    }
    
    /**
     * @dev Contract owner can withdraw all collected funds from contract. 
     * 
     * @return True if successful. 
     */
    function withdrawAll() external onlyOwner whenNotPaused returns (bool) {
        uint256 amount = address(this).balance;
        (bool success,) = msg.sender.call{value:amount}(""); 
        
        emit Withdraw(_msgSender(), amount, success);
        return success;
    }
    
    /**
     * @dev Returns either a custom or standard price as appropriate for the given 
     * recipient. 
     * 
     * @param buyer The recipient for whom to get mint price. 
     * @return price The appropriate price for the recipient. 
     */
    function getMintPrice(address buyer) internal view returns (uint256 price) {
        price = specialPrices[buyer]; 
        if (price == 0) 
            price = mintPrice;
        else if (price > mintPrice) //TODO: add test case for this 
            price = mintPrice;
    }
}