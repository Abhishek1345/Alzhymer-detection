import React, { useState, useRef } from 'react';
import './App.css';

const sentences = [
  'The quick brown fox jumps over the lazy dog.',
  'Today is a bright and beautiful day.',
  'She sells seashells by the seashore.',
  'Technology can improve the quality of life.',
  'Memory is the diary that we all carry about with us.'
];

export default function App() {
  const [currentSentence, setCurrentSentence] = useState(sentences[0]);
  const [transcript, setTranscript] = useState('');
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState(null);
  const recognitionRef = useRef(null);

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech Recognition not supported in this browser');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'en-US';
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

  // Enhanced pronunciation & fluency analyzer
  const analyzeSpeech = (spokenText) => {
    const ref = currentSentence.toLowerCase();
    const spoken = spokenText.toLowerCase();

    const refWords = ref.split(' ');
    const spokenWords = spoken.split(' ');

    let correct = 0;
    let total = refWords.length;

    for (let i = 0; i < total; i++) {
      if (spokenWords[i] && spokenWords[i].replace(/[^a-z]/g, '') === refWords[i].replace(/[^a-z]/g, '')) {
        correct++;
      }
    }

    const accuracy = (correct / total) * 100;
    const fillerCount = (spoken.match(/\bum\b|\buh\b|\ber\b|\bhmm\b|\blike\b/gi) || []).length;

    // Pronunciation clarity approximation using string similarity
    const pronunciationScore = similarity(spoken, ref) * 100;

    // Weighted result for probability estimation
    const probability = 100-Math.max(0, 100 - ((100 - pronunciationScore) * 0.5 + fillerCount * 3 + (100 - accuracy) * 0.5));

    setResult({
      accuracy: accuracy.toFixed(1),
      fillerCount,
      pronunciationScore: pronunciationScore.toFixed(1),
      probability: probability.toFixed(2)
    });
  };

  // Basic Levenshtein-based similarity
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
    const nextIndex = (sentences.indexOf(currentSentence) + 1) % sentences.length;
    setCurrentSentence(sentences[nextIndex]);
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
        <div className="card instruction-card">
          <h2>Step 1: Read this sentence clearly</h2>
          <p className="sentence-display">“{currentSentence}”</p>

          <div className="button-group">
            <button onClick={startRecording} disabled={recording} className="primary">🎙 Start Recording</button>
            <button onClick={stopRecording} disabled={!recording} className="danger">⏹ Stop</button>
            <button onClick={nextSentence} className="secondary">➡ Next Sentence</button>
          </div>
        </div>

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
              <p><strong>Estimated Alzheimer Probability:</strong> {result.probability}%</p>
            </div>
          </div>
        )}
      </div>

      <footer>
        <p><em>Disclaimer:</em> This is a research prototype for educational purposes only.</p>
      </footer>
    </div>
  );
}
