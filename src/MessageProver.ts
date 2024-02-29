import { SelfProof, Field, ZkProgram, Provable, Bool } from 'o1js';
import { Message } from './Message';

export const processNewMessage: (currentState: Field, nextMessage: Message) => (Field) = (currentState: Field, nextMessage: Message) => {
  const isNumberHigher: Bool = nextMessage.isMessageNumberHigher(currentState)
  const isMessageValid: Bool = nextMessage.isMessageValid()
  // if !isNumberHigher -> continue
  // if isNumberHigher && !valid -> drop message
  // if isNumberHigher && valid -> update state
  const shouldMessageNumberUpdated: Bool = isNumberHigher.and(isMessageValid)
  const newState = Provable.if(shouldMessageNumberUpdated, Field, nextMessage.messageNumber, currentState)
  return newState
}

export type MessageProverType = typeof MessageProver

export const MessageProver = ZkProgram({
  name: "message-prover",
  publicInput: Field,
  publicOutput: Field,

  methods: {
    baseCase: {
      privateInputs: [],

      method(publicInput: Field) {
        publicInput.assertEquals(Field(0))
        return Field(0)
      },
    },
    
    nextStep: {
      privateInputs: [SelfProof, Field, Message],

      method(
        currentMessageProofState: Field,
        proofSoFar: SelfProof<Field, Field>,
        newMessageProofState: Field,
        nextMessage: Message,
      ) {
        proofSoFar.verify();

        const calculatedMessageProofState = processNewMessage(currentMessageProofState, nextMessage);

        calculatedMessageProofState.assertEquals(newMessageProofState);
        return calculatedMessageProofState;
      },
    },
  },
});