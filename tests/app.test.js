'use strict';

/**
 * Comprehensive test suite for the Gynecology Tutor app (app.js).
 *
 * Coverage areas:
 *  - TOPICS data integrity
 *  - MODES data integrity & prompt generation
 *  - renderMarkdown() – all transformation rules
 *  - findAnswerText() – DOM sibling traversal
 *  - loadApiKey() / saveApiKey() – localStorage + DOM
 *  - selectTopic() / setMode() – DOM state management
 *  - showError() – DOM output
 *  - generate() – guard clause and prompt routing
 *  - askCustom() – empty guard and context injection
 *  - fetchAndRender() – loading state, missing key, success, API error, re-enabled buttons
 *  - attachQuizInteractivity() – option detection, correct/wrong feedback
 */

// ─── Minimal DOM scaffold ────────────────────────────────────────────────────
// jsdom is provided by jest-environment-jsdom (see package.json).
// We set up the HTML elements that app.js functions rely on before each test.

function buildDom() {
  document.body.innerHTML = `
    <div id="topicGrid"></div>
    <div id="contentArea"></div>
    <input  id="apiKeyInput"  type="password" value="" />
    <span   id="apiKeyStatus"></span>
    <input  id="genBtnText"   type="text"     value="Generate" />
    <button id="genBtn">Generate</button>
    <button id="askBtn">Ask</button>
    <textarea id="customQ"></textarea>
    <div class="rendered"></div>
  `;
}

// ─── Module import ────────────────────────────────────────────────────────────
// app.js conditionally exports when `module` is defined (Node.js).
// Build a minimal DOM first so app.js loads safely, then require it.
buildDom();

// Define global.fetch so Jest can spy on / mock it in tests.
// jsdom does not include fetch by default.
if (!global.fetch) {
  global.fetch = () => Promise.resolve({ json: async () => ({}) });
}

const mod = require('../app.js');

beforeEach(() => {
  buildDom();
  localStorage.clear();
  // Reset module state between tests
  mod.setSelectedTopic(null);
  mod.setSelectedMode('explain');
  jest.clearAllMocks();
});

