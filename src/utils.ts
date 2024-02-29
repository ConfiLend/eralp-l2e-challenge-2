import { Field, PublicKey, PrivateKey } from "o1js"
import { Message } from "./Message"

export type TestAccount = {
  publicKey: PublicKey
  privateKey: PrivateKey
}

function getRandomInteger(min: number, max: number): number {
  const randomFactor = Math.random();
  const randomNumber = Math.floor(min + randomFactor * (max - min + 1)); // +1 to include the max value
  return randomNumber;
}

export const findHighestMessageNumber: (listOfMessages: Message[]) => Field = (listOfMessages: Message[]) => {
  let highestMessageNumber: Field = Field(0)
  for (let message of listOfMessages) {
    if (message.messageNumber.greaterThan(highestMessageNumber)) {
      highestMessageNumber = message.messageNumber
    }
  }
  return highestMessageNumber
}

export const generateRandomValidMessage = (index: number, numberOfMessages: number, orderedMessageNumber: boolean) => {
  let messageNumber: Field,
  agentId: Field,
  agentXLoc: Field,
  agentYLoc: Field,
  checkSum: Field 

  if (orderedMessageNumber) {
    messageNumber = new Field(index)
  } else {
    const randomMessageNumber: number = getRandomInteger(0, numberOfMessages * 100)
    messageNumber = new Field(randomMessageNumber)
  }
  
  const randomAgentId: number = getRandomInteger(0, 3000)
  const randomXLoc: number = getRandomInteger(0, 15000)
  let randomYLoc: number = getRandomInteger(5000, 20000)
  while (randomYLoc <= randomXLoc) {
    randomYLoc = getRandomInteger(5000, 20000)
  }
  const calculatedCheckSum: number = randomAgentId + randomXLoc + randomYLoc
  agentId = new Field(randomAgentId)
  agentXLoc = new Field(randomXLoc)
  agentYLoc = new Field(randomYLoc)
  checkSum = new Field(calculatedCheckSum)

  let message = new Message({messageNumber, agentId, agentXLoc, agentYLoc, checkSum})
  return message
}


export const generateRandomValidMessages: (numberOfMessages: number, orderedMessageNumber: boolean) => Message[] = (numberOfMessages: number, orderedMessageNumber: boolean) => {
  let listOfMessages: Message[] = []
  for (let index = 0; index < numberOfMessages; index++) {
    const message = generateRandomValidMessage(index, numberOfMessages, orderedMessageNumber)
    listOfMessages.push(message)
  }
  return listOfMessages
}