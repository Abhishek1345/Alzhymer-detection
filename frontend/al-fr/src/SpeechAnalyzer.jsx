import React, { useState, useRef, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './SpeechAnalyzer.css';
import { saveTestProbability } from "./utils/ProbabilityManager";

const sentences = {
  'en-US': [
    'The quick brown fox jumps over the lazy dog.',
    'Today is a bright and beautiful day.',
    'She sells seashells by the seashore.',
    'Technology can improve the quality of life.',
    'Memory is the diary that we all carry about with us.'
  ],
  'hi-IN': [
    'नमस्ते, मेरा नाम राजेश है',
    'आज मौसम बहुत अच्छा है',
    'मुझे पानी चाहिए',
    'मैं जा रहा हूं',
    'मेरा घर बहुत सुंदर'
  ],
  'bn-IN': [
    'হ্যালো, আমার নাম রাহুল',
    'আজকের দিনটা সুন্দর',
    'আমাকে পানি দিতে হবে',
    'আমি বাজারে যাচ্ছি',
    'আমার বাড়ি খুব সুন্দর'
  ],
  'or-IN': [
    'ନମସ୍କାର, ମୋର ନାମ ସୁରେଶ',
    'ଆଜିର ଦିନଟି ସୁନ୍ଦର',
    'ମୋତେ ପାଣି ଦରକାର',
    'ମୁଁ ବଜାରକୁ ଯାଉଛି',
    'ମୋର ଘର ବହୁତ ସୁନ୍ଦର'
  ]
};

export default function SpeechAnalyzer() {
  const [language, setLanguage] = useState('en-US');
  const [currentSentence, setCurrentSentence] = useState(sentences[language][0]);
  const [transcript, setTranscript] = useState('');
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const recognitionRef = useRef(null);

  // Map probability → Alzheimer risk level
  const getRiskLevel = (probability) => {
    const p = parseFloat(probability);
    if (p < 30) return 'Normal';
    else if (p < 50) return 'Slight Risk';
    else return 'Alzheimer-likely';
  };

  // Update sentence when language changes
  useEffect(() => {
    setCurrentSentence(sentences[language][0]);
    setTranscript('');
    setResult(null);
  }, [language]);

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech Recognition not supported in this browser');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setRecording(true);
    recognition.onend = () => setRecording(false);

    recognition.onresult = (event) => {
      const spokenText = event.results[0][0].transcript;
      setTranscript(spokenText);
      analyzeSpeech(spokenText);
    };

    recognition.onerror = (err) => {
      console.error('Speech recognition error:', err);
      alert('Error while capturing speech. Please try again.');
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopRecording = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
  };

  const analyzeSpeech = (spokenText) => {
    const ref = currentSentence.toLowerCase();
    const spoken = spokenText.toLowerCase();

    const refWords = ref.split(' ');
    const spokenWords = spoken.split(' ');

    let correct = 0;
    const total = refWords.length;

    for (let i = 0; i < total; i++) {
      if (spokenWords[i] && spokenWords[i].replace(/[^a-z\u0900-\u097F\u0980-\u09FF\u0B00-\u0B7F]/g, '') ===
          refWords[i].replace(/[^a-z\u0900-\u097F\u0980-\u09FF\u0B00-\u0B7F]/g, '')) {
        correct++;
      }
    }

    const accuracy = (correct / total) * 100;

    // Language-specific filler words
    const fillerPatterns = {
      'en-US': /\bum\b|\buh\b|\ber\b|\bhmm\b|\blike\b/gi,
      'hi-IN': /\bअरे\b|\bउम\b|\bएह\b/gi,
      'bn-IN': /\bউম\b|\bআহ\b|\bএই\b/gi,
      'or-IN': /\bଉମ\b|\bଏହ\b/gi
    };

    const fillerCount = (spoken.match(fillerPatterns[language]) || []).length;

    const pronunciationScore = similarity(spoken, ref) * 100;

    const probability = 100 - Math.max(0,
      100 - ((100 - pronunciationScore) * 0.5 + fillerCount * 3 + (100 - accuracy) * 0.5)
    );
  saveTestProbability("speech", probability);

    const newResult = {
      accuracy: accuracy.toFixed(1),
      fillerCount,
      pronunciationScore: pronunciationScore.toFixed(1),
      probability: probability.toFixed(2),
      riskLevel: getRiskLevel(probability)
    };

    setResult(newResult);

    // Save attempt
    setAttempts(prev => [
      ...prev,
      { attempt: prev.length + 1, probability: parseFloat(newResult.probability) }
    ]);
  };

  const similarity = (s1, s2) => {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    const longerLength = longer.length;
    if (longerLength === 0) return 1.0;

    const editDistance = (a, b) => {
      const costs = [];
      for (let i = 0; i <= a.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= b.length; j++) {
          if (i === 0) costs[j] = j;
          else if (j > 0) {
            let newValue = costs[j - 1];
            if (a[i - 1] !== b[j - 1]) newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
        if (i > 0) costs[b.length] = lastValue;
      }
      return costs[b.length];
    };

    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
  };

  const nextSentence = () => {
    const currentSet = sentences[language];
    const nextIndex = (currentSet.indexOf(currentSentence) + 1) % currentSet.length;
    setCurrentSentence(currentSet[nextIndex]);
    setTranscript('');
    setResult(null);
  };

  return (
    <div className="app-wrapper">
      <div className="header">
        <h1>Alzheimer Speech Detection</h1>
        <p className="tagline">Analyze pronunciation and fluency for potential cognitive indicators</p>
      </div>

      <div className="content">
        <div className="card language-card">
          <h3>Select Language:</h3>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="en-US">English</option>
            <option value="hi-IN">Hindi</option>
            <option value="bn-IN">Bengali</option>
            <option value="or-IN">Odia</option>
          </select>
        </div>

        <div className="card instruction-card">
          <h2>Step 1: Read this sentence clearly</h2>
          <p className="sentence-display">“{currentSentence}”</p>

          <div className="button-group">
            <button onClick={startRecording} disabled={recording} className="primary">🎙 Start Recording</button>
            <button onClick={stopRecording} disabled={!recording} className="danger">⏹ Stop</button>
            <button onClick={nextSentence} className="secondary">➡ Next Sentence</button>
          </div>
        </div>

        {recording && (
          <div className="recording-indicator">
            <div className="waveform">
              <span></span><span></span><span></span><span></span><span></span>
            </div>
            <p>Listening...</p>
          </div>
        )}

        {transcript && (
          <div className="card transcript-card">
            <h3>Your Speech Transcript:</h3>
            <p className="transcript">{transcript}</p>
          </div>
        )}

        {result && (
          <div className="card result-card">
            <h3>🩺 Speech Analysis Result</h3>
            <div className="stats">
              <p><strong>Word Accuracy:</strong> {result.accuracy}%</p>
              <p><strong>Pronunciation Similarity:</strong> {result.pronunciationScore}%</p>
              <p><strong>Filler Words:</strong> {result.fillerCount}</p>
              <p><strong>Estimated Alzheimer Probability:</strong> {result.probability}% → <strong>Risk Level:</strong> {result.riskLevel}</p>
            </div>
          </div>
        )}

        {attempts.length > 0 && (
          <div className="card chart-card">
            <h3>📈 Alzheimer Probability Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attempts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="attempt" label={{ value: 'Attempt', position: 'insideBottomRight', offset: -5 }} />
                <YAxis domain={[0, 100]} label={{ value: 'Probability (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="probability"
                  stroke="#8e44ad"
                  strokeWidth={2}
                  dot={(props) => {
                    const { cx, cy, value } = props;
                    const color = value < 30 ? 'green' : value < 50 ? 'orange' : 'red';
                    return <circle cx={cx} cy={cy} r={4} fill={color} />;
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <footer>
        <p><em>Disclaimer:</em> This is a research prototype for educational purposes only.</p>
      </footer>
    </div>
  );
}
