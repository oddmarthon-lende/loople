pragma solidity ^0.4.15;

contract Preferences {

  function Preferences() public {

  }

   // Maps a different payout address for an address
   mapping(address => address) internal po_address;

   /*

    Set a different payout address

   */
   function payout(address addr) public {
     po_address[msg.sender] = addr;
   }

   /*

    Get the payout address

   */
   function payout() internal constant returns (address) {
     return po_address[msg.sender];
   }

}
