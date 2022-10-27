import couchbase from "couchbase";
import dotenv from "dotenv";
dotenv.config();

async function getCluster() {
  const clusterConnStr = "couchbase://localhost";
  const username = process.env.USERNAME;
  const password = process.env.PASSWORD;
  const bucketName = "Cheeper";
  return await couchbase.connect(clusterConnStr, {
    username: username,
    password: password,
  });
}

async function getLastUserID(cluster) {
  const id = await cluster.query(
    "SELECT meta().id FROM Cheeper._default.Users order by meta().id desc limit 1"
  );
  return parseInt(id.rows[0].id);
}

async function getLastMessageID(cluster) {
  const id = await cluster.query(
    "SELECT meta().id FROM Cheeper._default.Messages order by meta().id desc limit 1"
  );
  return parseInt(id.rows[0].id);
}

async function getAllUsers(cluster) {
  const retrieved = await cluster.query("SELECT * FROM Cheeper._default.Users");
  return retrieved.rows.map((row) => row.Users);
}

async function addNewUser(cluster, user) {
  const id = (await getLastUserID(cluster)) + 1 || 1;
  await cluster
    .bucket("Cheeper")
    .collection("Users")
    .insert(id, { id, ...user, friendsWith: [] });
}

async function addNewMessage(cluster, userid, message) {
  const id = (await getLastMessageID(cluster)) + 1 || 1;
  const date = new Date();

  return await cluster
    .bucket("Cheeper")
    .collection("Messages")
    .insert(id, { userID: userid, message, date_time: date });
}

async function addNewFriend(cluster, data) {
  const friendID = data.friend_id;
  const userID = data.user_id;
  const date = new Date();
  const formattedDate = `${date.getDate()}-${
    date.getMonth() + 1
  }-${date.getFullYear()}`;
  return await cluster.query(
    `UPDATE Cheeper._default.Users as U SET U.friendsWith = ARRAY_APPEND(U.friendsWith, {"friendID": ${friendID}, "friendsFrom": "${formattedDate}"}) WHERE id = ${userID}`
  );
}

async function countFriends(cluster, userID) {
  try {
    const result = await cluster.query(
      `SELECT friendsWith FROM Cheeper._default.Users WHERE id = ${userID}`
    );
    return result.rows[0].friendsWith.length;
  } catch (e) {
    return e;
  }
}

async function getFriends(cluster, userID) {
  try {
    const result = await cluster.query(
      `SELECT friendsWith FROM Cheeper._default.Users WHERE id = ${userID}`
    );
    const friendsIDs = result.rows[0].friendsWith.map(
      (friend) => friend.friendID
    );
    const friendsNames = await cluster.query(
      "SELECT name FROM Cheeper._default.Users WHERE id in $FRIENDS",
      { parameters: { $FRIENDS: friendsIDs } }
    );

    return friendsNames.rows.map((friend) => friend.name);
  } catch (e) {
    console.log(e);
  }
}

async function getMessagesByTime(cluster, dates, userID) {
  const result = await cluster.query(
    "SELECT * FROM Cheeper._default.Messages WHERE userID = $USERID AND date_time BETWEEN $DATE1 AND $DATE2",
    { parameters: { $DATE1: dates.from, $DATE2: dates.to, $USERID: userID } }
  );
  return result.rows.map((row) => row.Messages);
}

export {
  getCluster,
  getAllUsers,
  addNewUser,
  addNewMessage,
  addNewFriend,
  countFriends,
  getFriends,
  getMessagesByTime,
};
