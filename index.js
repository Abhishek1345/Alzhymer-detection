const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(bodyParser.json({ limit: "2mb" }));

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function variance(arr) {
  const m = mean(arr);
  return arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length;
}

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

app.post("/analyze", (req, res) => {
  try {
    const { accX, accY, accZ, gyroX, gyroY, gyroZ } = req.body;

    if (!accX || !gyroX) {
      return res.status(400).json({ error: "Missing sensor data" });
    }

    const accMag = accX.map((v, i) =>
      Math.sqrt(v ** 2 + accY[i] ** 2 + accZ[i] ** 2)
    );
    const gyroMag = gyroX.map((v, i) =>
      Math.sqrt(v ** 2 + gyroY[i] ** 2 + gyroZ[i] ** 2)
    );
    const accVar = variance(accMag);
    const gyroVar = variance(gyroMag);
    let result = "Normal";
    if (accVar > 0.4 || gyroVar > 30) {
      result = "Alzheimer-likely";
    }

    const analysis = {
      status: result,
      accVariance: accVar.toFixed(3),
      gyroVariance: gyroVar.toFixed(3),
      timestamp: new Date().toISOString(),
    };
    io.emit("sensor_update", analysis);


    res.json(analysis);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = 5000 || process.env.PORT;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
