const TOPICS = [
  { emoji: '🦴', label: 'Anatomy & Embryology', pages: 'pp. 3–23', key: 'anatomy_embryology' },
  { emoji: '🔄', label: 'Menstrual Cycle', pages: 'pp. 24–32', key: 'menstrual_cycle' },
  { emoji: '😣', label: 'Dysmenorrhea & PMS', pages: 'pp. 33–35', key: 'dysmenorrhea_pms' },
  { emoji: '🌱', label: 'Puberty', pages: 'pp. 36–38', key: 'puberty' },
  { emoji: '🍂', label: 'Menopause & HRT', pages: 'pp. 39–44', key: 'menopause_hrt' },
  { emoji: '🚫', label: 'Amenorrhea', pages: 'pp. 45–53', key: 'amenorrhea' },
  { emoji: '🍼', label: 'Hyperprolactinemia', pages: 'pp. 54–55', key: 'hyperprolactinemia' },
  { emoji: '🫧', label: 'PCOS', pages: 'pp. 56–62', key: 'pcos' },
  { emoji: '💉', label: 'Infertility & ART', pages: 'pp. 66–75', key: 'infertility_art' },
  { emoji: '🛡️', label: 'Contraception', pages: 'pp. 80–91', key: 'contraception' },
  { emoji: '🦠', label: 'Vaginal Infections', pages: 'pp. 92–99', key: 'vaginal_infections' },
  { emoji: '🔥', label: 'PID & STIs', pages: 'pp. 100–115', key: 'pid_stis' },
  { emoji: '↘️', label: 'Pelvic Organ Prolapse', pages: 'pp. 116–124', key: 'prolapse' },
  { emoji: '💧', label: 'Urinary Incontinence', pages: 'pp. 125–135', key: 'incontinence' },
  { emoji: '🩸', label: 'AUB & Fibroids', pages: 'pp. 137–149', key: 'aub_fibroids' },
  { emoji: '🌿', label: 'Endometriosis', pages: 'pp. 150–158', key: 'endometriosis' },
  { emoji: '🎗️', label: 'Endometrial Cancer', pages: 'pp. 164–168', key: 'endometrial_cancer' },
  { emoji: '🔴', label: 'Cervical Cancer & CIN', pages: 'pp. 169–178', key: 'cervical_cancer' },
  { emoji: '🫧', label: 'Ovarian Tumours', pages: 'pp. 182–197', key: 'ovarian_tumours' },
  { emoji: '🔭', label: 'Imaging & Endoscopy', pages: 'pp. 202–214', key: 'imaging_endoscopy' },
];

