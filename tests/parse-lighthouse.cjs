const fs = require('fs');
const path = require('path');

const reportPath = path.resolve(__dirname, '../reports/production-testing-2026-09-29/lighthouse-report.report.json');
const rep = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

const scores = {};
for (const [k, v] of Object.entries(rep.categories)) {
  scores[v.title] = Math.round(v.score * 100);
}

const metrics = {
  FCP: rep.audits['first-contentful-paint'].displayValue,
  LCP: rep.audits['largest-contentful-paint'].displayValue,
  TBT: rep.audits['total-blocking-time'].displayValue,
  CLS: rep.audits['cumulative-layout-shift'].displayValue,
  SpeedIndex: rep.audits['speed-index'].displayValue
};

console.log('Lighthouse Scores:', JSON.stringify(scores, null, 2));
console.log('Core Web Vitals:', JSON.stringify(metrics, null, 2));

fs.writeFileSync(
  path.resolve(__dirname, '../reports/production-testing-2026-09-29/lighthouse-summary.json'),
  JSON.stringify({ scores, metrics }, null, 2)
);
