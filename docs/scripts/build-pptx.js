const pptxgen = require('pptxgenjs');

const THEME = {
  white:      'FFFFFF',
  charcoal:   '1E1E2E',
  purple:     '7C3AED',
  blue:       '3B82F6',
  amber:      'F59E0B',
  violet:     '8B5CF6',
  green:      '10B981',
  red:        'EF4444',
  indigo:     '6366F1',
  lightGray:  'F3F4F6',
  midGray:    'E5E7EB',
  subtleText: '6B7280',
};

const FONT = 'Calibri';

// ── Helper: capability header ─────────────────────────────────────
function addCapabilityHeader(slide, icon, name, accentColor) {
  slide.addText(`${icon}  ${name}`, {
    x: 0.4, y: 0.25, w: 12.5, h: 0.65,
    fontSize: 26, bold: true, color: THEME.charcoal, fontFace: FONT,
  });
  slide.addShape('rect', {
    x: 0.4, y: 0.88, w: 2.2, h: 0.06,
    fill: { type: 'solid', color: accentColor },
    line: { type: 'none' },
  });
}

// ── Helper: feature card ──────────────────────────────────────────
function addFeatureCard(slide, x, y, name, benefit, accentColor) {
  const w = 5.6, h = 1.05;
  slide.addShape('rect', {
    x, y, w, h,
    fill: { type: 'solid', color: THEME.lightGray },
    line: { type: 'none' },
  });
  slide.addShape('rect', {
    x, y, w, h: 0.055,
    fill: { type: 'solid', color: accentColor },
    line: { type: 'none' },
  });
  slide.addText(name, {
    x: x + 0.18, y: y + 0.1, w: w - 0.36, h: 0.35,
    fontSize: 13, bold: true, color: THEME.charcoal, fontFace: FONT,
  });
  slide.addText(benefit, {
    x: x + 0.18, y: y + 0.47, w: w - 0.36, h: 0.4,
    fontSize: 11, color: THEME.subtleText, fontFace: FONT, wrap: true,
  });
  slide.addText('✅  Live', {
    x: x + w - 0.9, y: y + 0.1, w: 0.75, h: 0.28,
    fontSize: 9, color: THEME.green, fontFace: FONT, align: 'right',
  });
}

// ── Helper: lo-fi mockup bounding box ────────────────────────────
function addMockupBox(slide) {
  slide.addShape('rect', {
    x: 6.8, y: 1.1, w: 6.1, h: 5.9,
    fill: { type: 'solid', color: 'F9FAFB' },
    line: { width: 1.5, color: THEME.midGray, dashType: 'dash' },
  });
  slide.addText('Lo-fi Mockup', {
    x: 6.8, y: 1.1, w: 6.1, h: 0.35,
    fontSize: 8, color: THEME.subtleText, fontFace: FONT,
    align: 'center', italic: true,
  });
}

