import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export interface EventDoc extends BaseDoc {
  name: string;
  group: ObjectId; // one Group
  host: ObjectId; // one User
  attendees: ObjectId[]; // set User
  start: Date;
  end: Date;
  capacity: number;
  location: ObjectId; // one Location
}

/**
 * concept: Eventing
 */
export default class EventingConcept {
  public readonly events: DocCollection<EventDoc>;

  constructor(collectionName: string) {
    this.events = new DocCollection<EventDoc>(collectionName);
  }

  async create() {}

  async getAllEvents() {
    return await this.events.readMany({}, { sort: { _id: -1 } });
  }

  async getByName() {
    // Allow partial matching by name
  }

  async getHost(_id: ObjectId) {}

  async register(_id: ObjectId, attendee: ObjectId) {}

  async unregister(_id: ObjectId, attendee: ObjectId) {}

  async delete(_id: ObjectId) {}

  async assertNotAtCapacity(_id: ObjectId) {
    const event = await this.events.readOne({ _id });
    if (!event) {
      throw new NotFoundError(`Event with id ${_id} not found!`);
    }
    if (event.attendees.length === event.capacity) {
      throw new EventMaxCapacityError(_id);
    }
  }
}

export class EventMaxCapacityError extends NotAllowedError {
  constructor(
    public readonly _id: ObjectId,
  ) {
    super("Event {0} is at max capacity!", _id);
  }
}