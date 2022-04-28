// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Stream is Ownable {
    // ================================================== safe, security declaration
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // ================================================== data structure declaration
    struct UserTreasury {
        address account;
        uint256 reward;
    }

    // ================================================== modifier declaration

    // ================================================== event declaration
    event Stop(address recipient, uint256 amount);
    event Fill(address recipient, uint256 amount);
    event Setup(UserTreasury[] users, uint256 supply);
    event Update(UserTreasury[] users, uint256 supply);
    event Claim(address indexed from, address indexed to, uint256 value);

    // ================================================== error declaration

    // ================================================== data storage
    IERC20 internal _token; // reward token for airdrop. in this case it will be USDT.

    uint256 internal _total = 0;
    uint256 internal _quantity = 0;

    uint256 internal _startTimeStamp = 0;
    uint256 internal _endTimeStamp = 0;
    uint256 internal _isActive = 0; // inacitve: 0, active: 1, pause: 2

    mapping(address => uint256) internal _claimed;
    mapping(address => uint256) internal _treasury;

    // ================================================== constructor
    constructor(address token) {
        _token = IERC20(token);
    }

    // ================================================== owner only
    function deActivate() external onlyOwner
    {
        // declarations
        address _recipient = msg.sender;

        // validation
        require(_isActive == 1, "the contract is inactive");

        // transfer
        _isActive = 2;
        _token.transfer(_recipient, _total);

        // event
        emit Stop(_recipient, _total);
    }

    function activate(uint256 startTimestamp, uint256 endTimestamp)
        external
        onlyOwner
    {
        // declarations
        address _recipient = address(this);
        address _sender = msg.sender;

        // validation
        require(_isActive == 0, "the contract is active");
        require(_quantity > 0, "setup airdrop list first");
        require(
            endTimestamp >= startTimestamp,
            "endTimestamp < startTimestamp"
        );

        // transfer
        _token.transferFrom(_sender, _recipient, _total);
        _startTimeStamp = startTimestamp;
        _endTimeStamp = endTimestamp;
        _isActive = 1;

        // event
        emit Fill(_recipient, _total);
    }

    function init(UserTreasury[] memory users) external onlyOwner {
        //validation
        require(_isActive == 0, "use update function");

        uint256 _sum = 0;

        for (uint256 i = 0; i < users.length; i++) {
            require(users[i].reward > 0, "reward should > 0");
            _treasury[users[i].account] = users[i].reward;
            _sum += users[i].reward;
        }

        _total = _sum;

        _quantity = users.length;

        // event
        emit Setup(users, _total);
    }

    // ================================================== util functions

    // ================================================== read functions
    function information() external view returns (uint256, address, uint256, uint256, uint256, uint256) {
        return (_isActive, address(_token), _startTimeStamp, _endTimeStamp, _total, _quantity);
    }

    function informationReward(address account) external view returns (uint256, uint256, uint256, uint256) {
        return (totalReward(account), availableReward(account), claimedReward(account), remainReward(account));
    }

    function isActive() external view returns (uint256) {
        return _isActive;
    }

    function rewardToken() external view returns (address) {
        return address(_token);
    }

    function period() external view returns (uint256, uint256) {
        return (_startTimeStamp, _endTimeStamp);
    }

    function total() external view returns (uint256) {
        return _total;
    }

    function quantity() external view returns (uint256) {
        return _quantity;
    }

    function totalReward(address account) public view returns (uint256) {
        return _treasury[account];
    }

    function availableReward(address account) public view returns (uint256) {
        if (_isActive == 0) {
            return 0;
        }

        if (block.timestamp >= _endTimeStamp) {
            return _treasury[account];
        }

        uint256 _period = _endTimeStamp - _startTimeStamp;
        uint256 _passed = block.timestamp - _startTimeStamp;
        uint256 _percentage = _passed / (_period / 100);

        return (_treasury[account] / 100) * _percentage;
    }

    function claimedReward(address account) public view returns (uint256) {
        if (_claimed[account] <= 0) {
            return 0;
        }
        return _claimed[account];
    }

    function remainReward(address account) public view returns (uint256) {
        return availableReward(account) - claimedReward(account);
    }

    // ================================================== write functions
    // transfer from contract to sender
    function claim() external {
        // declarations
        address _recipient = msg.sender;
        address _sender = address(this);
        uint256 _recipientBalance = remainReward(_recipient);
        uint256 _senderBalance = _token.balanceOf(_sender);

        // validations
        require(_isActive == 1, "contract is inactive");

        require(
            _senderBalance >= _recipientBalance,
            "no enough balance being claimed"
        ); // This should not happened.

        // transfer
        _claimed[_recipient] += _recipientBalance;
        _token.transfer(_recipient, _recipientBalance);

        // event
        emit Claim(_sender, _recipient, _recipientBalance);
    }
}