async function main() {
  const prs = new pptxgen();
  prs.layout = 'LAYOUT_WIDE';

  // ── Slide 1: Title ──────────────────────────────────────────────
  {
    const s = prs.addSlide();
    s.background = { color: '0F0C29' };
    s.addShape('rect', {
      x: 0, y: 0, w: 13.33, h: 0.08,
      fill: { type: 'solid', color: THEME.purple },
      line: { type: 'none' },
    });
    s.addText('World Clock & Weather', {
      x: 1.5, y: 2.2, w: 10.33, h: 1.2,
      fontSize: 44, bold: true, color: THEME.white, fontFace: FONT, align: 'center',
    });
    s.addText('Live time, weather, and solar data — personalized for your cities', {
      x: 1.5, y: 3.55, w: 10.33, h: 0.6,
      fontSize: 18, color: 'A78BFA', fontFace: FONT, align: 'center',
    });
    s.addText('March 2026', {
      x: 1.5, y: 6.5, w: 10.33, h: 0.4,
      fontSize: 13, color: '6B7280', fontFace: FONT, align: 'center',
    });
  }

  // ── Slide 2: Capabilities Overview ─────────────────────────────
  {
    const s = prs.addSlide();
    s.background = { color: THEME.white };
    s.addText('What It Does', {
      x: 0.5, y: 0.3, w: 12.33, h: 0.7,
      fontSize: 28, bold: true, color: THEME.charcoal, fontFace: FONT,
    });
    s.addShape('rect', {
      x: 0.5, y: 1.0, w: 1.8, h: 0.06,
      fill: { type: 'solid', color: THEME.purple },
      line: { type: 'none' },
    });

    const capabilities = [
      { icon: '🌍', name: 'Global Time Awareness',  desc: 'Live clocks for any city, any timezone',        color: THEME.blue   },
      { icon: '🌤', name: 'Live Weather',            desc: 'Real-time conditions and temperature',          color: THEME.amber  },
      { icon: '🌓', name: 'Solar & Moon Tracking',   desc: 'Sunrise, sunset, and moon phase data',          color: THEME.violet },
      { icon: '🔐', name: 'Personalized Accounts',   desc: 'Your own login and city list',                  color: THEME.green  },
      { icon: '🏙', name: 'City Management',          desc: 'Add and remove cities on the fly',             color: THEME.red    },
      { icon: '🤖', name: 'AI Assistant',             desc: 'Ask questions, search, and summarize weather', color: THEME.indigo },
    ];

    const tileW = 3.8, tileH = 2.3, gapX = 0.26, gapY = 0.3;
    const startX = 0.5, startY = 1.2;

    capabilities.forEach((cap, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = startX + col * (tileW + gapX);
      const y = startY + row * (tileH + gapY);

      s.addShape('roundRect', {
        x, y, w: tileW, h: tileH, rectRadius: 0.15,
        fill: { type: 'solid', color: THEME.lightGray }, line: { type: 'none' },
      });
      s.addShape('rect', {
        x, y, w: 0.07, h: tileH,
        fill: { type: 'solid', color: cap.color }, line: { type: 'none' },
      });
      s.addText(cap.icon, {
        x: x + 0.2, y: y + 0.25, w: 0.7, h: 0.6, fontSize: 24, fontFace: FONT,
      });
      s.addText(cap.name, {
        x: x + 0.2, y: y + 0.9, w: tileW - 0.35, h: 0.45,
        fontSize: 14, bold: true, color: THEME.charcoal, fontFace: FONT,
      });
      s.addText(cap.desc, {
        x: x + 0.2, y: y + 1.38, w: tileW - 0.35, h: 0.65,
        fontSize: 11, color: THEME.subtleText, fontFace: FONT, wrap: true,
      });
    });
  }

  // ── Slide 3: Global Time Awareness ─────────────────────────────
  {
    const s = prs.addSlide();
    s.background = { color: THEME.white };
    addCapabilityHeader(s, '🌍', 'Global Time Awareness', THEME.blue);

    [
      ['Live City Clock',    'You can see the exact time in any city, updated every second'],
      ['Day & Date Display', 'You can see the weekday and full date at a glance for each city'],
      ['World Timeline Bar', 'You can see all your cities laid out on a single GMT axis'],
      ['Hover Time Tooltip', 'You can hover the timeline to see the local time at any longitude'],
    ].forEach(([name, benefit], i) => addFeatureCard(s, 0.4, 1.1 + i * 1.2, name, benefit, THEME.blue));

    addMockupBox(s);

    // Lo-fi: 3 mini city cards
    [['New York', '08:42 AM', 7.1], ['London', '01:42 PM', 9.15], ['Chennai', '07:12 PM', 11.2]].forEach(([city, time, x]) => {
      s.addShape('roundRect', { x, y: 1.6, w: 1.85, h: 1.1, rectRadius: 0.1, fill: { type: 'solid', color: THEME.midGray }, line: { type: 'none' } });
      s.addText(city, { x, y: 1.68, w: 1.85, h: 0.3, fontSize: 9, bold: true, color: THEME.charcoal, fontFace: FONT, align: 'center' });
      s.addText(time, { x, y: 2.02, w: 1.85, h: 0.45, fontSize: 15, bold: true, color: THEME.charcoal, fontFace: FONT, align: 'center' });
    });

    // Timeline bar
    s.addShape('rect', { x: 7.1, y: 3.1, w: 5.9, h: 0.35, fill: { type: 'solid', color: THEME.midGray }, line: { type: 'none' } });
    s.addText('GMT  -12 ─────────────── 0 ─────────────── +14', { x: 7.1, y: 3.1, w: 5.9, h: 0.35, fontSize: 7, color: THEME.subtleText, fontFace: FONT, align: 'center' });
    [['NYC', 7.85], ['LDN', 9.55], ['SGP', 12.2]].forEach(([label, px]) => {
      s.addShape('line', { x: px, y: 3.0, w: 0, h: 0.55, line: { width: 1.5, color: THEME.blue } });
      s.addText(label, { x: px - 0.2, y: 2.82, w: 0.5, h: 0.2, fontSize: 7, color: THEME.blue, fontFace: FONT, align: 'center' });
    });
  }

  // ── Slide 4: Live Weather ───────────────────────────────────────
  {
    const s = prs.addSlide();
    s.background = { color: THEME.white };
    addCapabilityHeader(s, '🌤', 'Live Weather', THEME.amber);

    addFeatureCard(s, 0.4, 1.1,  'Current Temperature',      'You can see the live temperature in °F for every city on your dashboard', THEME.amber);
    addFeatureCard(s, 0.4, 2.35, 'Weather Condition & Icon', 'You can see a description and icon for current conditions — sunny, rainy, cloudy, and more', THEME.amber);

    addMockupBox(s);

    s.addShape('roundRect', { x: 8.5, y: 2.0, w: 3.3, h: 2.8, rectRadius: 0.15, fill: { type: 'solid', color: THEME.midGray }, line: { type: 'none' } });
    s.addText('☀️', { x: 8.9, y: 2.25, w: 1.0, h: 0.7, fontSize: 28, fontFace: FONT });
    s.addText('72°F', { x: 9.95, y: 2.35, w: 1.5, h: 0.55, fontSize: 22, bold: true, color: THEME.charcoal, fontFace: FONT });
    s.addText('Clear sky', { x: 8.7, y: 3.1, w: 2.9, h: 0.35, fontSize: 11, color: THEME.subtleText, fontFace: FONT, align: 'center' });
  }

  // ── Slide 5: Solar & Moon Tracking ─────────────────────────────
  {
    const s = prs.addSlide();
    s.background = { color: THEME.white };
    addCapabilityHeader(s, '🌓', 'Solar & Moon Tracking', THEME.violet);

    [
      ['Sunrise & Sunset Times', 'You can see exactly when the sun rises and sets in each city'],
      ['Day / Night Indicator',  "You can see at a glance whether it's currently daytime or nighttime"],
      ['Moon Phase',             'You can see the current moon phase name, emoji, and illumination %'],
      ['Full Moon Watch',        'You can see days since the last full moon and a countdown to the next one'],
    ].forEach(([name, benefit], i) => addFeatureCard(s, 0.4, 1.1 + i * 1.2, name, benefit, THEME.violet));

    addMockupBox(s);

    s.addShape('rect', { x: 7.1, y: 1.7,  w: 5.9, h: 0.55, fill: { type: 'solid', color: THEME.midGray }, line: { type: 'none' } });
    s.addText('☀️  Day    ↑ 06:32   ↓ 18:45', { x: 7.2, y: 1.78, w: 5.7, h: 0.38, fontSize: 11, color: THEME.charcoal, fontFace: FONT });

    s.addShape('rect', { x: 7.1, y: 2.45, w: 5.9, h: 0.55, fill: { type: 'solid', color: THEME.midGray }, line: { type: 'none' } });
    s.addText('🌔  Waxing Gibbous   74%', { x: 7.2, y: 2.53, w: 5.7, h: 0.38, fontSize: 11, color: THEME.charcoal, fontFace: FONT });

    s.addShape('rect', { x: 7.1, y: 3.2,  w: 5.9, h: 0.55, fill: { type: 'solid', color: THEME.midGray }, line: { type: 'none' } });
    s.addText('Last full moon: 8 days ago   Next: in 21 days', { x: 7.2, y: 3.28, w: 5.7, h: 0.38, fontSize: 10, color: THEME.subtleText, fontFace: FONT });
  }

  // ── Slide 6: Personalized Accounts ─────────────────────────────
  {
    const s = prs.addSlide();
    s.background = { color: THEME.white };
    addCapabilityHeader(s, '🔐', 'Personalized Accounts', THEME.green);

    addFeatureCard(s, 0.4, 1.1,  'Email Sign-Up', 'You can create an account with any email address and a password of your choice', THEME.green);
    addFeatureCard(s, 0.4, 2.35, 'Sign In',        'You can securely log back in to instantly restore your saved city list', THEME.green);
    addFeatureCard(s, 0.4, 3.6,  'Sign Out',       'You can log out at any time to keep your account and data secure', THEME.green);

    addMockupBox(s);

    s.addShape('roundRect', { x: 8.3, y: 1.9, w: 3.8, h: 3.5, rectRadius: 0.18, fill: { type: 'solid', color: THEME.lightGray }, line: { width: 1, color: THEME.midGray } });
    s.addText('World Clock & Weather', { x: 8.5, y: 2.1, w: 3.4, h: 0.4, fontSize: 13, bold: true, color: THEME.charcoal, fontFace: FONT, align: 'center' });
    s.addText('Sign in to your account', { x: 8.5, y: 2.52, w: 3.4, h: 0.28, fontSize: 9, color: THEME.subtleText, fontFace: FONT, align: 'center' });
    [['Email', 3.0], ['Password', 3.55]].forEach(([label, fy]) => {
      s.addShape('rect', { x: 8.55, y: fy, w: 3.1, h: 0.38, fill: { type: 'solid', color: THEME.white }, line: { width: 1, color: THEME.midGray } });
      s.addText(label, { x: 8.65, y: fy + 0.08, w: 2.9, h: 0.24, fontSize: 9, color: 'BCBCBC', fontFace: FONT });
    });
    s.addShape('roundRect', { x: 8.55, y: 4.1, w: 3.1, h: 0.42, rectRadius: 0.08, fill: { type: 'solid', color: THEME.purple }, line: { type: 'none' } });
    s.addText('Sign In', { x: 8.55, y: 4.12, w: 3.1, h: 0.38, fontSize: 11, bold: true, color: THEME.white, fontFace: FONT, align: 'center' });
  }

  // ── Slide 7: City Management ────────────────────────────────────
  {
    const s = prs.addSlide();
    s.background = { color: THEME.white };
    addCapabilityHeader(s, '🏙', 'City Management', THEME.red);

    addFeatureCard(s, 0.4, 1.1,  'Add Any City',     'You can search by name, pick from results, and your city is added instantly', THEME.red);
    addFeatureCard(s, 0.4, 2.35, 'Remove a City',    'You can hover over any city card and click × to remove it from your list', THEME.red);
    addFeatureCard(s, 0.4, 3.6,  'Cloud Persistence','You can log in from anywhere and find your city list exactly as you left it', THEME.red);

    addMockupBox(s);

    // Mini city cards with × button
    [[7.2, 1.8], [9.3, 1.8]].forEach(([cx, cy]) => {
      s.addShape('roundRect', { x: cx, y: cy, w: 1.8, h: 1.5, rectRadius: 0.1, fill: { type: 'solid', color: THEME.midGray }, line: { type: 'none' } });
      s.addText('×', { x: cx + 1.45, y: cy + 0.05, w: 0.3, h: 0.3, fontSize: 12, color: THEME.red, fontFace: FONT, align: 'center' });
    });

    // Ghost add card
    s.addShape('roundRect', { x: 11.4, y: 1.8, w: 1.8, h: 1.5, rectRadius: 0.1, fill: { type: 'solid', color: 'F9FAFB' }, line: { width: 1.5, color: THEME.midGray, dashType: 'dash' } });
    s.addText('+', { x: 11.4, y: 2.2, w: 1.8, h: 0.5, fontSize: 22, color: THEME.subtleText, fontFace: FONT, align: 'center' });
    s.addText('Add city', { x: 11.4, y: 2.75, w: 1.8, h: 0.3, fontSize: 9, color: THEME.subtleText, fontFace: FONT, align: 'center' });

    // Search panel
    s.addShape('roundRect', { x: 7.2, y: 3.7, w: 5.9, h: 2.8, rectRadius: 0.15, fill: { type: 'solid', color: THEME.lightGray }, line: { width: 1, color: THEME.midGray } });
    s.addShape('rect', { x: 7.4, y: 3.95, w: 5.5, h: 0.4, fill: { type: 'solid', color: THEME.white }, line: { width: 1, color: THEME.midGray } });
    s.addText('Search city…', { x: 7.5, y: 3.97, w: 5.3, h: 0.36, fontSize: 9, color: 'BCBCBC', fontFace: FONT });
    ['Tokyo, JP', 'Toronto, CA'].forEach((result, ri) => {
      s.addShape('rect', { x: 7.4, y: 4.55 + ri * 0.48, w: 5.5, h: 0.4, fill: { type: 'solid', color: THEME.white }, line: { width: 0.5, color: THEME.midGray } });
      s.addText(result, { x: 7.5, y: 4.57 + ri * 0.48, w: 5.3, h: 0.36, fontSize: 9, color: THEME.charcoal, fontFace: FONT });
    });
  }

  // ── Slide 8: AI Assistant ───────────────────────────────────────
  {
    const s = prs.addSlide();
    s.background = { color: THEME.white };
    addCapabilityHeader(s, '🤖', 'AI Assistant', THEME.indigo);

    addFeatureCard(s, 0.4, 1.1,  'Ask Weather Questions',  'You can ask "Which city is warmest right now?" and get an instant answer', THEME.indigo);
    addFeatureCard(s, 0.4, 2.35, 'Search & Filter Cities', 'You can ask "Show me Asian cities" and the matching cards are highlighted', THEME.indigo);
    addFeatureCard(s, 0.4, 3.6,  'Weather Summary',        'You can get a one-sentence summary comparing conditions across all your cities', THEME.indigo);

    addMockupBox(s);

    s.addShape('roundRect', { x: 7.1, y: 1.7, w: 5.9, h: 4.8, rectRadius: 0.15, fill: { type: 'solid', color: THEME.lightGray }, line: { width: 1, color: THEME.midGray } });
    s.addText('AI Weather Assistant', { x: 7.3, y: 1.9, w: 5.5, h: 0.35, fontSize: 11, bold: true, color: THEME.charcoal, fontFace: FONT });

    s.addShape('roundRect', { x: 9.5, y: 2.5, w: 3.2, h: 0.55, rectRadius: 0.12, fill: { type: 'solid', color: THEME.indigo }, line: { type: 'none' } });
    s.addText('Which city is warmest?', { x: 9.55, y: 2.54, w: 3.1, h: 0.42, fontSize: 9, color: THEME.white, fontFace: FONT });

    s.addShape('roundRect', { x: 7.3, y: 3.3, w: 3.8, h: 0.75, rectRadius: 0.12, fill: { type: 'solid', color: THEME.white }, line: { width: 1, color: THEME.midGray } });
    s.addText('Singapore is the warmest at 88°F with partly cloudy skies.', { x: 7.4, y: 3.34, w: 3.6, h: 0.65, fontSize: 9, color: THEME.charcoal, fontFace: FONT, wrap: true });

    s.addShape('rect', { x: 7.3, y: 5.8, w: 4.5, h: 0.42, fill: { type: 'solid', color: THEME.white }, line: { width: 1, color: THEME.midGray } });
    s.addText('Ask about the weather…', { x: 7.4, y: 5.82, w: 4.3, h: 0.36, fontSize: 9, color: 'BCBCBC', fontFace: FONT });
    s.addShape('roundRect', { x: 11.85, y: 5.8, w: 0.9, h: 0.42, rectRadius: 0.06, fill: { type: 'solid', color: THEME.indigo }, line: { type: 'none' } });
    s.addText('Ask', { x: 11.85, y: 5.82, w: 0.9, h: 0.38, fontSize: 9, bold: true, color: THEME.white, fontFace: FONT, align: 'center' });
  }

  // ── Slide 9: Powered By ─────────────────────────────────────────
  {
    const s = prs.addSlide();
    s.background = { color: THEME.white };

    s.addText('Built With', {
      x: 0.5, y: 0.3, w: 12.33, h: 0.7,
      fontSize: 28, bold: true, color: THEME.charcoal, fontFace: FONT,
    });
    s.addShape('rect', {
      x: 0.5, y: 1.0, w: 1.4, h: 0.06,
      fill: { type: 'solid', color: THEME.purple },
      line: { type: 'none' },
    });

    const stack = [
      { name: 'React',          role: 'Frontend UI',         color: THEME.blue   },
      { name: 'Supabase',       role: 'Auth & database',     color: THEME.green  },
      { name: 'Claude AI',      role: 'AI assistant',        color: THEME.violet },
      { name: 'OpenWeatherMap', role: 'Weather data',        color: THEME.amber  },
      { name: 'SunCalc',        role: 'Solar & moon data',   color: THEME.indigo },
    ];

    const tileW = 2.2, tileH = 2.8;
    const totalW = stack.length * tileW + (stack.length - 1) * 0.25;
    const startX = (13.33 - totalW) / 2;

    stack.forEach((item, i) => {
      const x = startX + i * (tileW + 0.25);
      const y = 1.6;
      s.addShape('roundRect', { x, y, w: tileW, h: tileH, rectRadius: 0.15, fill: { type: 'solid', color: THEME.lightGray }, line: { type: 'none' } });
      s.addShape('rect', { x, y, w: tileW, h: 0.07, fill: { type: 'solid', color: item.color }, line: { type: 'none' } });
      s.addText(item.name, { x, y: y + 0.9, w: tileW, h: 0.55, fontSize: 14, bold: true, color: THEME.charcoal, fontFace: FONT, align: 'center' });
      s.addText(item.role, { x, y: y + 1.55, w: tileW, h: 0.55, fontSize: 11, color: THEME.subtleText, fontFace: FONT, align: 'center', wrap: true });
    });
  }

  await prs.writeFile({ fileName: 'docs/feature-cards.pptx' });
  console.log('✅  docs/feature-cards.pptx created');
}

main().catch(console.error);
