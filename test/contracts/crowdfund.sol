contract crowdfund {

  address public beneficiary;
  uint256 public goal;
  uint256 public deadline;

  struct Funder {
    address addr;
    uint256 value;
  }

  Funder[] funders;

  function crowdfund(address _beneficiary, uint256 _goal, uint256 _timelimit) {
    beneficiary = _beneficiary;
    goal = _goal;
    deadline = now + _timelimit;
  }

  function getBeneficiary() constant returns (address) {
    return beneficiary;
  }

  function contribute() payable {
    funders.push(Funder(msg.sender, msg.value));
  }

  function payout() {
    if(this.balance >= goal && now > deadline) beneficiary.send(this.balance);
  }

  function refund() {
    if(msg.sender != beneficiary) throw;
    uint256 index = 0;
    while (index < funders.length) {
      funders[index].addr.send(funders[index].value);
      index++;
    }
  }

}
