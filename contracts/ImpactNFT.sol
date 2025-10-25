// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// OpenZeppelin imports via GitHub URLs for easy Remix usage
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.5/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.5/contracts/access/Ownable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.5/contracts/utils/Counters.sol";

/// @title ImpactNFT
/// @notice Simple ERC721 to mint Proof-of-Impact NFTs with per-token metadata URIs.
/// @dev Owner can authorize additional minters (e.g., ImpactRegistry) to call mint.
contract ImpactNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;
    mapping(address => bool) public isMinter;

    event MinterUpdated(address indexed account, bool allowed);

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {}

    function setMinter(address account, bool allowed) external onlyOwner {
        isMinter[account] = allowed;
        emit MinterUpdated(account, allowed);
    }

    /// @notice Mint a new NFT to `to` with a token URI.
    /// @dev Callable by owner or authorized minters.
    function mintTo(address to, string memory tokenURI) external returns (uint256 tokenId) {
        require(isMinter[msg.sender] || msg.sender == owner(), "not authorized");
        _tokenIdCounter.increment();
        tokenId = _tokenIdCounter.current();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
    }
}
