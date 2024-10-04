import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { AlreadyExistsError, BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export interface RequestDoc extends BaseDoc {
  sender: ObjectId; // one User
  recipient: ObjectId; // one User
  type: "friend" | "group" | "event";
  status: "pending" | "declined" | "accepted";
  message?: string;
  resource?: ObjectId; // one Group | Event
  expires?: Date;
}

/**
 * concept: Requesting
 */
export default class RequestingConcept {
  public readonly requests: DocCollection<RequestDoc>;

  constructor(collectionName: string) {
    this.requests = new DocCollection<RequestDoc>(collectionName);
  }

  async open(sender: ObjectId, recipient: ObjectId, type: "friend" | "group" | "event", message?: string) {
    await this.assertNewRequest(sender, recipient, type);
    const _id = await this.requests.createOne({ sender, recipient, type, status: "pending", message });
    return { msg: `Successfully opened ${type} request!`, request: await this.requests.readOne({ _id }) };
  }

  async respond(_id: ObjectId, user: ObjectId, accept: string) {
    await this.assertRequestExists(_id);
    await this.assertUserIsRecipient(_id, user);
    await this.assertValidResponse(accept);
    await this.requests.partialUpdateOne({ _id }, { status: accept === 'true' ? 'accepted' : 'declined' });
    return { msg: `Successfully ${accept ? 'accepted' : 'declined'} request!`, accepted: accept === 'true' };
  }

  async getSentRequests(sender: ObjectId) {
    return await this.requests.readMany({ sender });
  }

  async getReceivedRequests(recipient: ObjectId) {
    return await this.requests.readMany({ recipient });
  }

  async delete(_id: ObjectId, user: ObjectId)  {
    await this.assertRequestExists(_id);
    await this.assertUserIsSender(_id, user);
    await this.requests.deleteOne({ _id });
    return { msg: `Withdrew request ${_id}`};
  }

  async deleteBySender(sender: ObjectId)  {
    await this.requests.deleteMany({ sender });
  }

  async deleteByRecipient(recipient: ObjectId)  {
    await this.requests.deleteMany({ recipient });
  }

  async deleteByResourceType(resource: ObjectId, type: "friend" | "group" | "event")  {
    await this.requests.deleteOne({ resource, type: "group" });
  }

  async assertNewRequest(sender: ObjectId, recipient: ObjectId, type: "friend" | "group" | "event") {
    const request = await this.requests.readOne({ sender, recipient, type });
    if (request) {
      throw new AlreadyExistsError(`Already opened this request!`)
    }
  }

  async assertRequestExists(_id: ObjectId) {
    const request = await this.requests.readOne({ _id })
    if (!request) {
      throw new NotFoundError(`Request with id ${_id} does not exist!`);
    }
  }

  async assertUserIsSender(_id: ObjectId, sender: ObjectId) {
    const request = await this.requests.readOne({ _id, sender })
    if (!request) {
      throw new NotAllowedError(`${sender} is not the sender of request ${_id}!`);
    }
  }

  async assertUserIsRecipient(_id: ObjectId, recipient: ObjectId) {
    const request = await this.requests.readOne({ _id, recipient })
    if (!request) {
      throw new NotAllowedError(`${recipient} is not the recipient of request ${_id}!`);
    }
  }

  async assertValidResponse(reply: any) {
    if (reply !== "true" && reply !== "false") {
      throw new BadValuesError(`Please reply with 'true' or 'false'`);
    }
  }
}