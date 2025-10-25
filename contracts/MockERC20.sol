// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.5/contracts/token/ERC20/ERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.5/contracts/access/Ownable.sol";

/// @title MockERC20 (test token for SponsorPool)
/// @notice Simple mintable ERC20 for testnet use. Not for production.
contract MockERC20 is ERC20, Ownable {
    constructor(string memory name_, string memory symbol_, uint256 initialSupply) ERC20(name_, symbol_) {
        _mint(msg.sender, initialSupply);
    }

    /// @notice Owner can mint additional tokens (for testing).
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
