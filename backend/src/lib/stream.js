import { StreamChat } from "stream-chat";
import "dotenv/config";

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

if (!apiKey || !apiSecret) {
  console.error("Stream API key or secret is missing");
}

const StreamClient = StreamChat.getInstance(apiKey, apiSecret);

export const upsertStreamUser = async (userData) => {
  try {
    await StreamClient.upsertUsers([userData]); //upsert - either create or update it
    return userData;
  } catch (error) {
    console.log("error upserting stream user");
  }
};

export const generateStreamToken = async (userId) => {};
