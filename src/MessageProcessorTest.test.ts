import { Message } from './Message.js';
import { MessageProcessorContract } from './MessageProcessorContract.js';
import {
  Mina,
  PrivateKey,
  AccountUpdate,
  PublicKey,
  Field,
  verify,
  SelfProof,
} from 'o1js';
import { TestAccount, findHighestMessageNumber, generateRandomValidMessage, generateRandomValidMessages } from './utils.js';
import { MessageProver, processNewMessage } from './MessageProver.js';

const AVAILABLE_TEST_ACCOUNTS_IN_LOCAL = 10
const verificationKey = (await MessageProver.compile()).verificationKey

describe('Message Processor service', () => {
  let
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkAppInstance: MessageProcessorContract,
    localTestAccounts: TestAccount[] = [],
    recentMessageProofState: Field,
    proof: SelfProof<Field, Field>
  
  beforeAll(async () => {
    const useProof = false;

    const Local = Mina.LocalBlockchain({ proofsEnabled: useProof });
    Mina.setActiveInstance(Local);
    const { privateKey: deployerKey, publicKey: deployerAccount } = Local.testAccounts[0];

    // ----------------------------------------------------

    // Create a public/private key pair. The public key is your address and where you deploy the zkApp to
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();

    // create an instance of MessageProcessorContract - and deploy it to zkAppAddress
    zkAppInstance = new MessageProcessorContract(zkAppAddress);
    const deployTxn = await Mina.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      zkAppInstance.deploy();
    });
    
    await deployTxn.prove()

    await deployTxn.sign([deployerKey, zkAppPrivateKey]).send();

    // prepare test accounts
    for (let idx = 1; idx <= AVAILABLE_TEST_ACCOUNTS_IN_LOCAL; idx++) {
      const currentTestAccount: TestAccount = Local.testAccounts[idx];
      localTestAccounts.push(currentTestAccount)
    }
  
    recentMessageProofState = new Field(0)
  })

  test('if contract is successfully initialized', async () => {
    const initialValue = zkAppInstance.highestMessageNumber.get();
    expect(initialValue).toEqual(Field(0));
  })

  test('if MessageProver ZkProgram is successfully initialized', async () => {
    proof = await MessageProver.baseCase(new Field(0));
    await verify(proof.toJSON(), verificationKey);
  })

  test('if one message is successfully processed', async () => {
    const randomValidMessage: Message = generateRandomValidMessage(1, 1, true)
    const newMessageProofState = processNewMessage(recentMessageProofState, randomValidMessage)

    proof = await MessageProver.nextStep(proof.publicOutput, proof, newMessageProofState, randomValidMessage)

    const { privateKey: senderKey, publicKey: senderAccount } = localTestAccounts[0];

    let txn = await Mina.transaction(senderAccount, () => {
      zkAppInstance.processMessages(proof);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const highestMessageNumber = await zkAppInstance.highestMessageNumber.get();
    highestMessageNumber.assertEquals(Field(1));

    recentMessageProofState = newMessageProofState;
  })

  test('if new message is failed in the case that agent id is not in range', async () => {
    const message: Message = new Message({messageNumber: new Field(2), agentId: new Field(3005), agentXLoc: new Field(100), agentYLoc: new Field(5000), checkSum: new Field(8105)})
    const newMessageProofState = processNewMessage(recentMessageProofState, message)
    proof = await MessageProver.nextStep(proof.publicOutput, proof, newMessageProofState, message)
    const { privateKey: senderKey, publicKey: senderAccount } = localTestAccounts[0];

    let txn = await Mina.transaction(senderAccount, () => {
      zkAppInstance.processMessages(proof);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const highestMessageNumber = await zkAppInstance.highestMessageNumber.get();
    highestMessageNumber.assertEquals(Field(1));

    recentMessageProofState = newMessageProofState;
  })

  test('if new message is failed in the case that agent location X is not in range', async () => {
    const message: Message = new Message({messageNumber: new Field(2), agentId: new Field(2000), agentXLoc: new Field(160000), agentYLoc: new Field(19000), checkSum: new Field(37000)})
    const newMessageProofState = processNewMessage(recentMessageProofState, message)
    proof = await MessageProver.nextStep(proof.publicOutput, proof, newMessageProofState, message)
    const { privateKey: senderKey, publicKey: senderAccount } = localTestAccounts[0];

    let txn = await Mina.transaction(senderAccount, () => {
      zkAppInstance.processMessages(proof);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const highestMessageNumber = await zkAppInstance.highestMessageNumber.get();
    highestMessageNumber.assertEquals(Field(1));

    recentMessageProofState = newMessageProofState;
  })

  test('if new message is failed in the case that agent location Y is not in range', async () => {
    const message: Message = new Message({messageNumber: new Field(2), agentId: new Field(2000), agentXLoc: new Field(100000), agentYLoc: new Field(21000), checkSum: new Field(33000)})
    const newMessageProofState = processNewMessage(recentMessageProofState, message)
    proof = await MessageProver.nextStep(proof.publicOutput, proof, newMessageProofState, message)
    const { privateKey: senderKey, publicKey: senderAccount } = localTestAccounts[0];

    let txn = await Mina.transaction(senderAccount, () => {
      zkAppInstance.processMessages(proof);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const highestMessageNumber = await zkAppInstance.highestMessageNumber.get();
    highestMessageNumber.assertEquals(Field(1));

    recentMessageProofState = newMessageProofState;
  })

  test('if new message is failed in the case that agent location Y is smaller than location X', async () => {
    const message: Message = new Message({messageNumber: new Field(2), agentId: new Field(2000), agentXLoc: new Field(100000), agentYLoc: new Field(8000), checkSum: new Field(20000)})
    const newMessageProofState = processNewMessage(recentMessageProofState, message)
    proof = await MessageProver.nextStep(proof.publicOutput, proof, newMessageProofState, message)
    const { privateKey: senderKey, publicKey: senderAccount } = localTestAccounts[0];

    let txn = await Mina.transaction(senderAccount, () => {
      zkAppInstance.processMessages(proof);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const highestMessageNumber = await zkAppInstance.highestMessageNumber.get();
    highestMessageNumber.assertEquals(Field(1));

    recentMessageProofState = newMessageProofState;
  })

  test('if new message is failed in the case that agent location Y is equals to location X', async () => {
    const message: Message = new Message({messageNumber: new Field(2), agentId: new Field(2000), agentXLoc: new Field(6000), agentYLoc: new Field(6000), checkSum: new Field(14000)})
    const newMessageProofState = processNewMessage(recentMessageProofState, message)
    proof = await MessageProver.nextStep(proof.publicOutput, proof, newMessageProofState, message)
    const { privateKey: senderKey, publicKey: senderAccount } = localTestAccounts[0];

    let txn = await Mina.transaction(senderAccount, () => {
      zkAppInstance.processMessages(proof);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const highestMessageNumber = await zkAppInstance.highestMessageNumber.get();
    highestMessageNumber.assertEquals(Field(1));

    recentMessageProofState = newMessageProofState;
  })

  test('if new message is failed in the case that check sum is wrong', async () => {
    const message: Message = new Message({messageNumber: new Field(2), agentId: new Field(2000), agentXLoc: new Field(100000), agentYLoc: new Field(12000), checkSum: new Field(30000)})
    const newMessageProofState = processNewMessage(recentMessageProofState, message)
    proof = await MessageProver.nextStep(proof.publicOutput, proof, newMessageProofState, message)
    const { privateKey: senderKey, publicKey: senderAccount } = localTestAccounts[0];

    let txn = await Mina.transaction(senderAccount, () => {
      zkAppInstance.processMessages(proof);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const highestMessageNumber = await zkAppInstance.highestMessageNumber.get();
    highestMessageNumber.assertEquals(Field(1));

    recentMessageProofState = newMessageProofState;
  })

  test('if new message is successful in the case that message number is smaller', async () => {
    const message: Message = new Message({messageNumber: new Field(0), agentId: new Field(2000), agentXLoc: new Field(6000), agentYLoc: new Field(8000), checkSum: new Field(16000)})
    const newMessageProofState = processNewMessage(recentMessageProofState, message)
    proof = await MessageProver.nextStep(proof.publicOutput, proof, newMessageProofState, message)
    const { privateKey: senderKey, publicKey: senderAccount } = localTestAccounts[0];

    let txn = await Mina.transaction(senderAccount, () => {
      zkAppInstance.processMessages(proof);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const highestMessageNumber = await zkAppInstance.highestMessageNumber.get();
    highestMessageNumber.assertEquals(Field(1));

    recentMessageProofState = newMessageProofState;
  })

  test('if new message is successful in the case that agent location Y is higher than location X and all other checks are satisfied', async () => {
    const message: Message = new Message({messageNumber: new Field(2), agentId: new Field(2000), agentXLoc: new Field(6000), agentYLoc: new Field(8000), checkSum: new Field(16000)})
    const newMessageProofState = processNewMessage(recentMessageProofState, message)
    proof = await MessageProver.nextStep(proof.publicOutput, proof, newMessageProofState, message)
    const { privateKey: senderKey, publicKey: senderAccount } = localTestAccounts[0];

    let txn = await Mina.transaction(senderAccount, () => {
      zkAppInstance.processMessages(proof);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const highestMessageNumber = await zkAppInstance.highestMessageNumber.get();
    highestMessageNumber.assertEquals(Field(2));

    recentMessageProofState = newMessageProofState;
  })

  test('if new message is successful in the case agent id 0 and all other checks wrong', async () => {
    const message: Message = new Message({messageNumber: new Field(3), agentId: new Field(0), agentXLoc: new Field(16000), agentYLoc: new Field(8000), checkSum: new Field(30000)})
    const newMessageProofState = processNewMessage(recentMessageProofState, message)
    proof = await MessageProver.nextStep(proof.publicOutput, proof, newMessageProofState, message)
    const { privateKey: senderKey, publicKey: senderAccount } = localTestAccounts[0];

    let txn = await Mina.transaction(senderAccount, () => {
      zkAppInstance.processMessages(proof);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const highestMessageNumber = await zkAppInstance.highestMessageNumber.get();
    highestMessageNumber.assertEquals(Field(3));

    recentMessageProofState = newMessageProofState;
  })

  test('50 random valid messages with ordered message number', async () => {
    const randomValidMessages: Message[] = generateRandomValidMessages(50, true)
    const highestMessageNumber: Field = findHighestMessageNumber(randomValidMessages)

    for (let message of randomValidMessages) {
      const newMessageProofState = processNewMessage(recentMessageProofState, message)
      proof = await MessageProver.nextStep(proof.publicOutput, proof, newMessageProofState, message)
      recentMessageProofState = newMessageProofState;
    }
    const { privateKey: senderKey, publicKey: senderAccount } = localTestAccounts[0];

    const txn = await Mina.transaction(senderAccount, () => {
      zkAppInstance.processMessages(proof);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const updatedMessageNumber = zkAppInstance.highestMessageNumber.get();
    expect(updatedMessageNumber).toEqual(highestMessageNumber);
  })
})