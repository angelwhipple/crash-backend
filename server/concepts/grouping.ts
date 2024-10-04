import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { AlreadyExistsError, BadValuesError, NotAllowedError, NotFoundError } from "./errors";
import { boolean } from "zod";

export interface GroupDoc extends BaseDoc {
  name: string;
  owner: ObjectId; // one User
  members: ObjectId[]; // set User
  capacity: number;
  privacy: boolean;
  location: ObjectId; // one Location
}

/**
 * concept: Grouping
 */
export default class GroupingConcept {
  public readonly groups: DocCollection<GroupDoc>;

  constructor(collectionName: string) {
    this.groups = new DocCollection<GroupDoc>(collectionName);
  }

  async create(name: string, owner: ObjectId, capacity: number, privacy: string, location: ObjectId) {
    const privacySetting = privacy === "true";
    const _id = await this.groups.createOne({ name, owner, members: [owner], capacity: Number(capacity), privacy: privacySetting, location });
    return { msg: `Group ${name} successfully created!`, group: await this.groups.readOne({ _id }) };
  }

  async addUserToGroup(_id: ObjectId, user: ObjectId) {}

  async removeUserFromGroup(group: GroupDoc) {}

  async getAllGroups() {
    return await this.groups.readMany({}, { sort: { _id: -1 } });
  }

  async getByOwner(owner: ObjectId) {
    return await this.groups.readMany({ owner });
  }

  async getByName(name: string) {
    return await this.groups.readMany({ name });
  }

  async getOwner(_id: ObjectId) {
    const group = await this.groups.readOne({ _id });
    return group?.owner!;
  }

  async disband(_id: ObjectId, user: ObjectId) {
    await this.assertOwnerIsUser(_id, user)
    await this.groups.deleteOne({ _id });
    return { msg: "Group disbanded successfully!" };
  }

  async assertOwnerIsUser(_id: ObjectId, user: ObjectId) {
    const group = await this.groups.readOne({ _id });
    if (!group) {
      throw new NotFoundError(`Group with id ${_id} does not exist!`);
    }
    if (group.owner.toString() !== user.toString()) {
      throw new NotAllowedError(`${user} is not the owner of group ${_id}!`);
    }
  }

  async assertGoodInputs(name: string, privateSetting: any, capacity: any) {
    const group = await this.groups.readOne({ name });
    if (group) {
      throw new AlreadyExistsError(`Group with name ${name} already exists!`);
    }
    if (privateSetting !== "true" && privateSetting !== "false") {
      throw new BadValuesError(`Please enter 'true' or 'false' for group privacy.`);
    }
    if (!/^-?\d+(\.\d+)?$/.test(capacity)) {
      throw new BadValuesError('Please enter a numeric capacity!');
    }
  }

  async assertGroupExists(_id: ObjectId) {
    const group = await this.groups.readOne({ _id });
    if (!group) {
      throw new NotFoundError(`Group with id ${_id} does not exist!`);
    }
  }
}