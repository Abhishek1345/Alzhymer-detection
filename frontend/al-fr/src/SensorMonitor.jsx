// src/SensorMonitor.jsx
import { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("https://alzhymer-detection.onrender.com");

export default function SensorMonitor() {
  const [sensorData, setSensorData] = useState(null);

  useEffect(() => {
    socket.on("sensor_update", (data) => {
      console.log("Received:", data);
      setSensorData(data);
    });

    return () => socket.off("sensor_update");
  }, []);

  if (!sensorData)
    return (
      <div className="sensor-card">
        <p className="waiting-text">Waiting for sensor data...</p>
      </div>
    );

  const { status, accVariance, gyroVariance,accPeaks,gyroPeaks,probability, timestamp } = sensorData;

  return (
    <div className="sensor-card">
      <h2 className="section-title">Live Sensor Data</h2>

      <div className="status-section">
        <span
          className={`status-badge ${
            status === "Normal" ? "normal" : "alert"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="data-list">
        <p>
          <strong>Acc Variance:</strong> {accVariance}
        </p>
        <p>
          <strong>Gyro Variance:</strong> {gyroVariance}
        </p>
         <p>
          <strong>Acc Peak:</strong> {accPeaks}
        </p>
         <p>
          <strong>Gyro Peak:</strong> {gyroPeaks}
        </p>
         <p>
          <strong>Alzheimer Probability</strong> {probability}
        </p>
        <p>
          <strong>Timestamp:</strong>{" "}
          {new Date(timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
