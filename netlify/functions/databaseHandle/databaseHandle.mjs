const dotenv = require("dotenv");
const { MongoClient, ObjectId } = require("mongodb");

dotenv.config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function getRandomDocument() {
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
      const doc = randomDocs[0];

      const updatedDoc = await collection.findOneAndUpdate(
        { _id: doc._id },
        { $inc: { views: 1 } },
        { returnDocument: "after" }
      );

      if (
        updatedDoc.value.views >= updatedDoc.value.ViewExpiration &&
        updatedDoc.value.ViewExpiration > 0
      ) {
        await collection.deleteOne({ _id: doc._id });
      }

      return updatedDoc.value;
    } else {
      return {
        NoteContent:
          "Hey! Sorry it seems like there's no stories at the moment. Try posting a story of your own or try again later, thanks!!!",
        Signed: "LucilleLovesMelodie <3",
      };
    }
  } catch (error) {
    console.error(`Error: ${error.toString()}`);
    return { error: error.toString() };
  }
}

async function postNewStory(content) {
  try {
    await client.connect();
    const database = client.db("NotesDB");
    const collection = database.collection("Notes");

    const result = await collection.insertOne({
      NoteContent: content.NoteContent,
      Signed: content.Signed,
      ViewExpiration: content.ViewExpiration,
      views: 0,
      upvotes: 0,
      downvotes: 0,
    });

    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function updateVote(noteId, voteType, flipped) {
  try {
    await client.connect();
    const database = client.db("NotesDB");
    const collection = database.collection("Notes");

    const updateField = voteType === "upvote" ? "upvotes" : "downvotes";
    const oppositeField = voteType === "upvote" ? "downvotes" : "upvotes";

    const update = { $inc: { [updateField]: 1 } };

    if (flipped) {
      update.$inc[oppositeField] = -1;
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(noteId) },
      update,
      { returnDocument: "after" }
    );

    if (result) {
      return {
        upvotes: result.upvotes,
        downvotes: result.downvotes,
      };
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function flagNote(noteId) {
  try {
    await client.connect();
    const database = client.db("NotesDB");
    const collection = database.collection("Notes");
    const note = await collection.findOne({ _id: new ObjectId(noteId) });

    const webhookUrl = process.env.DiscoHookURL;
    const message = {
      content: `A note has been flagged:\nID: ${noteId}\nContent: ${note.NoteContent}\nAuthor: ${note.Signed}`,
    };

    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    return { success: true };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

exports.handler = async (event, context) => {
  if (event.httpMethod === "POST") {
    const data = JSON.parse(event.body);

    if (data.action === "upvote" || data.action === "downvote") {
      const result = await updateVote(data.noteId, data.action, data.flipped);
      return {
        statusCode: 200,
        body: JSON.stringify(result),
        headers: { "Content-Type": "application/json" },
      };
    } else if (data.action === "flag") {
      await flagNote(data.noteId);
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true }),
        headers: { "Content-Type": "application/json" },
      };
    } else {
      const result = await postNewStory(data);
      return {
        statusCode: 200,
        body: JSON.stringify(result),
        headers: { "Content-Type": "application/json" },
      };
    }
  } else if (event.httpMethod === "GET") {
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
  }
};
