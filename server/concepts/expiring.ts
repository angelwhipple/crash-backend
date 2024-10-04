import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export interface TimedResourceDoc extends BaseDoc {
  resource: ObjectId;
  type: "request" | "event";
  expiry: Date;
}

/**
 * concept: Expiring
 */
export default class ExpiringConcept {
  public readonly active: DocCollection<TimedResourceDoc>;

  constructor(collectionName: string) {
    this.active = new DocCollection<TimedResourceDoc>(collectionName);
  }

  async allocate(resource: ObjectId, type: "request" | "event", expiry: Date,) {
    const _id = await this.active.createOne({ resource, type, expiry });
    return { msg: `Resource of type ${type} with id ${_id} set to expire on ${expiry}`, timed: await this.active.readOne({ _id }) };
  }

  async deallocate(_id: ObjectId) {}

  expire(_id: ObjectId) {}
}