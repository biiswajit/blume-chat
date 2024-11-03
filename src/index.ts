import express, { Request, Response } from "express";
import { createServer } from "http";
import WebSocket, { WebSocketServer } from "ws";
import { router as endpoints } from "./endpoints";
import { messageHandler } from "./manager/messageHandler";
import cors from "cors";

const app = express(); // create a Express application
const server = createServer(app); // Create a HTTP server and connects to the express app
const wss = new WebSocketServer({ server }); // Create a Web socket connection instance

var corsOptions = {
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use(cors(corsOptions));

wss.on("connection", function connection(ws: WebSocket) {
  console.log("New client connected to the websocket connection");
  ws.on("error", console.error);

  ws.on("message", function message(data) {
    try {
      console.log(data.toString())
      messageHandler(ws, JSON.parse(data.toString()));
    } catch (err) {
      console.error("there is an error : " + err);
    }
  });

  ws.send("something");
});

app.use("/", endpoints);

server.listen(8080, function () {
  console.log("HTTP server is listening on port: 8080");
});
