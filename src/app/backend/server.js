import 'dotenv/config';
import http from "http";
import { Server } from "socket.io";
import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import cors from "cors"; 

// Express & Socket.IO
const app = express();

app.use(cors({ origin: "http://localhost:3000" }))
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: "http://localhost:3000",
    methods: ["GET", "POST"] 
  } 
});

// SQLite
const DB_PATH = path.resolve("C:/Program Files (x86)/MyPublicWiFi/Data.db");

async function insertVoucher(code) {
  try {
    const db = await open({ filename: DB_PATH, driver: sqlite3.Database });
    await db.run("INSERT INTO CodeAccounts (Code, Active) VALUES (?, 1)", code);
    await db.close();
    return true;
  } catch (err) {
    console.error("SQLite error:", err);
    return false;
  }
}

function generateVoucher(length = 5) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  console.log("Tokens "+ result)
  return result;
}

app.post("/generate", async (req, res) => {
  const voucherToken = generateVoucher();
  const success = await insertVoucher(voucherToken);
  if (success) {
    io.emit("voucherTokens", voucherToken);
    console.log("Voucher generated and sent:", voucherToken);
    return res.json({ voucher: voucherToken });
  }
  return res.status(500).json({ error: "Failed to insert voucher" });
});

io.on("connection", socket => console.log(`Client Connected: ${socket.id}`));

// Start server
const PORT = 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