const MODES = {
  explain: {
    label: 'deep explanation with analogies',
    prompt: (topic) => `You are a brilliant medical tutor at Kasr Al-Ainy, Cairo University, teaching a 4th-year medical student who knows NOTHING about gynecology yet. 

Topic: **${topic}**

Give a crystal-clear explanation following this structure:

## What Is It? (Simple Definition)
Start with a single sentence anyone could understand. Use a real-world analogy if helpful.

## The Biology / Mechanism (Why/How)
Explain the underlying physiology or pathology in logical steps. Use cause-and-effect language ("because... therefore..."). Connect it to things they already know from basic sciences.

## Key Facts to Know
The 5–7 most important clinical facts. Use ⭐ for high-yield, 🔴 for red flags.

## How to Remember It
Give a mnemonic, analogy, or memorable story that makes this stick.

## Quick Summary
3 bullet points that capture the whole topic.

Write in a warm, engaging, mentor tone. Use **bold** for key terms. Keep paragraphs short. This is for a student with zero prior knowledge — be clear, not condescending.`
  },
  clinical: {
    label: 'clinical case scenario',
    prompt: (topic) => `You are a Kasr Al-Ainy clinical tutor. Present a realistic clinical case about: **${topic}**

Structure it as:

## 🏥 The Patient
Present the case: age, complaints, duration, relevant history (2–3 sentences, realistic Egyptian clinical setting)

## 🔍 What's Happening? (Step-by-Step Reasoning)
Walk through the clinical thinking:
1. What does the presentation suggest?
2. What is the underlying mechanism causing these symptoms?
3. What are you thinking as a doctor?

## 🧪 Investigations
What would you order and WHY? What results would you expect?

## 💊 Management
Treatment plan with reasoning. Not just WHAT — explain WHY each step.

## 📌 Teaching Points
3 key lessons this case teaches. Include one ⚠️ common trap to avoid.

## ❓ Test Yourself
One viva-style question a professor might ask about this case.

Make the case realistic and memorable. The student has ZERO prior gynecology knowledge — explain every medical term you use.`
  },
  quiz: {
    label: 'quiz questions with answers',
    prompt: (topic) => `Create 5 exam-style quiz questions about: **${topic}** for a 4th-year medical student at Kasr Al-Ainy.

Mix of styles: some MCQ-style (mark the best answer), some short-answer, some clinical vignette.

For EACH question:

**Q[N]: [The Question]**

Options (if MCQ):
A) ...
B) ...
C) ...
D) ...

**Answer:** [Correct answer + letter if MCQ]

**Explanation:** [2–3 sentences explaining WHY this is correct AND why the others are wrong. Connect to the underlying mechanism.]

**Exam Tip:** [One sentence on what professors love to ask about this topic]

---

Make questions progressively harder. Start with a basic factual question, end with a clinical reasoning question. The student is a beginner — explanations should be detailed and educational, not just confirmatory.`
  },
  compare: {
    label: 'comparison with similar conditions',
    prompt: (topic) => `The student needs to understand **${topic}** by comparing it with similar or related conditions they might confuse it with.

## The Core Concept
One paragraph explaining what ${topic} is in the simplest possible terms.

## The Confusing Conditions
List 2–4 conditions that students commonly mix up with this topic.

## Side-by-Side Comparison
Create a clear comparison covering:
- Definition / mechanism
- Who gets it (patient profile)
- Key symptoms
- Key investigations
- Treatment
- Classic exam clue (the "giveaway" feature)

## Memory Trick
A way to remember which is which.

## The Differentiating Question
"The one question you should ask yourself to tell them apart is: ___"

Write for a beginner. Explain every term. Use clear formatting.`
  },
  traps: {
    label: 'common exam mistakes and traps',
    prompt: (topic) => `You are an exam-savvy Kasr Al-Ainy tutor. Reveal the most common mistakes students make about: **${topic}**

## 🎯 The Big Picture (What students often misunderstand)
The single most important concept students get wrong, and why.

## ⚠️ Common Traps (5–7 specific pitfalls)
For each trap:
**Trap [N]: [Catchy name for the trap]**
- ❌ What students think: ...
- ✅ What's actually true: ...
- 💡 Why this matters clinically: ...

## 🔴 Red Flags Students Miss
Clinical warning signs that are easy to overlook but critical to know.

## ✏️ Exam Favourite Questions
3 questions professors love to ask about this topic, and the perfect answer.

## 📝 The "Never Forget" Rules
3–5 absolute rules about this topic that you must never get wrong in an exam or clinic.

Write for a complete beginner. Be specific — vague advice is useless. The traps should feel like insider tips from someone who has seen hundreds of students fail on these exact points.`
  }
};

let selectedTopic = null;
let selectedMode = 'explain';

// API key management
function loadApiKey() {
  const key = localStorage.getItem('anthropic_api_key') || '';
  const statusEl = document.getElementById('apiKeyStatus');
  if (key) {
    document.getElementById('apiKeyInput').value = key;
    statusEl.textContent = '✓ Key saved';
    statusEl.className = 'api-key-status set';
  } else {
    statusEl.textContent = 'Not set';
    statusEl.className = 'api-key-status unset';
  }
  return key;
}

