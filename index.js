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


function calculateAlzheimerProbability(accVar, gyroVar) {

  const accScore = Math.min(accVar / 1.0, 1);  
  const gyroScore = Math.min(gyroVar / 100, 1); 


  const weightedScore = 0.6 * accScore + 0.4 * gyroScore;


  const probability = Math.round(weightedScore * 100);

  return probability;
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


    const probability = calculateAlzheimerProbability(accVar, gyroVar);

    let status = "Normal";
    if (probability >= 50) status = "Alzheimer-likely";
    else if (probability >= 30) status = "Slight Risk";

    const analysis = {
      status,
      probability: `${probability}%`,
      accVariance: accVar.toFixed(3),
      gyroVariance: gyroVar.toFixed(3),
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
