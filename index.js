const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(bodyParser.json({ limit: "2mb" }));

// Helper functions
function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function variance(arr) {
  if (!arr || arr.length === 0) return 0.01; // floor for empty array
  const m = mean(arr);
  const varVal = arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length;
  return varVal > 0 ? varVal : 0.01; // minimum variance floor
}

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
});

app.post("/analyze", (req, res) => {
  try {
    const { accX, accY, accZ, gyroX, gyroY, gyroZ } = req.body;

    if (!accX || !gyroX) return res.status(400).json({ error: "Missing sensor data" });

    const accMag = accX.map((v, i) =>
      Math.sqrt(v ** 2 + accY[i] ** 2 + accZ[i] ** 2)
    );
    const gyroMag = gyroX.map((v, i) =>
      Math.sqrt(v ** 2 + gyroY[i] ** 2 + gyroZ[i] ** 2)
    );

    const accVar = variance(accMag);
    const gyroVar = variance(gyroMag);

    const accThreshold = 1.5;
    const gyroThreshold = 50;
    const accPeaks = accMag.filter((v) => Math.abs(v - 1) > accThreshold).length;
    const gyroPeaks = gyroMag.filter((v) => Math.abs(v) > gyroThreshold).length;

    // Calculate probability with a minimum baseline
    let probability = 0;
    probability += Math.min(accVar * 25, 50);
    probability += Math.min(gyroVar * 2, 20);
    probability += Math.min(accPeaks * 2, 20);
    probability += Math.min(gyroPeaks * 2, 10);

    // Ensure baseline probability for zero input
    const baseline = 5; // minimum probability
    probability = Math.max(probability, baseline);

    probability = Math.min(probability, 100);

    const status =
      probability >= 50 ? "Alzheimer-likely" :
      probability >= 30 ? "Slight Risk" :
      "Normal";

    const analysis = {
      status,
      accVariance: accVar.toFixed(3),
      gyroVariance: gyroVar.toFixed(3),
      accPeaks,
      gyroPeaks,
      probability: probability.toFixed(2),
      timestamp: new Date().toISOString(),
    };

    console.log(analysis);
    io.emit("sensor_update", analysis);

    res.json(analysis);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
