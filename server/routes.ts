import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Authing, Friending, Posting, Sessioning, Grouping, Locating, Requesting } from "./app";
import { PostOptions } from "./concepts/posting";
import { SessionDoc } from "./concepts/sessioning";
import Responses from "./responses";

import { z } from "zod";

/**
 * Web server routes for the app. Implements synchronizations between concepts.
 */
class Routes {
  // Synchronize the concepts from `app.ts`.

  /**
   * USERS
   */

  @Router.get("/session")
  async getSessionUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await Authing.getUsers();
  }

  @Router.get("/users/:username")
  @Router.validate(z.object({ username: z.string().min(1) }))
  async getUser(username: string) {
    return await Authing.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: SessionDoc, username: string, password: string, email: string) {
    Sessioning.isLoggedOut(session);
    return await Authing.create(username, password, email);
  }

  @Router.patch("/users/username")
  async updateUsername(session: SessionDoc, username: string) {
    const user = Sessioning.getUser(session);
    return await Authing.updateUsername(user, username);
  }

  @Router.patch("/users/password")
  async updatePassword(session: SessionDoc, currentPassword: string, newPassword: string) {
    const user = Sessioning.getUser(session);
    return Authing.updatePassword(user, currentPassword, newPassword);
  }

  @Router.delete("/users")
  async deleteUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    Sessioning.end(session);
    await Requesting.deleteBySender(user);
    await Requesting.deleteByRecipient(user);
    return await Authing.delete(user);
  }

  @Router.post("/login")
  async logIn(session: SessionDoc, email: string, password: string) {
    const u = await Authing.authenticate(email, password);
    Sessioning.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: SessionDoc) {
    Sessioning.end(session);
    return { msg: "Logged out!" };
  }

  /**
   * POSTS
   */

  @Router.get("/posts")
  @Router.validate(z.object({ author: z.string().optional() }))
  async getPosts(author?: string) {
    let posts;
    if (author) {
      const id = (await Authing.getUserByUsername(author))._id;
      posts = await Posting.getByAuthor(id);
    } else {
      posts = await Posting.getPosts();
    }
    return Responses.posts(posts);
  }

  @Router.post("/posts")
  async createPost(session: SessionDoc, content: string, options?: PostOptions) {
    const user = Sessioning.getUser(session);
    const created = await Posting.create(user, content, options);
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/posts/:id")
  async updatePost(session: SessionDoc, id: string, content?: string, options?: PostOptions) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertAuthorIsUser(oid, user);
    return await Posting.update(oid, content, options);
  }

  @Router.delete("/posts/:id")
  async deletePost(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertAuthorIsUser(oid, user);
    return Posting.delete(oid);
  }

  /**
   * FRIENDS
   */

  @Router.get("/friends")
  async getFriends(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.idsToUsernames(await Friending.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: SessionDoc, friend: string) {
    const user = Sessioning.getUser(session);
    const friendOid = (await Authing.getUserByUsername(friend))._id;
    return await Friending.removeFriend(user, friendOid);
  }

  @Router.get("/friend/requests")
  async getRequests(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Responses.friendRequests(await Friending.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: SessionDoc, to: string) {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    return await Friending.sendRequest(user, toOid);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: SessionDoc, to: string) {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    return await Friending.removeRequest(user, toOid);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: SessionDoc, from: string) {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    return await Friending.acceptRequest(fromOid, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: SessionDoc, from: string) {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    return await Friending.rejectRequest(fromOid, user);
  }

  /**
   * GROUPS
   */

  @Router.get("/groups")
  async getGroups() {
    return await Grouping.getAllGroups();
  }

  @Router.post("/groups")
  async createGroup(session: SessionDoc, name: string, capacity: number, privacy: string, location: string)  {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(location);
    await Grouping.assertGoodInputs(name, privacy, capacity);
    await Locating.assertLocationExists(oid);
    return await Grouping.create(name, user, capacity, privacy, oid);
  }

  @Router.post("/groups/requests/:id")
  async openGroupRequest(session: SessionDoc, id: string, message?: string) {
    // Want to add an optional parameter, expires: Date
    const groupId = new ObjectId(id);
    await Grouping.assertGroupExists(groupId);
    const sender = Sessioning.getUser(session);
    const recipient = await Grouping.getOwner(groupId);
    return await Requesting.open(sender, recipient, "group", message)
    // Expiring.allocate() for expiring request
  }

  @Router.patch("/groups/requests/:id")
  async replyToGroupRequest(session: SessionDoc, id: string, accept: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    const response =  await Requesting.respond(oid, user, accept);
    if (response.accepted) {
      // Grouping.addUserToGroup(oid, user)
    }
    return response;
  }

  @Router.delete("/groups/:id")
  async disbandGroup(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Requesting.deleteByResourceType(oid, "group");
    return await Grouping.disband(oid, user)
  }

  /**
   * LOCATIONS
   */

  @Router.get("/locations")
  @Router.validate(z.object({ city: z.string().optional(), state: z.string().optional() }))
  async getLocations(city?: string,state?: string) {
    if (city && state) {
      return await Locating.getByCity(city, state);
    } else if (state) {
      return await Locating.getByState(state);
    }
    return await Locating.getLocations();
  }

  @Router.post("/locations")
  async createLocation(name: string, street: string, city: string, state: string, zipcode: string, latitude: number, longitude: number) {
    return await Locating.create(name, street, city, state, zipcode, latitude, longitude);
  }

  @Router.delete("/locations/:id")
  async deleteLocation(id: string) {
    const oid = new ObjectId(id);
    return await Locating.delete(oid);
  }

  /**
   * REQUESTS
   */

  @Router.get("/requests/sent")
  async getSentRequests(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Requesting.getSentRequests(user);
  }

  @Router.get("/requests/received")
  async getReceivedRequests(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Requesting.getReceivedRequests(user);
  }

  @Router.delete("/requests/:id")
  async withdrawRequest(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    return await Requesting.delete(oid, user);
  }

  /**
   * EVENTS
   */

  @Router.post("/events")
  async createEvent(session: SessionDoc, name: string, group: string, startTime: Date, endTime: Date, capacity: number, location: ObjectId) {
    // Sessioning.getUser()
    // Eventing.create()
    // Expiring.allocate()
  }

  @Router.get("/events")
  async getActiveEvents() {
    // Eventing.getAllEvents()
  }

  @Router.get("/events")
  async openEventRequest(session: SessionDoc) {
    // Sessioning.getUser()
    // Eventing.assertEventExists()
    // Eventing.getHost()
    // Requesting.open()
    // Expiring.allocate() for expiring request
  }

  @Router.patch("/events/requests/:id")
  async replyToEventRequest(session: SessionDoc, id: string, accept: string) {
    // Sessioning.getUser()
    // Requesting.respond()
    // Eventing.register()
  }

  @Router.get("/events")
  async unregisterFromEvent(session: SessionDoc) {
    // Sessioning.getUser()
    // Eventing.unregister()
  }

  @Router.delete("/events")
  async deleteEvent(session: SessionDoc, id: string) {
    // Sessioning.getUser()
    // Requesting.deleteByResourceType()
    // Eventing.delete()
    // Eventing.deallocate()
  }

}

/** The web app. */
export const app = new Routes();

/** The Express router. */
export const appRouter = getExpressRouter(app);
