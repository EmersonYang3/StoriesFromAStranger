import { config } from "dotenv";
import { MongoClient } from "mongodb";

config();

export default async (request, context) => {
  const uri = process.env.MONGODB_URI;

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db("NotesDB");
    const collection = database.collection("Notes");

    const method = request.method;
    let responseMessage;

    if (method === "GET") {
      const count = await collection.countDocuments();
      const randomIndex = Math.floor(Math.random() * count);
      const randomDocs = await collection
        .find()
        .skip(randomIndex)
        .limit(1)
        .toArray();

      if (randomDocs.length > 0) {
        const randomDoc = randomDocs[0];
        responseMessage = {
          NoteContent: randomDoc.NoteContent,
          Author: randomDoc.Signed,
        };
        // await collection.deleteOne({ _id: randomDoc._id });
      } else {
        responseMessage = "No document found";
      }
    } else if (method === "POST") {
      console.log("POST!");
      responseMessage = "POST request received";
    } else {
      responseMessage = "Unsupported request method";
    }

    return new Response(JSON.stringify(responseMessage), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(error.toString(), {
      status: 500,
    });
  } finally {
    await client.close();
  }
};
