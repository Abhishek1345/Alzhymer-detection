// src/utils/probabilityManager.js
export function saveTestProbability(testName, value) {
  if (typeof value !== "number" || value < 0 || value > 100) return;

  const existing = JSON.parse(localStorage.getItem("alz_probs") || "{}");
  existing[testName] = value;
  localStorage.setItem("alz_probs", JSON.stringify(existing));
   localStorage.setItem(testName+"_prob",value);

  const vals = Object.values(existing);
  const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;


  if (Object.keys(existing).length >= 3) {
    showOverallProbability(avg);
    localStorage.removeItem("alz_probs"); 
  } else {
    console.log(`Saved ${testName} probability. Current average (partial): ${avg.toFixed(2)}%`);
  }
}

function showOverallProbability(avg) {

  const box = document.createElement("div");
  box.style.position = "fixed";
  box.style.bottom = "20px";
  box.style.right = "20px";
  box.style.zIndex = "9999";
  box.style.padding = "12px 18px";
  box.style.borderRadius = "12px";
  box.style.background = "#1e293b";
  box.style.color = "white";
  box.style.fontSize = "16px";
  box.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
  box.textContent = `🧠 Overall Alzheimer Probability: ${avg.toFixed(2)}%`;
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 7000);
}
