const dotenv = require("dotenv");
const { MongoClient } = require("mongodb");

dotenv.config();

async function getRandomDocument() {
  const uri = process.env.MONGODB_URI;

  console.log(`MongoDB URI: ${uri}`);

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db("NotesDB");
    const collection = database.collection("Notes");

    const count = await collection.countDocuments();
    const randomIndex = Math.floor(Math.random() * count);

    const randomDocs = await collection
      .find()
      .skip(randomIndex)
      .limit(1)
      .toArray();

    if (randomDocs.length > 0) {
      const randomDoc = randomDocs[0];
      await collection.deleteOne({ _id: randomDoc._id });
      return randomDoc;
    } else {
      return { error: "No document found" };
    }
  } catch (error) {
    console.error(`Error: ${error.toString()}`);
    return { error: error.toString() };
  } finally {
    await client.close();
  }
}

async function postNewStory(content) {
  const uri = process.env.MONGODB_URI;

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db("NotesDB");
    const collection = database.collection("Notes");

    await collection.insertOne({
      NoteContent: content.NoteContent,
      Signed: content.Signed,
    });
  } catch (error) {
    console.log(error);
  } finally {
    await client.close();
  }
}

exports.handler = async (event, context) => {
  if (event.method === "POST") {
    await postNewStory(context);
    return { statusCode: 200, headers: { "Content-Type": "application/json" } };
  }

  try {
    const randomDoc = await getRandomDocument();

    return {
      statusCode: 200,
      body: JSON.stringify(randomDoc),
      headers: { "Content-Type": "application/json" },
    };
  } catch (error) {
    console.error(`Error: ${error.toString()}`);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.toString() }),
      headers: { "Content-Type": "application/json" },
    };
  }
};
