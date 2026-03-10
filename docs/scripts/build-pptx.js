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

async function main() {
  const prs = new pptxgen();
  prs.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 inches

  // slides added in subsequent tasks

  await prs.writeFile({ fileName: 'docs/feature-cards.pptx' });
  console.log('✅  docs/feature-cards.pptx created');
}

main().catch(console.error);
