import { 
  Bool,
  Field,
  Provable,
  SmartContract, State, ZkProgram, method, state, 
} from 'o1js';
import { MessageProver } from './MessageProver';

class MessageProof extends ZkProgram.Proof(MessageProver) {}

export class MessageProcessorContract extends SmartContract {
  @state(Field) highestMessageNumber = State<Field>();

  init() {
    super.init();
    this.highestMessageNumber.set(Field(0));
  }

  @method processMessages(messageProver: MessageProof) {
    messageProver.verify()
    let currentHighestMessageNumber = this.highestMessageNumber.get();
    this.highestMessageNumber.requireEquals(currentHighestMessageNumber);

    const proverOutput: Field = messageProver.publicOutput
    
    const shouldMessageNumberUpdated: Bool = proverOutput.greaterThan(currentHighestMessageNumber)
    const newMessageNumberState = Provable.if(shouldMessageNumberUpdated, Field, proverOutput, currentHighestMessageNumber)
  
    this.highestMessageNumber.set(newMessageNumberState);
  }

}