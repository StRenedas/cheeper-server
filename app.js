import express from "express";
import bodyParser from "body-parser";

import {
  getCluster,
  getAllUsers,
  addNewUser,
  addNewMessage,
  addNewFriend,
  countFriends,
  getFriends,
  getMessagesByTime,
} from "./couchbase/couchbaseUsage.js";

import cors from "cors";

const app = express();
const port = 7777;

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(cors());
app.get("/", async (req, res) => {
  const cluster = await getCluster();
  const data = await getAllUsers(cluster);
  res.send(data);
});

app.post("/adduser", async (req, res) => {
  const cluster = await getCluster();
  const user = req.body.user;
  try {
    await addNewUser(cluster, user);
    res.send("User has been added!");
  } catch (e) {
    res.send("Something went wrong!");
  }
});

app.post("/addmessage", async (req, res) => {
  const cluster = await getCluster();
  const message = req.body.message;
  try {
    await addNewMessage(cluster, message.userid, message.text);
    res.send("Message has been added!");
  } catch (e) {
    res.send("Something went wrong!");
  }
});

app.post("/addfriend", async (req, res) => {
  const cluster = await getCluster();
  const friendRequest = req.body.data;
  const result = await addNewFriend(cluster, friendRequest);
  res.send(result);
});

app.post("/countfriends", async (req, res) => {
  const cluster = await getCluster();
  const user_id = req.body.user_id;
  const result = await countFriends(cluster, user_id);
  res.send(`${result}`);
});

app.post("/getfriends", async (req, res) => {
  const cluster = await getCluster();
  const user_id = req.body.user_id;
  const result = await getFriends(cluster, user_id);
  res.send(result);
});

app.post("/getmessagestime", async (req, res) => {
  const cluster = await getCluster();
  const dates = req.body.dates;
  const userID = req.body.user_id;
  const result = await getMessagesByTime(cluster, dates, userID);
  res.send(result);
});

app.listen(port, () => {
  console.log(`Cheeper Server listening on port ${port}`);
});
