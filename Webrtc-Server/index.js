const express = require("express");
const http = require("http");
const initializeSocket = require("./src/socket/socket");

const app = express();

app.use(express.json());

const server = http.createServer(app);
const io = initializeSocket(server);

app.use((req, res, next) => {
    req.io = io;
    next();
});

app.get("/", (req, res) => {
    res.send("Welcome to the webrtc server");
});

const port = 8000;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