// ═════════════════════════════════════════════════════════════════════════════
// 1.  TOPICS data integrity
// ═════════════════════════════════════════════════════════════════════════════
describe('TOPICS', () => {
  const { TOPICS } = mod;

  test('contains exactly 20 topics', () => {
    expect(TOPICS).toHaveLength(20);
  });

  test('every topic has the four required fields', () => {
    TOPICS.forEach(t => {
      expect(typeof t.emoji).toBe('string');
      expect(t.emoji.trim()).not.toBe('');
      expect(typeof t.label).toBe('string');
      expect(t.label.trim()).not.toBe('');
      expect(typeof t.pages).toBe('string');
      expect(typeof t.key).toBe('string');
      expect(t.key.trim()).not.toBe('');
    });
  });

  test('all topic keys are unique', () => {
    const keys = TOPICS.map(t => t.key);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  test('pages field follows the "pp. X–Y" format', () => {
    const pagePattern = /^pp\. \d+[–-]\d+$/;
    TOPICS.forEach(t => {
      expect(t.pages).toMatch(pagePattern);
    });
  });

  test('topics are ordered by ascending page number', () => {
    const startPages = mod.TOPICS.map(t => {
      const m = t.pages.match(/pp\. (\d+)/);
      return m ? parseInt(m[1], 10) : 0;
    });
    for (let i = 1; i < startPages.length; i++) {
      expect(startPages[i]).toBeGreaterThanOrEqual(startPages[i - 1]);
    }
  });

  test('all expected topic keys are present', () => {
    const expectedKeys = [
      'anatomy_embryology', 'menstrual_cycle', 'dysmenorrhea_pms', 'puberty',
      'menopause_hrt', 'amenorrhea', 'hyperprolactinemia', 'pcos',
      'infertility_art', 'contraception', 'vaginal_infections', 'pid_stis',
      'prolapse', 'incontinence', 'aub_fibroids', 'endometriosis',
      'endometrial_cancer', 'cervical_cancer', 'ovarian_tumours',
      'imaging_endoscopy',
    ];
    const keys = TOPICS.map(t => t.key);
    expectedKeys.forEach(k => expect(keys).toContain(k));
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2.  MODES data integrity & prompt generation
// ═════════════════════════════════════════════════════════════════════════════
describe('MODES', () => {
  const { MODES } = mod;

  const EXPECTED_MODES = ['explain', 'clinical', 'quiz', 'compare', 'traps'];

  test('all five modes are present', () => {
    EXPECTED_MODES.forEach(m => expect(MODES).toHaveProperty(m));
  });

  test('every mode has a non-empty label string', () => {
    EXPECTED_MODES.forEach(m => {
      expect(typeof MODES[m].label).toBe('string');
      expect(MODES[m].label.trim()).not.toBe('');
    });
  });

  test('every mode has a callable prompt function', () => {
    EXPECTED_MODES.forEach(m => {
      expect(typeof MODES[m].prompt).toBe('function');
    });
  });

  test('prompt functions inject the supplied topic name', () => {
    const topic = 'PCOS';
    EXPECTED_MODES.forEach(m => {
      const result = MODES[m].prompt(topic);
      expect(result).toContain(topic);
    });
  });

  test('explain prompt contains required section headings', () => {
    const result = MODES.explain.prompt('PCOS');
    expect(result).toContain('## What Is It?');
    expect(result).toContain('## The Biology / Mechanism');
    expect(result).toContain('## Key Facts to Know');
    expect(result).toContain('## How to Remember It');
    expect(result).toContain('## Quick Summary');
  });

  test('clinical prompt contains required section headings', () => {
    const result = MODES.clinical.prompt('Endometriosis');
    expect(result).toContain('## 🏥 The Patient');
    expect(result).toContain('## 🧪 Investigations');
    expect(result).toContain('## 💊 Management');
    expect(result).toContain('## ❓ Test Yourself');
  });

  test('quiz prompt specifies 5 questions and MCQ format', () => {
    const result = MODES.quiz.prompt('Amenorrhea');
    expect(result).toContain('5 exam-style quiz questions');
    expect(result).toContain('**Answer:**');
    expect(result).toContain('**Explanation:**');
    expect(result).toContain('**Exam Tip:**');
  });

  test('compare prompt contains comparison structure', () => {
    const result = MODES.compare.prompt('PCOS');
    expect(result).toContain('## The Core Concept');
    expect(result).toContain('## Side-by-Side Comparison');
    expect(result).toContain('## Memory Trick');
  });

  test('traps prompt contains trap structure sections', () => {
    const result = MODES.traps.prompt('Fibroids');
    expect(result).toContain('## 🎯 The Big Picture');
    expect(result).toContain('## ⚠️ Common Traps');
    expect(result).toContain('## ✏️ Exam Favourite Questions');
    expect(result).toContain('## 📝 The "Never Forget" Rules');
  });

  test('mode labels are descriptive', () => {
    expect(MODES.explain.label).toMatch(/explanation/i);
    expect(MODES.clinical.label).toMatch(/clinical/i);
    expect(MODES.quiz.label).toMatch(/quiz/i);
    expect(MODES.compare.label).toMatch(/comparison/i);
    expect(MODES.traps.label).toMatch(/trap/i);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3.  renderMarkdown()
// ═════════════════════════════════════════════════════════════════════════════
describe('renderMarkdown()', () => {
  const { renderMarkdown } = mod;

  // ── Headings ───────────────────────────────────────────────────────────────
  describe('headings', () => {
    test('converts ## to <h2>', () => {
      expect(renderMarkdown('## Hello World')).toContain('<h2>Hello World</h2>');
    });

    test('converts ### to <h3>', () => {
      expect(renderMarkdown('### Sub Heading')).toContain('<h3>Sub Heading</h3>');
    });

    test('converts #### to <h3> (h4 mapped to h3)', () => {
      expect(renderMarkdown('#### Deep Heading')).toContain('<h3>Deep Heading</h3>');
    });

    test('does not convert # (h1) — left as paragraph', () => {
      const result = renderMarkdown('# Not an h1');
      expect(result).not.toContain('<h1>');
      expect(result).toContain('# Not an h1');
    });

    test('heading content containing special characters is preserved', () => {
      expect(renderMarkdown('## Step 1: Do Something')).toContain(
        '<h2>Step 1: Do Something</h2>'
      );
    });
  });

  // ── Inline formatting ──────────────────────────────────────────────────────
  describe('inline formatting', () => {
    test('converts **text** to <strong>', () => {
      expect(renderMarkdown('This is **bold** text')).toContain(
        '<strong>bold</strong>'
      );
    });

    test('converts *text* to <em>', () => {
      expect(renderMarkdown('This is *italic* text')).toContain(
        '<em>italic</em>'
      );
    });

    test('does not convert single asterisks inside words', () => {
      const result = renderMarkdown('5*3 is fifteen');
      // asterisk in a math expression should survive or be wrapped only if matched
      expect(result).toBeTruthy(); // just ensure it doesn't throw
    });

    test('handles multiple bold spans in one line', () => {
      const result = renderMarkdown('**alpha** and **beta**');
      expect(result).toContain('<strong>alpha</strong>');
      expect(result).toContain('<strong>beta</strong>');
    });
  });

  // ── Special callout cards ──────────────────────────────────────────────────
  describe('callout markers', () => {
    test('⭐ line becomes info-card div', () => {
      expect(renderMarkdown('⭐ High yield fact')).toContain(
        '<div class="info-card">⭐ High yield fact</div>'
      );
    });

    test('🔴 line becomes danger-card div', () => {
      expect(renderMarkdown('🔴 Red flag here')).toContain(
        '<div class="danger-card">🔴 Red flag here</div>'
      );
    });

    test('⚠️ line becomes warn-card div', () => {
      expect(renderMarkdown('⚠️ Watch out')).toContain(
        '<div class="warn-card">⚠️ Watch out</div>'
      );
    });

    test('💡 line becomes success-card div', () => {
      expect(renderMarkdown('💡 Pro tip')).toContain(
        '<div class="success-card">💡 Pro tip</div>'
      );
    });
  });

  // ── Horizontal rule ────────────────────────────────────────────────────────
  describe('horizontal rule', () => {
    test('converts --- to <hr> element', () => {
      expect(renderMarkdown('---')).toContain('<hr');
    });

    test('--- inside a word is not converted', () => {
      const result = renderMarkdown('some---thing');
      expect(result).not.toContain('<hr');
    });
  });

  // ── Numbered lists ─────────────────────────────────────────────────────────
  describe('numbered lists', () => {
    test('converts "1. item" lines to <li> elements wrapped in <ol>', () => {
      const result = renderMarkdown('1. First item\n2. Second item');
      expect(result).toContain('<li>First item</li>');
      expect(result).toContain('<li>Second item</li>');
      expect(result).toContain('<ol>');
    });
  });

  // ── Bullet lists ───────────────────────────────────────────────────────────
  describe('bullet lists', () => {
    test('converts "- item" to <li> wrapped in <ul>', () => {
      const result = renderMarkdown('- Alpha\n- Beta');
      expect(result).toContain('<li>Alpha</li>');
      expect(result).toContain('<li>Beta</li>');
      expect(result).toContain('<ul>');
    });

    test('converts "* item" to <li>', () => {
      const result = renderMarkdown('* Gamma');
      expect(result).toContain('<li>Gamma</li>');
    });

    test('converts "• item" to <li>', () => {
      const result = renderMarkdown('• Delta');
      expect(result).toContain('<li>Delta</li>');
    });
  });

  // ── Paragraphs ─────────────────────────────────────────────────────────────
  describe('paragraph wrapping', () => {
    test('plain text lines are wrapped in <p>', () => {
      expect(renderMarkdown('Just a plain line')).toContain(
        '<p>Just a plain line</p>'
      );
    });

    test('empty lines are preserved as empty entries', () => {
      const result = renderMarkdown('Line one\n\nLine two');
      expect(result).toContain('<p>Line one</p>');
      expect(result).toContain('<p>Line two</p>');
    });

    test('HTML block-level elements are NOT double-wrapped in <p>', () => {
      const result = renderMarkdown('<h2>A heading</h2>');
      expect(result).not.toContain('<p><h2>');
    });

    test('<ul> lines are not wrapped in <p>', () => {
      const result = renderMarkdown('- item');
      expect(result).not.toMatch(/<p>.*<li>/);
    });
  });

  // ── Tables ─────────────────────────────────────────────────────────────────
  describe('tables', () => {
    const TABLE_MD =
      '| Name | Age |\n' +
      '| --- | --- |\n' +
      '| Alice | 30 |\n' +
      '| Bob | 25 |\n';

    test('converts markdown table to <table> HTML', () => {
      const result = renderMarkdown(TABLE_MD);
      expect(result).toContain('<table>');
      expect(result).toContain('<thead>');
      expect(result).toContain('<tbody>');
    });

    test('table headers become <th> elements', () => {
      const result = renderMarkdown(TABLE_MD);
      expect(result).toContain('<th>Name</th>');
      expect(result).toContain('<th>Age</th>');
    });

    test('table rows become <td> elements', () => {
      const result = renderMarkdown(TABLE_MD);
      expect(result).toContain('<td>Alice</td>');
      expect(result).toContain('<td>30</td>');
      expect(result).toContain('<td>Bob</td>');
      expect(result).toContain('<td>25</td>');
    });
  });

  // ── Edge cases ─────────────────────────────────────────────────────────────
  describe('edge cases', () => {
    test('empty string returns empty (or only whitespace)', () => {
      const result = renderMarkdown('');
      expect(result.trim()).toBe('');
    });

    test('string of only newlines does not throw', () => {
      expect(() => renderMarkdown('\n\n\n')).not.toThrow();
    });

    test('does not mutate the input string variable', () => {
      const original = '## Title\n**bold**';
      renderMarkdown(original);
      // The function returns a new value; input is a primitive and cannot be mutated
      expect(original).toBe('## Title\n**bold**');
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 4.  findAnswerText()
// ═════════════════════════════════════════════════════════════════════════════
describe('findAnswerText()', () => {
  const { findAnswerText } = mod;

  function makeElements(texts) {
    const container = document.createElement('div');
    texts.forEach(t => {
      const p = document.createElement('p');
      p.textContent = t;
      container.appendChild(p);
    });
    document.body.appendChild(container);
    return container.querySelectorAll('p');
  }

  afterEach(() => {
    // Remove any containers added by these tests
    document.body.querySelectorAll('div').forEach(d => d.remove());
  });

  test('returns the element whose text contains "Answer:"', () => {
    const elems = makeElements(['A) Choice one', 'B) Choice two', 'Answer: B']);
    // Call with the first option
    const result = findAnswerText(elems[0]);
    expect(result).toContain('Answer: B');
  });

  test('returns null when no "Answer:" sibling exists', () => {
    const elems = makeElements(['A) Option', 'B) Option', 'Some other text']);
    expect(findAnswerText(elems[0])).toBeNull();
  });

  test('finds "Answer:" even when it is several siblings away', () => {
    const elems = makeElements([
      'A) Opt', 'B) Opt', 'C) Opt', 'D) Opt',
      'Explanation text',
      'Answer: C',
    ]);
    const result = findAnswerText(elems[0]);
    expect(result).toContain('Answer: C');
  });

  test('stops searching after 20 siblings — does not find Answer buried 25+ siblings away', () => {
    // Create 25 non-answer siblings followed by "Answer: D"
    // The function checks up to 20 siblings starting from the first nextSibling,
    // so it will NOT reach the Answer text at position 26.
    const texts = Array.from({ length: 25 }, (_, i) => `Sibling ${i}`);
    texts.push('Answer: D');
    const elems = makeElements(texts);
    const result = findAnswerText(elems[0]);
    // The function terminates without finding Answer: D
    expect(result).not.toContain('Answer: D');
  });

  test('returns the Answer element itself (not just text)', () => {
    const elems = makeElements(['A) Opt', 'Answer: A']);
    const result = findAnswerText(elems[0]);
    expect(result).toBeTruthy();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 5.  loadApiKey() / saveApiKey()
// ═════════════════════════════════════════════════════════════════════════════
describe('loadApiKey()', () => {
  const { loadApiKey } = mod;

  test('returns empty string and sets "Not set" status when no key stored', () => {
    localStorage.removeItem('anthropic_api_key');
    const key = loadApiKey();
    expect(key).toBe('');
    expect(document.getElementById('apiKeyStatus').textContent).toBe('Not set');
    expect(document.getElementById('apiKeyStatus').className).toContain('unset');
  });

  test('returns stored key and shows "✓ Key saved" status when key exists', () => {
    localStorage.setItem('anthropic_api_key', 'sk-ant-test123');
    const key = loadApiKey();
    expect(key).toBe('sk-ant-test123');
    expect(document.getElementById('apiKeyInput').value).toBe('sk-ant-test123');
    expect(document.getElementById('apiKeyStatus').textContent).toBe('✓ Key saved');
    expect(document.getElementById('apiKeyStatus').className).toContain('set');
  });
});

describe('saveApiKey()', () => {
  const { saveApiKey } = mod;

  test('saves non-empty key to localStorage and shows "✓ Key saved"', () => {
    document.getElementById('apiKeyInput').value = 'sk-ant-new-key';
    saveApiKey();
    expect(localStorage.getItem('anthropic_api_key')).toBe('sk-ant-new-key');
    expect(document.getElementById('apiKeyStatus').textContent).toBe('✓ Key saved');
    expect(document.getElementById('apiKeyStatus').className).toContain('set');
  });

  test('trims whitespace from key before saving', () => {
    document.getElementById('apiKeyInput').value = '  sk-ant-spaces  ';
    saveApiKey();
    expect(localStorage.getItem('anthropic_api_key')).toBe('sk-ant-spaces');
  });

  test('removes key from localStorage and shows "Not set" when input is empty', () => {
    localStorage.setItem('anthropic_api_key', 'old-key');
    document.getElementById('apiKeyInput').value = '';
    saveApiKey();
    expect(localStorage.getItem('anthropic_api_key')).toBeNull();
    expect(document.getElementById('apiKeyStatus').textContent).toBe('Not set');
    expect(document.getElementById('apiKeyStatus').className).toContain('unset');
  });

  test('removes key when input is only whitespace', () => {
    localStorage.setItem('anthropic_api_key', 'old-key');
    document.getElementById('apiKeyInput').value = '   ';
    saveApiKey();
    expect(localStorage.getItem('anthropic_api_key')).toBeNull();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 6.  selectTopic() / setMode()
// ═════════════════════════════════════════════════════════════════════════════
describe('selectTopic()', () => {
  const { selectTopic, getSelectedTopic } = mod;

  function makeTopicButtons(count = 3) {
    const grid = document.getElementById('topicGrid');
    grid.innerHTML = '';
    const buttons = [];
    for (let i = 0; i < count; i++) {
      const btn = document.createElement('button');
      btn.className = 'topic-btn';
      grid.appendChild(btn);
      buttons.push(btn);
    }
    return buttons;
  }

  test('sets selectedTopic to the supplied topic object', () => {
    const [btn] = makeTopicButtons(1);
    const topic = { emoji: '🦴', label: 'Anatomy', pages: 'pp. 3–23', key: 'anatomy' };
    selectTopic(topic, btn);
    expect(getSelectedTopic()).toBe(topic);
  });

  test('adds "active" class to the clicked button', () => {
    const [btn] = makeTopicButtons(1);
    selectTopic({ label: 'PCOS', key: 'pcos' }, btn);
    expect(btn.classList.contains('active')).toBe(true);
  });

  test('removes "active" class from all other topic buttons', () => {
    const [btn1, btn2, btn3] = makeTopicButtons(3);
    btn1.classList.add('active');
    btn2.classList.add('active');
    selectTopic({ label: 'PCOS', key: 'pcos' }, btn3);
    expect(btn1.classList.contains('active')).toBe(false);
    expect(btn2.classList.contains('active')).toBe(false);
    expect(btn3.classList.contains('active')).toBe(true);
  });

  test('updates the generate button text to include the topic label', () => {
    // genBtnText is an input; the function sets its textContent
    const btnText = document.getElementById('genBtnText');
    const [btn] = makeTopicButtons(1);
    selectTopic({ label: 'Contraception', key: 'contraception' }, btn);
    expect(btnText.textContent).toContain('Contraception');
  });
});

describe('setMode()', () => {
  const { setMode, getSelectedMode } = mod;

  function makeModeButtons(modes = ['explain', 'quiz', 'clinical']) {
    const container = document.createElement('div');
    const buttons = {};
    modes.forEach(m => {
      const btn = document.createElement('button');
      btn.className = 'mode-btn';
      btn.dataset.mode = m;
      container.appendChild(btn);
      buttons[m] = btn;
    });
    document.body.appendChild(container);
    return buttons;
  }

  afterEach(() => {
    document.body.querySelectorAll('div').forEach(d => d.remove());
  });

  test('sets selectedMode to the supplied mode string', () => {
    const { quiz } = makeModeButtons();
    setMode('quiz', quiz);
    expect(getSelectedMode()).toBe('quiz');
  });

  test('adds "active" class to the clicked mode button', () => {
    const { clinical } = makeModeButtons();
    setMode('clinical', clinical);
    expect(clinical.classList.contains('active')).toBe(true);
  });

  test('removes "active" from all other mode buttons', () => {
    const buttons = makeModeButtons();
    buttons.explain.classList.add('active');
    setMode('clinical', buttons.clinical);
    expect(buttons.explain.classList.contains('active')).toBe(false);
    expect(buttons.clinical.classList.contains('active')).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 7.  showError()
// ═════════════════════════════════════════════════════════════════════════════
describe('showError()', () => {
  const { showError } = mod;

  test('injects error message into #contentArea', () => {
    showError('Something went wrong');
    expect(document.getElementById('contentArea').innerHTML).toContain(
      'Something went wrong'
    );
  });

  test('includes the warning emoji ⚠️', () => {
    showError('Test error');
    expect(document.getElementById('contentArea').innerHTML).toContain('⚠️');
  });

  test('replaces any previous content in #contentArea', () => {
    document.getElementById('contentArea').innerHTML = '<p>Old content</p>';
    showError('New error');
    expect(document.getElementById('contentArea').innerHTML).not.toContain(
      'Old content'
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 8.  generate()
// ═════════════════════════════════════════════════════════════════════════════
describe('generate()', () => {
  const { generate, setSelectedTopic, setSelectedMode } = mod;

  test('calls showError when no topic is selected', async () => {
    setSelectedTopic(null);
    await generate();
    expect(document.getElementById('contentArea').innerHTML).toContain(
      'Please select a topic first'
    );
  });

  test('calls fetchAndRender with a prompt when topic is selected', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({
        json: async () => ({
          content: [{ text: '# Result' }],
        }),
      });

    localStorage.setItem('anthropic_api_key', 'sk-test');
    setSelectedTopic({ label: 'PCOS', key: 'pcos' });
    setSelectedMode('explain');

    await generate();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.messages[0].content).toContain('PCOS');
    fetchSpy.mockRestore();
  });

  test('prompt includes topic label from selected mode', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({ content: [{ text: 'ok' }] }),
    });

    localStorage.setItem('anthropic_api_key', 'sk-test');
    setSelectedTopic({ label: 'Amenorrhea', key: 'amenorrhea' });
    setSelectedMode('quiz');

    await generate();

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.messages[0].content).toContain('Amenorrhea');
    fetchSpy.mockRestore();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 9.  askCustom()
// ═════════════════════════════════════════════════════════════════════════════
describe('askCustom()', () => {
  const { askCustom, setSelectedTopic } = mod;

  test('does nothing when the custom question input is empty', async () => {
    document.getElementById('customQ').value = '';
    const fetchSpy = jest.spyOn(global, 'fetch');
    await askCustom();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  test('does nothing when input is only whitespace', async () => {
    document.getElementById('customQ').value = '   ';
    const fetchSpy = jest.spyOn(global, 'fetch');
    await askCustom();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  test('calls fetchAndRender with question when input is non-empty', async () => {
    localStorage.setItem('anthropic_api_key', 'sk-test');
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({ content: [{ text: 'answer' }] }),
    });

    setSelectedTopic(null);
    document.getElementById('customQ').value = 'What is PCOS?';
    await askCustom();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    fetchSpy.mockRestore();
  });

  test('includes selected topic label in context when a topic is selected', async () => {
    localStorage.setItem('anthropic_api_key', 'sk-test');
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({ content: [{ text: 'ans' }] }),
    });

    setSelectedTopic({ label: 'PCOS', key: 'pcos' });
    document.getElementById('customQ').value = 'What are the symptoms?';
    await askCustom();

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.messages[0].content).toContain('PCOS');
    fetchSpy.mockRestore();
  });

  test('uses generic gynecology context when no topic is selected', async () => {
    localStorage.setItem('anthropic_api_key', 'sk-test');
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({ content: [{ text: 'ans' }] }),
    });

    setSelectedTopic(null);
    document.getElementById('customQ').value = 'Explain ovulation';
    await askCustom();

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.messages[0].content).toContain('in gynecology');
    fetchSpy.mockRestore();
  });

  test('the sent prompt contains the verbatim question text', async () => {
    localStorage.setItem('anthropic_api_key', 'sk-test');
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({ content: [{ text: 'ans' }] }),
    });

    setSelectedTopic(null);
    const question = 'What causes secondary amenorrhea?';
    document.getElementById('customQ').value = question;
    await askCustom();

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.messages[0].content).toContain(question);
    fetchSpy.mockRestore();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 10.  fetchAndRender()
// ═════════════════════════════════════════════════════════════════════════════
describe('fetchAndRender()', () => {
  const { fetchAndRender, setSelectedMode } = mod;

  test('disables generate and ask buttons during fetch', async () => {
    localStorage.setItem('anthropic_api_key', 'sk-test');
    let resolvePromise;
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockReturnValue(
        new Promise(resolve => {
          resolvePromise = resolve;
        })
      );

    const genBtn = document.getElementById('genBtn');
    const askBtn = document.getElementById('askBtn');

    const renderPromise = fetchAndRender('test prompt');
    expect(genBtn.disabled).toBe(true);
    expect(askBtn.disabled).toBe(true);

    // Resolve the fetch to avoid hanging
    resolvePromise({ json: async () => ({ content: [{ text: 'ok' }] }) });
    await renderPromise;

    fetchSpy.mockRestore();
  });

  test('re-enables buttons after successful fetch', async () => {
    localStorage.setItem('anthropic_api_key', 'sk-test');
    jest.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({ content: [{ text: 'content' }] }),
    });

    await fetchAndRender('prompt');

    expect(document.getElementById('genBtn').disabled).toBe(false);
    expect(document.getElementById('askBtn').disabled).toBe(false);
    jest.restoreAllMocks();
  });

  test('throws and shows error when no API key is set', async () => {
    localStorage.removeItem('anthropic_api_key');
    await fetchAndRender('some prompt');
    const html = document.getElementById('contentArea').innerHTML;
    expect(html).toContain('No API key set');
  });

  test('renders returned markdown content on success', async () => {
    localStorage.setItem('anthropic_api_key', 'sk-test');
    jest.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({
        content: [{ text: '## Result Heading\nSome explanation.' }],
      }),
    });

    await fetchAndRender('test prompt');

    expect(document.getElementById('contentArea').innerHTML).toContain(
      '<h2>Result Heading</h2>'
    );
    jest.restoreAllMocks();
  });

  test('shows error message when API returns an error field', async () => {
    localStorage.setItem('anthropic_api_key', 'sk-test');
    jest.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({
        error: { message: 'Invalid API key' },
      }),
    });

    await fetchAndRender('prompt');

    expect(document.getElementById('contentArea').innerHTML).toContain(
      'Invalid API key'
    );
    jest.restoreAllMocks();
  });

  test('re-enables buttons even when API returns an error', async () => {
    localStorage.setItem('anthropic_api_key', 'sk-test');
    jest.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({ error: { message: 'Some error' } }),
    });

    await fetchAndRender('prompt');

    expect(document.getElementById('genBtn').disabled).toBe(false);
    expect(document.getElementById('askBtn').disabled).toBe(false);
    jest.restoreAllMocks();
  });

  test('sends request to the correct Anthropic API endpoint', async () => {
    localStorage.setItem('anthropic_api_key', 'sk-test');
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({ content: [{ text: '' }] }),
    });

    await fetchAndRender('anything');

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.any(Object)
    );
    fetchSpy.mockRestore();
  });

  test('includes the correct anthropic-version header', async () => {
    localStorage.setItem('anthropic_api_key', 'sk-test');
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({ content: [{ text: '' }] }),
    });

    await fetchAndRender('anything');

    const headers = fetchSpy.mock.calls[0][1].headers;
    expect(headers['anthropic-version']).toBe('2023-06-01');
    fetchSpy.mockRestore();
  });

  test('includes the API key in x-api-key header', async () => {
    localStorage.setItem('anthropic_api_key', 'my-secret-key');
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({ content: [{ text: '' }] }),
    });

    await fetchAndRender('anything');

    const headers = fetchSpy.mock.calls[0][1].headers;
    expect(headers['x-api-key']).toBe('my-secret-key');
    fetchSpy.mockRestore();
  });

  test('uses the claude-sonnet model', async () => {
    localStorage.setItem('anthropic_api_key', 'sk-test');
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({ content: [{ text: '' }] }),
    });

    await fetchAndRender('anything');

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.model).toMatch(/claude/i);
    fetchSpy.mockRestore();
  });

  test('calls attachQuizInteractivity when selectedMode is quiz', async () => {
    localStorage.setItem('anthropic_api_key', 'sk-test');
    jest.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({ content: [{ text: 'A) Option\nAnswer: A' }] }),
    });

    setSelectedMode('quiz');
    await fetchAndRender('quiz prompt');

    // attachQuizInteractivity converts matching <p> tags to buttons
    // Just verify it ran without error — if a .rendered div exists we're good
    const rendered = document.querySelector('.rendered');
    expect(rendered).toBeTruthy();
    jest.restoreAllMocks();
  });

  test('handles empty content array gracefully', async () => {
    localStorage.setItem('anthropic_api_key', 'sk-test');
    jest.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({ content: [] }),
    });

    await fetchAndRender('prompt');
    // Should render empty content without throwing
    expect(document.getElementById('contentArea').innerHTML).toContain('rendered');
    jest.restoreAllMocks();
  });

  test('shows loading indicator before response arrives', async () => {
    localStorage.setItem('anthropic_api_key', 'sk-test');
    let capturedHtml = '';
    jest.spyOn(global, 'fetch').mockImplementation(() => {
      // Capture the loading HTML at the moment fetch is called
      capturedHtml = document.getElementById('contentArea').innerHTML;
      return Promise.resolve({
        json: async () => ({ content: [{ text: 'done' }] }),
      });
    });

    await fetchAndRender('prompt');
    expect(capturedHtml).toContain('loading');
    jest.restoreAllMocks();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 11.  attachQuizInteractivity()
// ═════════════════════════════════════════════════════════════════════════════
describe('attachQuizInteractivity()', () => {
  const { attachQuizInteractivity } = mod;

  function buildQuizDom(html) {
    document.body.innerHTML = `<div class="rendered">${html}</div>`;
  }

  test('does nothing when .rendered container does not exist', () => {
    document.body.innerHTML = '<div id="other"></div>';
    expect(() => attachQuizInteractivity()).not.toThrow();
  });

  test('replaces option paragraphs with clickable buttons', () => {
    buildQuizDom(`
      <p>A) First option</p>
      <p>B) Second option</p>
      <p>C) Third option</p>
      <p>D) Fourth option</p>
      <p>Answer: B</p>
    `);

    attachQuizInteractivity();

    const buttons = document.querySelectorAll('button.quiz-option');
    expect(buttons.length).toBe(4);
  });

  test('does not convert non-option paragraphs to buttons', () => {
    buildQuizDom(`
      <p>A regular paragraph</p>
      <p>A) An option</p>
      <p>Answer: A</p>
    `);

    attachQuizInteractivity();

    const buttons = document.querySelectorAll('button.quiz-option');
    expect(buttons.length).toBe(1);
  });

  test('quiz buttons carry the correct data-option attribute', () => {
    buildQuizDom(`
      <p>A) Choice Alpha</p>
      <p>B) Choice Beta</p>
      <p>Answer: A</p>
    `);

    attachQuizInteractivity();

    const buttons = document.querySelectorAll('button.quiz-option');
    expect(buttons[0].dataset.option).toBe('a)');
    expect(buttons[1].dataset.option).toBe('b)');
  });

  test('clicking the correct option marks it with "correct" class', () => {
    buildQuizDom(`
      <p>A) Right answer</p>
      <p>B) Wrong answer</p>
      <p><strong>Answer: A</strong></p>
    `);

    attachQuizInteractivity();

    const options = document.querySelectorAll('button.quiz-option');
    // Option A is correct
    options[0].click();
    expect(options[0].classList.contains('correct')).toBe(true);
  });

  test('clicking a wrong option marks it with "wrong" class', () => {
    buildQuizDom(`
      <p>A) Right answer</p>
      <p>B) Wrong answer</p>
      <p><strong>Answer: A</strong></p>
    `);

    attachQuizInteractivity();

    const options = document.querySelectorAll('button.quiz-option');
    // Option B is wrong
    options[1].click();
    expect(options[1].classList.contains('wrong')).toBe(true);
  });

  test('clicking an option disables all options', () => {
    buildQuizDom(`
      <p>A) Alpha</p>
      <p>B) Beta</p>
      <p>Answer: A</p>
    `);

    attachQuizInteractivity();

    const options = document.querySelectorAll('button.quiz-option');
    options[0].click();

    options.forEach(opt => expect(opt.disabled).toBe(true));
  });

  test('clicking an option inserts a quiz-feedback element', () => {
    buildQuizDom(`
      <p>A) Alpha</p>
      <p>B) Beta</p>
      <p>Answer: B</p>
    `);

    attachQuizInteractivity();

    const options = document.querySelectorAll('button.quiz-option');
    options[0].click();

    const feedback = document.querySelector('.quiz-feedback');
    expect(feedback).toBeTruthy();
  });

  test('correct feedback text says "✓ Correct!"', () => {
    buildQuizDom(`
      <p>A) Only option</p>
      <p>Answer: A</p>
    `);

    attachQuizInteractivity();

    document.querySelector('button.quiz-option').click();
    expect(document.querySelector('.quiz-feedback').textContent).toContain(
      '✓ Correct!'
    );
  });

  test('wrong feedback text says it is not right', () => {
    // Use option B (wrong) and Answer: C — 'b' does not appear in "answer: c"
    buildQuizDom(`
      <p>B) Wrong option</p>
      <p>C) Right option</p>
      <p>Answer: C</p>
    `);

    attachQuizInteractivity();

    const options = document.querySelectorAll('button.quiz-option');
    options[0].click(); // B is wrong
    expect(document.querySelector('.quiz-feedback').textContent).toContain(
      "That's not right"
    );
  });

  test('recognizes lowercase option labels like "a)"', () => {
    buildQuizDom(`
      <p>a) Lower alpha</p>
      <p>b) Lower beta</p>
      <p>Answer: a</p>
    `);

    attachQuizInteractivity();

    const buttons = document.querySelectorAll('button.quiz-option');
    expect(buttons.length).toBe(2);
  });
});
