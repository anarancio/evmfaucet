pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EvmFaucet
 * @dev A faucet contract that allows users to request a small amount of ETH
 * @dev Users can request ETH once every 24 hours
 * @dev The contract has a balance that can be funded by the owner
 * @dev The owner can also change the amount of ETH given on each request
 */
contract EvmFaucet is Ownable {
    mapping(address => uint256) public requests;
    uint256 public transferEthAmount;

    /**
     * @dev constructor to set the default value of transferEthAmount
     */
    constructor() {
        transferEthAmount = 10000000000000000; // 0.01 ETH in wei
    }

    /**
     * @dev function to request a small amount of ETH
     * @dev The function checks if the contract has enough balance
     * @dev The function also checks if the user has requested before
     * @dev If all the conditions are met, the function will transfer the amount stored in transferEthAmount to the user address
     * @param _to address to send the eth
     */
    function requestEth(address _to) public {
        require(address(this).balance >= transferEthAmount, "The contract balance is insufficient");
        require(_to != address(0), "Request not allowed from address 0x0");
        require(block.timestamp - requests[_to] >= 86400, "You must wait 24 hours to request again"); // 24 hours in seconds
        payable(_to).transfer(transferEthAmount);
        requests[_to] = block.timestamp;
    }

    /**
     * @dev receive function to receive ETH to fund the contract
     * @dev the function checks that the value received is greater than zero, otherwise it will throw an error message
     */
    receive() payable external {
        require(msg.value > 0, "You must send a positive value");
    }
    
    /**
     * @dev function that allows the owner to withdraw the contract balance
     * @dev the function checks that the contract has a balance greater than zero
     * @dev The function will be executed only by the owner of the contract
     */
    function withdraw() public onlyOwner {
        require(address(this).balance > 0, "The contract balance is zero");
        payable(msg.sender).transfer(address(this).balance);
    }

    /**
     * @dev function that allows the owner to change the value of the transferEthAmount
     * @param _amount new amount that should be equal or greater than zero
     * @dev The function will be executed only by the owner of the contract
     */
    function setTransferEthAmount(uint256 _amount) public onlyOwner {
        require(_amount >= 0, "The amount must be greater or equal to zero");
        transferEthAmount = _amount;
    }
}
