import {
  Bool,
  Field,
  Struct,
} from 'o1js';

type MessageProps = {
  messageNumber: Field
  agentId : Field
  agentXLoc: Field
  agentYLoc: Field
  checkSum: Field
}

export class Message extends Struct({
  messageNumber: Field,
  agentId: Field,
  agentXLoc: Field,
  agentYLoc: Field,
  checkSum: Field
}) {
  constructor(props: MessageProps) {
    super(props)
  }

  private calculateCheckSum(): Field {
    return this.agentId.add(this.agentXLoc).add(this.agentYLoc)
  }

  verifyCheckSum(): Bool {
    const calculatedCheckSum: Field = this.calculateCheckSum()
    return this.checkSum.equals(calculatedCheckSum)
  }

  private isAgentIdZero(): Bool {
    return this.agentId.equals(Field(0))
  }

  private isAgentIdInInterval(): Bool {
    return this.agentId.greaterThanOrEqual(Field(0)).and(this.agentId.lessThanOrEqual(Field(3000)))
  }
  
  verifyAgentId(): Bool {
    let result: Bool = Bool(false)
    result = this.isAgentIdZero().or(this.isAgentIdInInterval())
    return result
  }

  private isLocXInInterval(): Bool {
    return this.agentXLoc.greaterThanOrEqual(Field(0)).and(this.agentXLoc.lessThanOrEqual(Field(15000)))
  }

  private isLocYInInterval(): Bool {
    return this.agentYLoc.greaterThanOrEqual(Field(5000)).and(this.agentYLoc.lessThanOrEqual(Field(20000)))
  }

  private isLocYGtLocX(): Bool {
    return this.agentYLoc.greaterThan(this.agentXLoc)
  }

  verifyAgentLocation(): Bool {
    let result: Bool = Bool(false)
    result = this.isLocXInInterval().and(this.isLocYInInterval()).and(this.isLocYGtLocX())
    return result
  }

  isMessageValid(): Bool {
    let result: Bool = Bool(false)
    let checkResult: Bool = this.verifyCheckSum().and(this.verifyAgentId().and(this.verifyAgentLocation()))
    result = this.isAgentIdZero().or(checkResult)
    return result
  }

  isMessageNumberHigher(highestMessageNumber: Field): Bool {
    return this.messageNumber.greaterThan(highestMessageNumber)
  }

}