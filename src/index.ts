import express, { Request, Response } from "express";
import { createServer } from "http";
import WebSocket, { WebSocketServer } from "ws";

const app = express(); // create a Express application
const server = createServer(app); // Create a HTTP server and connects to the express app
const wss = new WebSocketServer({ server }); // Create a Web socket connection instance

wss.on("connection", function connection(ws: WebSocket) {
  console.log("New client connected to the websocket connection");
  ws.on("error", console.error);

  ws.on("message", function message(data) {
    console.log("received: %s", data);
  });

  ws.send("something");
});

app.get("/", function (req: Request, res: Response) {
  res
    .send({
      message: "Hello, World!",
    })
    .status(200);
});

server.listen(8080, function () {
  console.log("HTTP server is listening on port: 8080");
});
