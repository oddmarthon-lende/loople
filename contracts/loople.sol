pragma solidity ^0.4.15;

import "/Users/lendodd/dev/lib/ethereum/owned.sol";
import "./samples.sol";
import "./preferences.sol";

contract Loople is Samples, Preferences, Owned {

  function Loople() public {

    category("Drums");
    category("Bass");
    category("Guitar");
    category("Synth");
    category("Piano");
    category("Loop");
    category("Sample");
    category("FX");
    category("Vocals");
    category("Other");


  }

  /*

    Get the user profile for the owner of an item.

    returns the name, email, country and avatar

  */
  function profile(uint id) public constant returns (bytes32, bytes32, bytes32, bytes32) {

    assert(id > 0);
    address ow = i_samples[id].owner;
    assert(ow != 0x0);

    User memory u = identity(ow);
    return (u.name, u.email, u.country, u.avatar);

  }

  /*

    Donate to the owner of a sample
  */
  function donate(uint id) payable public {

    assert(id > 0);
    address ow = i_samples[id].owner;
    assert(ow != 0x0);
    address po = po_address[ow];

    if(po == 0x0)
      po = ow;

    po.transfer(msg.value); // <= Throws on failure

    // Vote up ?
    // More ?

  }

  /*
    Donate to the developer
  */
  function donate() payable public {
    owner.transfer(msg.value);
  }

}
