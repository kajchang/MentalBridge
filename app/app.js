const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const path = require("path");

// Game Variables

const players = {};
const positions = ["North", "East", "South", "West"];

// App Routes

app.use("/scripts", express.static(path.join(__dirname, "scripts")));
app.use("/styles", express.static(path.join(__dirname, "styles")));
app.use("/faces", express.static(path.join(__dirname, "styles/faces")));
app.use("/webfonts", express.static(path.join(__dirname, "../node_modules/@fortawesome/fontawesome-free/webfonts")));

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

// Socket Events

io.on("connection", socket => {
	io.in("players").clients((err, clients) => {
		if (clients.length < 4) {

			const availablePositions = positions.filter(position => !Object.keys(players).includes(position));
			const playerPosition = availablePositions[Math.floor(Math.random() * availablePositions.length)];

			io.to("players").emit("join", playerPosition);
			io.to("spectators").emit("join", playerPosition);

			socket.emit("positions", Object.keys(players), playerPosition);

			players[playerPosition] = socket.id;

			socket.join("players");

			console.log(players);

			socket.on("disconnect", () => {
				delete players[playerPosition];

				io.emit("leave", playerPosition);

				console.log(players);
			});

			// Message Passing

			socket.on("codeWords", codeWords => {
				console.log(playerPosition + " Sending CodeWords");
				io.to("players").emit("codeWords", codeWords, playerPosition);
			});

			socket.on("shuffledDeck", deck => {
				console.log(playerPosition + " Shuffling");
				io.to("players").emit("shuffledDeck", deck, playerPosition);
			});

			socket.on("lockedDeck", deck => {
				console.log(playerPosition + " Locking");
				io.to("players").emit("lockedDeck", deck, playerPosition);
			});

			socket.on("cardKeys", keys => {
				console.log(playerPosition + " Sending Keys");
				io.to("players").emit("cardKeys", keys, playerPosition);
			});

			socket.on("bid", bid => {
				console.log(playerPosition + " Bidding")
				io.to("players").emit("bid", bid, playerPosition);
			});

			if (Object.keys(players).length == 4) {
				io.to("players").emit("start");
			}

		} else {
			socket.emit("positions", [Object.keys(players), null]);

			socket.join("spectators");
		}
	});
});

server.listen(3000);