function saveApiKey() {
  const key = document.getElementById('apiKeyInput').value.trim();
  const statusEl = document.getElementById('apiKeyStatus');
  if (key) {
    localStorage.setItem('anthropic_api_key', key);
    statusEl.textContent = '✓ Key saved';
    statusEl.className = 'api-key-status set';
  } else {
    localStorage.removeItem('anthropic_api_key');
    statusEl.textContent = 'Not set';
    statusEl.className = 'api-key-status unset';
  }
}

function selectTopic(topic, btn) {
  document.querySelectorAll('.topic-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedTopic = topic;
  document.getElementById('genBtnText').textContent = `Generate: ${topic.label}`;
}

function setMode(mode, btn) {
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedMode = mode;
}

async function generate() {
  if (!selectedTopic) {
    showError('Please select a topic first!');
    return;
  }
  const modeConfig = MODES[selectedMode];
  const prompt = modeConfig.prompt(selectedTopic.label + ' (from Kasr Al-Ainy Essentials of Gynecology)');
  await fetchAndRender(prompt);
}

async function askCustom() {
  const q = document.getElementById('customQ').value.trim();
  if (!q) return;
  const context = selectedTopic ? ` (in the context of ${selectedTopic.label})` : ' in gynecology';
  const prompt = `You are a brilliant gynecology tutor at Kasr Al-Ainy teaching a 4th-year medical student who is a complete beginner.

The student asks: "${q}"${context}

Answer clearly and thoroughly:
- Start with the simplest possible explanation
- Use analogies where helpful
- Explain all medical terms you use
- Use **bold** for key terms
- Include clinical relevance where appropriate
- End with 1–2 key takeaway points

Write in a warm, mentor tone. The student knows NOTHING yet — be clear, educational, and encouraging.`;
  await fetchAndRender(prompt);
}

function showError(msg) {
  document.getElementById('contentArea').innerHTML = `
    <div style="text-align:center;padding:40px;color:var(--danger)">
      <div style="font-size:2rem">⚠️</div>
      <p style="margin-top:8px">${msg}</p>
    </div>`;
}

async function fetchAndRender(prompt) {
  const contentArea = document.getElementById('contentArea');
  const genBtn = document.getElementById('genBtn');
  const askBtn = document.getElementById('askBtn');

  // Show loading
  contentArea.innerHTML = `
    <div class="loading">
      <div class="loading-dots">
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
      </div>
      <p>Your tutor is thinking…</p>
    </div>`;
  genBtn.disabled = true;
  askBtn.disabled = true;

  try {
    const apiKey = localStorage.getItem('anthropic_api_key') || '';
    if (!apiKey) {
      throw new Error('No API key set. Please enter your Anthropic API key above.');
    }
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1800,
        system: `You are an expert gynecology tutor at Kasr Al-Ainy, Faculty of Medicine, Cairo University. 
You are teaching 4th-year medical students using the "Essentials of Gynecology, 7th Edition 2025."
Your teaching style: clear, logical, warm, mentor-like. You explain the WHY behind everything.
You use **bold** for key terms, ⭐ for high-yield facts, 🔴 for red flags, ⚠️ for exam traps.
Always connect theory to clinical practice. Make concepts memorable with analogies.`,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);

    const text = data.content?.map(b => b.text || '').join('') || '';
    contentArea.innerHTML = `<div class="rendered">${renderMarkdown(text)}</div>`;

    // If quiz mode, attach interactivity
    if (selectedMode === 'quiz') attachQuizInteractivity();

  } catch (err) {
    contentArea.innerHTML = `
      <div style="text-align:center;padding:40px;color:var(--danger)">
        <div style="font-size:2rem">⚠️</div>
        <p style="margin-top:8px;font-size:0.9rem">Error: ${err.message}</p>
      </div>`;
  } finally {
    genBtn.disabled = false;
    askBtn.disabled = false;
  }
}

