// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.5/contracts/access/Ownable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.5/contracts/security/ReentrancyGuard.sol";

/// @dev Minimal interface for the NFT contract to mint tokens.
interface IImpactNFT {
    function mintTo(address to, string calldata tokenURI) external returns (uint256 tokenId);
}

/// @title ImpactRegistry
/// @notice On-chain registry of verified impacts. Optionally mints an NFT upon verification.
/// @dev Owner represents the trusted verifier/orchestrator in the current MVP.
contract ImpactRegistry is Ownable, ReentrancyGuard {
    struct Impact {
        address user;
        string actionType;     // e.g., "Tree Planting"
        string metadataURI;    // e.g., IPFS URI to the proof/metadata JSON
        uint64 timestamp;      // submission time
        uint16 aiScore;        // 0-100
        uint256 reward;        // off-chain accounting or on-chain token amount depending on use
        bool verified;
        uint256 tokenId;       // minted NFT tokenId (if any)
    }

    event ImpactSubmitted(uint256 indexed id, address indexed user, string actionType, string metadataURI);
    event ImpactVerified(uint256 indexed id, uint16 aiScore, uint256 reward, uint256 tokenIdMinted);
    event NFTContractSet(address indexed nft);

    uint256 public nextId;
    mapping(uint256 => Impact) public impacts;
    IImpactNFT public nft;

    /// @notice Set the NFT contract to use when minting on verification (optional).
    function setNFTContract(address nftContract) external onlyOwner {
        nft = IImpactNFT(nftContract);
        emit NFTContractSet(nftContract);
    }

    /// @notice Submit a new impact with action type and metadata URI.
    function submitImpact(string calldata actionType, string calldata metadataURI) external returns (uint256 id) {
        id = ++nextId;
        impacts[id] = Impact({
            user: msg.sender,
            actionType: actionType,
            metadataURI: metadataURI,
            timestamp: uint64(block.timestamp),
            aiScore: 0,
            reward: 0,
            verified: false,
            tokenId: 0
        });
        emit ImpactSubmitted(id, msg.sender, actionType, metadataURI);
    }

    /// @notice Verify a submitted impact; optionally mint an NFT for the user.
    /// @param id Impact id to verify
    /// @param aiScore AI score (0-100)
    /// @param reward Arbitrary reward number (token amount or off-chain reference)
    /// @param mintNFT If true and NFT contract set, mints NFT using metadataURI
    function verifyImpact(uint256 id, uint16 aiScore, uint256 reward, bool mintNFT) external onlyOwner nonReentrant {
        Impact storage imp = impacts[id];
        require(imp.timestamp != 0, "impact not found");
        require(!imp.verified, "already verified");
        require(aiScore <= 100, "aiScore>100");

        imp.aiScore = aiScore;
        imp.reward = reward;
        imp.verified = true;

        uint256 tokenIdMinted = 0;
        if (mintNFT && address(nft) != address(0)) {
            tokenIdMinted = nft.mintTo(imp.user, imp.metadataURI);
            imp.tokenId = tokenIdMinted;
        }

        emit ImpactVerified(id, aiScore, reward, tokenIdMinted);
    }

    function getImpact(uint256 id) external view returns (Impact memory) {
        return impacts[id];
    }
}
