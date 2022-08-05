// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./IMintable.sol";

/**
 * @title TEMPLATE ERC721 FULL 
 * @author John R. Kosinski 
 * 
 * 
 */
contract Template721 is 
        IMintable, 
        ERC721, 
        ERC721Enumerable, 
        ERC721URIStorage, 
        IERC2981,
        Pausable, 
        AccessControl {
    using Strings for uint256; 
    
    //max number of items that can be minted; 1 by default
    uint256 public maxSupply = 1; 
    
    //max number of items in collection; 1 by default 
    uint256 public collectionSize = 1; 
    
    // <user address> => <number of mints minted to that address in the past> 
    mapping(address => uint256) private addressMintHistory; 
    
    //base URI must be changed to a valid URI. <n>.png (sequential) will be appended 
    //to the base URI to create URIs for newly minted tokens 
    string public baseUri = "ipfs://{hash}/";
    
    //the token ID is a simple increment. The first one minted will be 1 
    uint256 private _tokenIdCounter = 0;
    
    //security roles 
    bytes32 internal constant MINTER_ROLE = keccak256("MINTER");
    
    //royalties (ERC-2981 implementation) - default to 0%
    address private royaltyReceiver = address(0); 
    uint96 private royaltyFeeNumerator = 0;
    uint96 private royaltyFeeDenominator = 0; 

    /**
     * @dev Constructor. 
     * 
     * @param initialOwner Initial owner address (if 0x0, owner becomes msg.sender)
     * @param tokenName NFT token name 
     * @param tokenSymbol NFT token symbol 
     * @param _collectionSize Number of items in the collection 
     * @param _baseUri Base URI used in token URI generation (incremented)
     */
    constructor(
        address initialOwner,
        string memory tokenName, 
        string memory tokenSymbol, 
        uint256 _maxSupply, 
        uint256 _collectionSize, 
        string memory _baseUri
        ) ERC721(tokenName, tokenSymbol) {
            
        require(_maxSupply >= _collectionSize, "NFT: Collection size cannot exceed max supply.");
        require(bytes(tokenName).length > 0, "NFT: Token name should have a value"); 
        require(bytes(tokenSymbol).length > 0, "NFT: Token symbol should have a value"); 
        require(bytes(_baseUri).length > 0, "NFT: Base URI should have a value"); 
        
        //if an address is passed, it is the owner 
        if (initialOwner == address(0)) {
            initialOwner = msg.sender;
        }
        
        //creator is admin and minter 
        _grantRole(MINTER_ROLE, initialOwner);
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        
        //set state 
        maxSupply = _maxSupply;
        collectionSize = _collectionSize;
        baseUri = _baseUri; 
    }

    /**
     * @dev Pauses the contract execution. Functions like transfer and mint will 
     * revert when contract is paused. 
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpauses the contract execution. 
     * Will revert if contract is not paused. 
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Owner can change the collectionSize - the number of items in the collection. 
     * 
     * @param _collectionSize The new value to set for collectionSize.
     * @param _maxSupply The new value to set for maxSupply.
     */
    function setSupplyParameters(uint256 _maxSupply, uint256 _collectionSize) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_maxSupply >= _collectionSize, "NFT: Collection size cannot exceed max supply.");
        
        maxSupply = _maxSupply;
        collectionSize = _collectionSize;
    }
    
    /**
     * @dev Allows the owner to change the base token URI used to generate new token URIs. 
     * 
     * @param _baseUri The new value of baseUri. 
     */
    function setBaseUri(string memory _baseUri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        baseUri = _baseUri; 
    }

    /**
     * @dev Allows authorized caller (minter role only) to mint one. 
     * 
     * @param to The address of the token recipient once minted. 
     * @return The token ID of the minted token. 
     */
    function mintNext(address to) external override onlyRole(MINTER_ROLE) returns (uint256) {
        return _mintNext(to);
    }
    
    /**
     * @dev Mints the entire collection to the admin or owner (caller). 
     * Will revert if totalSupply() > 0. 
     */
    function initialMint() external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(totalSupply() == 0, "NFT: totalSupply must be zero in order to call initialMint"); 
        for(uint n=0; n<collectionSize; n++) {
            _mintNext(msg.sender);
        }
    }
    
    /**
     * @dev Mints the specified number of items in the collection to the given address. 
     * 
     * If the address contains part of the collection already, starts from the last one 
     * minted to that address. 
     * The last index of the collection won't be exceeded. 
     * @return The number of tokens minted. 
     */
    function multiMint(address to, uint256 count) external override onlyRole(MINTER_ROLE) returns (uint256) {
        require(count <= collectionSize, "NFT: Count cannot exceed collection size"); 
        
        //get the start index & limit
        uint256 startIndex = this.balanceOf(to); 
        uint256 limit = startIndex + count; 
        if (limit > collectionSize) {
            limit = collectionSize;
        }
        
        //mint tokens and count number minted
        uint256 numberMinted = 0;
        for(uint n=startIndex; n<limit; n++) {
            _mintNext(to);
            numberMinted++;
        }
        
        return numberMinted;
    }

    /**
     * @dev Owner of a token may burn or destroy it. 
     * 
     * @param _tokenId The id of the token to burn. 
     */
    function burn(uint256 _tokenId) external virtual {
        //solhint-disable-next-line max-line-length
        require(_isApprovedOrOwner(_msgSender(), _tokenId), "ERC721Burnable: caller is not owner nor approved");
        
        //burn it 
        _burn(_tokenId);
    }

    /**
     * @dev Returns the URI of the specified token. 
     * 
     * @param _tokenId The id of a token whose URI to return.
     * @return string Token URI. 
     */
    function tokenURI(uint256 _tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(_tokenId);
    }

    /**
     * @dev ERC-165 implementation. 
     * 
     * @param _interfaceId An ERC-165 interface id to query. 
     * @return bool Whether or not the interface is supported by this contract. 
     */
    function supportsInterface(bytes4 _interfaceId)
        public
        view
        override(IERC165, ERC721, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return _interfaceId == type(IERC2981).interfaceId || super.supportsInterface(_interfaceId); 
    }
    
    /**
     * @dev ERC-2981: Sets the receiver and percentage for royalties for secondary sales on exchanges. 
     *
     * @param receiver The address to receive royalty payments. 
     * @param feeDenominator- 
     * @param feeNumerator -
     */
    function setRoyaltyInfo(address receiver, uint96 feeNumerator, uint96 feeDenominator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        royaltyReceiver = receiver; 
        royaltyFeeNumerator = feeNumerator; 
        royaltyFeeDenominator = feeDenominator; 
    }
    
    /**
     * @dev ERC-2981: Gets the state information related to royalties on secondary sales.
     * 
     * @return receiver The address to receive royalty payments. 
     * @return feeNumerator []
     * @return feeDenominator []
     */
    function getRoyaltyInfo() external view returns (address receiver, uint96 feeNumerator, uint96 feeDenominator) {
        return (royaltyReceiver, royaltyFeeNumerator, royaltyFeeDenominator);
    }
    
    /**
     * @dev ERC-2981: Disables royalty payments. Enable them by calling setRoyaltyInfo. 
     */
    function clearRoyaltyInfo() external onlyRole(DEFAULT_ADMIN_ROLE) {
        royaltyReceiver = address(0); 
        royaltyFeeDenominator = 0; 
        royaltyFeeNumerator = 0; 
    }
    
    /**
     * @dev ERC-2981 implementation; provides royalty information to exchanges who may or may not use this 
     * to award royalty percentages for future resales. This will return 0x0... for address and 0 
     * for amount if royalties are not enabled for this contract. 
     * Royalties are the same for all token IDs. 
     * 
     * @return receiver The address to receive the royalty fee. 
     * @return amount The amount of royalty as a percentage of the sale price. 
     */
    function royaltyInfo(uint256 /*_tokenId*/, uint256 _salePrice) public view virtual override returns (address receiver, uint256 amount) {
        amount = 0;
        receiver = royaltyReceiver;
        
        if (receiver != address(0) && royaltyFeeDenominator != 0) {
            amount = (_salePrice * royaltyFeeNumerator) / royaltyFeeDenominator;
        }
    }
    
    
    /// NON-PUBLIC METHODS 

    function _beforeTokenTransfer(address _from, address _to, uint256 _tokenId)
        internal
        whenNotPaused
        override(ERC721, ERC721Enumerable)  {
        super._beforeTokenTransfer(_from, _to, _tokenId);
    }
    
    function _burn(uint256 _tokenId) internal override(ERC721, ERC721URIStorage) whenNotPaused {
        super._burn(_tokenId);
    }
    
    function _approve(address to, uint256 tokenId) internal override whenNotPaused {
        super._approve(to, tokenId);
    }
    
    function _concatUri(uint256 _tokenId) private view returns (string memory) {
        return string(abi.encodePacked(baseUri, _tokenId.toString(), ".json"));
    }
    
    function _mintNext(address to) private returns (uint256) {
        require(this.totalSupply() < maxSupply, "NFT: Max supply exceeded"); 
        require(addressMintHistory[to] < collectionSize, "NFT: Max allowed per user exceeded"); 
        
        uint256 tokenId = ++_tokenIdCounter;
        _safeMint(to, tokenId);
        addressMintHistory[to] += 1;
        _setTokenURI(tokenId, _concatUri(addressMintHistory[to]));
        return tokenId;
    }
}