require("dotenv").config();
const { MongoClient } = require("mongodb");

const logUser = async (event, context) => {
  const uri = process.env.MONGODB_URI;

  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    const database = client.db("UsersDB");
    const collection = database.collection("UserData");

    await collection.updateOne(
      { _id: "TotalUsers" },
      { $inc: { count: 1 } },
      { upsert: true }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "User count incremented." }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to log user." }),
    };
  } finally {
    await client.close();
  }
};

exports.handler = logUser;
