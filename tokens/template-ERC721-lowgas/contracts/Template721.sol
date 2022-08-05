// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./ERC721A/ERC721A.sol"; 
import "hardhat/console.sol";

/**
 * @title TEMPLATE ERC721 FULL 
 * @author John R. Kosinski 
 * 
 * 
 */
contract Template721 is ERC721A {
    address public tokenAdminAddress;
    address public tokenMinterAddress;
    
    uint256 public maxSupply = 5; 
    uint256 public collectionSize = 10; 
    
    mapping(uint256 => uint256) private tokenIdsToUris; 
    
    modifier adminOnly {
        //TODO: use errorName 
        require(hasRole(keccak256("ADMIN"), _msgSenderERC721A()));
        _; 
    }
    
    modifier minterOnly {
        //TODO: use errorName 
        require(hasRole(keccak256("MINTER"), _msgSenderERC721A()));
        _; 
    }
    
    constructor(
        string memory tokenName, 
        string memory tokenSymbol,
        uint256 _maxSupply, 
        uint256 _collectionSize
    ) ERC721A(tokenName, tokenSymbol) {
        require(_collectionSize <= _maxSupply); //TODO: use errorName
        
        tokenAdminAddress = msg.sender; 
        maxSupply = _maxSupply;
        collectionSize = _collectionSize;
    }
    
    function _baseURI() internal pure override returns (string memory) {
        return "ipfs://base_uri/";
    }
    
    function _uriSuffix() internal view virtual returns (string memory) {
        return ".json"; 
    }
    
    function mintNext(address to) external minterOnly {
        _mintNext(to); 
    }
    
    function multiMint(address to, uint256 count) external minterOnly returns(uint256) {
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
    
    function initialMint() external adminOnly {
        require(totalSupply() == 0, "NFT: totalSupply must be zero in order to call initialMint"); 
        for(uint n=0; n<collectionSize; n++) {
            _mintNext(msg.sender);
        }
    }
    
    function burn(uint256 tokenId) external {
        return _burn(tokenId);
    }
    
    function hasRole(bytes32 role, address account) public view returns (bool) {
        if (role == keccak256("ADMIN")) {
            return (account == tokenAdminAddress);
        }
        else if (role == keccak256("MINTER")) {
            return (account == tokenMinterAddress) || (account == tokenAdminAddress);
        }
        
        return false;
    }
    
    function transferRole(bytes32 role, address account) external {
        
    }
    
    function setMinter(address account) external adminOnly {
        tokenMinterAddress = account;
    }
    
    function _startTokenId() internal pure override returns (uint256) {
        return 1;
    }
    
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        if (!_exists(tokenId)) revert URIQueryForNonexistentToken();

        string memory uri = string(abi.encodePacked(_baseURI(), _toString(tokenIdsToUris[tokenId])));        
        return string(abi.encodePacked(uri, _uriSuffix())); 
    }
    
    function setSupplyParameters(uint256 _maxSupply, uint256 _collectionSize) external adminOnly {
        require(_collectionSize <= _maxSupply); //TODO: use errorName
        maxSupply = _maxSupply;
        collectionSize = _collectionSize;
    }
    
    function _mintNext(address to) private returns (uint256) {
        require(this.totalSupply() < maxSupply, "exceeds max supply"); //TODO: errorName
        require(this.balanceOf(to) < collectionSize, "NFT: Max allowed per user exceeded");  //TODO: errorName
            
        uint256 tokenId = _nextTokenId();
        _safeMint(to, 1);
        tokenIdsToUris[tokenId] = this.balanceOf(to);
        return tokenId;
    }
}