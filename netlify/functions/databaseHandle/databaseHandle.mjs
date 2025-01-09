const dotenv = require("dotenv");
const { MongoClient } = require("mongodb");

dotenv.config();

async function getRandomDocument() {
  const uri = process.env.MONGODB_URI;

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
      console.log(`Random document: ${JSON.stringify(randomDoc)}`);
      return randomDoc;
    } else {
      console.log("No document found");
      return { error: "No document found" };
    }
  } catch (error) {
    console.error(`Error: ${error.toString()}`);
    return { error: error.toString() };
  } finally {
    await client.close();
  }
}

exports.handler = async (event, context) => {
  try {
    const randomDoc = await getRandomDocument();
    console.log(`Response document: ${JSON.stringify(randomDoc)}`);

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
