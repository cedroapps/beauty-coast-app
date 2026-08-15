const fs = require('fs');
const content = fs.readFileSync('www/index.html', 'utf8');

// 1. onboardingSteps has 8 message: entries
const onboardingStepsMatch = content.match(/const\s+onboardingSteps\s*=\s*\[([\s\S]*?)\]/i) || content.match(/let\s+onboardingSteps\s*=\s*\[([\s\S]*?)\]/i) || content.match(/onboardingSteps\s*=\s*\[([\s\S]*?)\]/i);
let stepsMessageCount = 0;
if (onboardingStepsMatch) {
  const stepsContent = onboardingStepsMatch[1];
  stepsMessageCount = (stepsContent.match(/message\s*:/g) || []).length;
} else {
  // Try alternative matching
  console.log('Could not find onboardingSteps array match via regex.');
}

// 2. window.startOnboarding = startOnboarding is present
const hasStartOnboarding = content.includes('window.startOnboarding = startOnboarding');

// 3. bc_onboarding_completed is read and written
// Let's count occurrence or check operations
const bcMatches = content.match(/bc_onboarding_completed/g) || [];
const readAndWritten = bcMatches.length >= 2; // Usually read with localStorage.getItem and written with localStorage.setItem

// 4. openModal(day) calls completeOnboardingDaySelection()
// Let's see if we can find openModal in the file and if it contains completeOnboardingDaySelection
const openModalIndex = content.indexOf('openModal');
let callsComplete = false;
if (openModalIndex !== -1) {
  // Get block of code after openModal
  const block = content.substring(openModalIndex, openModalIndex + 1000);
  callsComplete = block.includes('completeOnboardingDaySelection');
}

console.log('--- Verification Results ---');
console.log('stepsMessageCount (Target: 8):', stepsMessageCount);
console.log('hasStartOnboarding (Target: true):', hasStartOnboarding);
console.log('bc_onboarding_completed occurrences:', bcMatches.length);
console.log('openModal calls completeOnboardingDaySelection (Target: true):', callsComplete);