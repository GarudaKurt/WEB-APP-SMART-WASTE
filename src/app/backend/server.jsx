import http from "http";
import { Server } from "socket.io";
import express from "express";
import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import crypto from "crypto";
import path from "path";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

// Path to your SQLite database
const DB_PATH = path.resolve("C:/Program Files (x86)/MyPublicWiFi/Data.db");

// generate random voucher
function generateVoucher(length = 8) {
  return crypto
    .randomBytes(length)
    .toString("hex")
    .slice(0, length)
    .toUpperCase();
}

// insert voucher into database
async function insertVoucher(code) {
  try {
    const db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database,
    });

    await db.run("INSERT INTO CodeAccounts (Code, Active) VALUES (?, 1)", code);
    await db.close();

    console.log(`Voucher ${code} inserted successfully.`);
    return true;
  } catch (err) {
    console.error("SQLite error:", err);
    return false;
  }
}

// Serial Port setup
const port = new SerialPort({ path: "COM3", baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

parser.on("data", async (data) => {
  const rawData = data.trim();
  console.log("Raw data from ESP32:", rawData);

  if (rawData) {
    // Generate voucher token
    const voucherToken = generateVoucher();

    // Insert into SQLite
    const success = await insertVoucher(voucherToken);
    if (success) {
      // Broadcast to connected clients
      io.emit("voucherTokens", voucherToken);
      console.log(`Voucher broadcasted: ${voucherToken}`);
    }
  }
});

// WebSocket connection
io.on("connection", (socket) => {
  console.log(`Client Connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`Client Disconnected: ${socket.id}`);
  });
});

const PORT = 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
