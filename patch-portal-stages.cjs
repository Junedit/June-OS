const fs = require('fs');

const targetPath = 'src/screens/ClientPortal.tsx';
let content = fs.readFileSync(targetPath, 'utf8');

// Replace TRACKER_STEPS
const newTrackerSteps = `const TRACKER_STEPS = [
  { key: 'planning', label: 'Onboarding', description: 'Project planning and contracting.' },
  { key: 'raw', label: 'Raw Footage', description: 'Raw assets delivered and verified.' },
  { key: 'editing', label: 'Editing', description: 'Editor is working on your cut.' },
  { key: 'feedback', label: 'Feedback', description: 'Drafts ready for review.' },
  { key: 'revisions', label: 'Revisions', description: 'Your notes are being addressed.' },
  { key: 'done', label: 'Final Delivery', description: 'High-res final video delivered.' }
];`;
content = content.replace(/const TRACKER_STEPS = \[[\s\S]*?\];/m, newTrackerSteps);

// Update progress calculation
content = content.replace(
  'const completedTasks = TRACKER_STEPS.filter(step => lead.tasks[step.key]).length;',
  `const stageIndex = TRACKER_STEPS.findIndex(s => s.key === (lead.deliveryStage || 'planning'));
  const completedTasks = stageIndex >= 0 ? stageIndex + 1 : 1;`
);

// Update timeline render
content = content.replace(
  'const isCompleted = lead.tasks[step.key];\n                const isNext = !isCompleted && (idx === 0 || lead.tasks[TRACKER_STEPS[idx - 1].key]);',
  `const isCompleted = idx <= stageIndex;
                const isNext = idx === stageIndex + 1;`
);

fs.writeFileSync(targetPath, content, 'utf8');
