// src/App.jsx
import SpeechAnalyzer from "./SpeechAnalyzer";
import SensorMonitor from "./SensorMonitor";
import "./App.css";

export default function App() {
  return (
    <div className="main-container">
      <h1 className="main-title">Alzheimer Detection Dashboard</h1>

      <div className="dashboard-grid">
        <div className="card">
          <h2 className="section-title">Speech Analyzer</h2>
          <SpeechAnalyzer />
        </div>

        <SensorMonitor />
      </div>
    </div>
  );
}
