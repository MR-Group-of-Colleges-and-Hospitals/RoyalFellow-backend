import express, { Application } from "express";
import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import { connect, getDbStatus } from "../config/db.config";

const app: Application = express();

const PORT = process.env.PORT || 8850;
app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, origin || "*");
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/status", async (req: any, res: any) => {
  try {
    const dbStatus = await getDbStatus();

    res.status(200).json({
      status: 200,
      message: "Server and DB status fetched successfully!",
      data: {
        dbStatus,
      },
    });
  } catch (err) {
    console.error("Error in Server Status:", err);
    res
      .status(500)
      .json({ status: 500, message: "Error in fetching server status" });
  }
});

app.listen(PORT, async () => {
  console.log(`Server Started Listening at ${PORT}`);
  await connect();

  console.log("Database connection established");
});

export enum MongoStatusEnums {
  CONNECTED = "Connected to mongodb",
  CONNECTION_ERROR = "Mongodb connection Error!",
}
