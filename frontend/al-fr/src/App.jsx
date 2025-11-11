// src/App.jsx
import SpeechAnalyzer from "./SpeechAnalyzer";
import SensorMonitor from "./SensorMonitor";
import "./App.css";
import logo from './assets/NIT_JSR.png'; 

export default function App() {
  return (
    <div className="main-container">
   
      <header className="page-header">
        <img src={logo} alt="NIT Jamshedpur Logo" className="logo" width={100}/>
        <div className="header-text">
          <h1 className="institute-name">NIT Jamshedpur</h1>
          <i><p>Embedded Systems and IoT lab Project</p></i>
          <p className="presented-to">Presented to Dr. Basudeba Behera</p>
        </div>
      </header>

      <div className="dashboard-grid">
        <div className="card">
          <h2 className="section-title">Speech Analyzer</h2>
          <SpeechAnalyzer />
        </div>

        <SensorMonitor />
        
      </div>
      <center>
        <p id="overall_prob"></p>
        <button className="nextPage" onClick={()=>{window.location.assign("https://alzhymer-detection-nitjsr-screening.onrender.com/")}}>Go To Cognitive Assesment ➡</button></center>
    </div>
  );
}
