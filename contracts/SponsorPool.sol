// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.5/contracts/access/Ownable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.5/contracts/token/ERC20/IERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.5/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title SponsorPool
/// @notice Simple pool for collecting ERC20 contributions and distributing to recipients by weights.
/// @dev Owner triggers distribution; uses SafeERC20 for transfers.
contract SponsorPool is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable token; // e.g., cUSD on Celo
    uint256 public totalContributions;
    mapping(address => uint256) public contributions;

    event Contributed(address indexed from, uint256 amount);
    event Distributed(uint256 totalAmount, uint256 recipientCount);
    event Withdrawn(address indexed to, uint256 amount);

    constructor(address token_) {
        require(token_ != address(0), "invalid token");
        token = IERC20(token_);
    }

    /// @notice Contribute `amount` tokens to the pool (requires prior approval).
    function contribute(uint256 amount) external {
        require(amount > 0, "amount=0");
        token.safeTransferFrom(msg.sender, address(this), amount);
        contributions[msg.sender] += amount;
        totalContributions += amount;
        emit Contributed(msg.sender, amount);
    }

    /// @notice Distribute `totalAmount` tokens to `recipients` according to `weights`.
    /// @dev Rounding dust stays in contract for future rounds.
    function distribute(address[] calldata recipients, uint256[] calldata weights, uint256 totalAmount) external onlyOwner {
        require(recipients.length == weights.length, "len mismatch");
        require(recipients.length > 0, "empty");
        require(totalAmount > 0, "amount=0");
        require(token.balanceOf(address(this)) >= totalAmount, "insufficient funds");

        uint256 sumWeights = 0;
        for (uint256 i = 0; i < weights.length; i++) {
            sumWeights += weights[i];
        }
        require(sumWeights > 0, "sumWeights=0");

        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 share = (totalAmount * weights[i]) / sumWeights;
            if (share > 0) {
                token.safeTransfer(recipients[i], share);
            }
        }

        emit Distributed(totalAmount, recipients.length);
    }

    /// @notice Owner can withdraw leftover tokens (e.g., dust or emergency stop).
    function withdraw(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "zero to");
        token.safeTransfer(to, amount);
        emit Withdrawn(to, amount);
    }
}