function renderMarkdown(text) {
  // Tables
  text = text.replace(/\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)*)/g, (match, header, rows) => {
    const ths = header.split('|').filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`).join('');
    const trs = rows.trim().split('\n').map(row => {
      const tds = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
      return `<tr>${tds}</tr>`;
    }).join('');
    return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
  });

  // Headings
  text = text.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  text = text.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  text = text.replace(/^#### (.+)$/gm, '<h3>$1</h3>');

  // Bold/italic
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Special callout markers
  text = text.replace(/⭐ (.+)/g, '<div class="info-card">⭐ $1</div>');
  text = text.replace(/🔴 (.+)/g, '<div class="danger-card">🔴 $1</div>');
  text = text.replace(/⚠️ (.+)/g, '<div class="warn-card">⚠️ $1</div>');
  text = text.replace(/💡 (.+)/g, '<div class="success-card">💡 $1</div>');

  // Horizontal rule
  text = text.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--border);margin:20px 0">');

  // Numbered list
  text = text.replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>');
  text = text.replace(/(<li>[\s\S]*?<\/li>)(?=\s*<li>)/g, '$1');
  text = text.replace(/(<li>.*<\/li>)/gs, (match) => {
    if (match.includes('<ol>')) return match;
    return `<ol>${match}</ol>`;
  });

  // Bullet list
  text = text.replace(/^[•\-\*] (.+)$/gm, '<li>$1</li>');

  // Wrap consecutive li not in ol into ul
  text = text.replace(/(<li>(?!.*<ol>)[\s\S]*?<\/li>\n?)+/g, match => {
    if (match.includes('<ol>') || match.includes('<ul>')) return match;
    return `<ul>${match}</ul>`;
  });

  // Paragraphs (lines not already wrapped)
  const lines = text.split('\n');
  const processed = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { processed.push(''); continue; }
    if (/^<(h[23456]|ul|ol|li|div|table|thead|tbody|tr|th|td|hr)/.test(trimmed)) {
      processed.push(trimmed);
    } else {
      processed.push(`<p>${trimmed}</p>`);
    }
  }
  return processed.join('\n');
}

function attachQuizInteractivity() {
  // Parse options and make them clickable
  const content = document.querySelector('.rendered');
  if (!content) return;
  
  // Find option lines like "A) ..." or "a) ..."
  const optionPattern = /^([A-Da-d]\))\s+(.+)$/;
  const paragraphs = content.querySelectorAll('p');
  
  paragraphs.forEach(p => {
    const text = p.textContent.trim();
    const match = text.match(optionPattern);
    if (match) {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.textContent = text;
      btn.dataset.option = match[1].toLowerCase();
      
      // Look for correct answer in sibling text
      btn.addEventListener('click', function() {
        const correctText = findAnswerText(this);
        
        const siblings = document.querySelectorAll('.quiz-option');
        siblings.forEach(s => {
          s.disabled = true;
          if (s === this) {
            const isCorrect = correctText && correctText.toLowerCase().includes(this.dataset.option.charAt(0));
            s.classList.add(isCorrect ? 'correct' : 'wrong');
            // Show feedback
            const fb = document.createElement('div');
            fb.className = `quiz-feedback show ${isCorrect ? 'correct' : 'wrong'}`;
            fb.textContent = isCorrect ? '✓ Correct!' : `✗ That's not right. Check the answer below.`;
            s.after(fb);
          }
        });
      });
      
      p.replaceWith(btn);
    }
  });
}

function findAnswerText(optionBtn) {
  // Look for "Answer:" text after options (limit to 20 siblings to prevent infinite loop)
  let next = optionBtn.nextElementSibling;
  let count = 0;
  while (next && !next.textContent.includes('Answer:') && count++ < 20) {
    next = next.nextElementSibling;
  }
  return next ? next.textContent : null;
}

if (typeof module !== 'undefined') {
  module.exports = {
    TOPICS,
    MODES,
    renderMarkdown,
    findAnswerText,
    loadApiKey,
    saveApiKey,
    selectTopic,
    setMode,
    generate,
    askCustom,
    showError,
    fetchAndRender,
    attachQuizInteractivity,
    getSelectedTopic: () => selectedTopic,
    getSelectedMode: () => selectedMode,
    setSelectedTopic: (t) => { selectedTopic = t; },
    setSelectedMode: (m) => { selectedMode = m; },
  };
}
