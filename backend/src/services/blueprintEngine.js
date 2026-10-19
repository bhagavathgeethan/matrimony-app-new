/**
 * 4-Pillar Blueprint Compatibility Engine
 * Calculates fit based on alignment in:
 * 1. Money philosophy
 * 2. Roots & geography
 * 3. Kids & parenting
 * 4. Career ambition
 */

function calculatePillarOverlap(userVal, candidateVal, flexibility = "open") {
  const diff = Math.abs(userVal - candidateVal);
  // Max divergence is 100
  let score = 100 - diff;
  if (flexibility === "firm" && diff > 25) {
    score = Math.max(0, score - 15); // Penalty for firm dealbreakers
  }
  return Math.min(100, Math.max(0, Math.round(score)));
}

function computeMatchScore(userBlueprint, candidateBlueprint) {
  const money = calculatePillarOverlap(
    userBlueprint.money,
    candidateBlueprint.money,
    userBlueprint.moneyFlexibility
  );
  const roots = calculatePillarOverlap(
    userBlueprint.roots,
    candidateBlueprint.roots,
    userBlueprint.rootsFlexibility
  );
  const kids = calculatePillarOverlap(
    userBlueprint.kids,
    candidateBlueprint.kids,
    userBlueprint.kidsFlexibility
  );
  const ambition = calculatePillarOverlap(
    userBlueprint.ambition,
    candidateBlueprint.ambition,
    userBlueprint.ambitionFlexibility
  );

  // Weighted average
  const overall = Math.round(
    money * 0.3 + roots * 0.25 + kids * 0.25 + ambition * 0.2
  );

  return {
    overall,
    money,
    roots,
    kids,
    ambition
  };
}

// Plain-language summary. Values near the middle get a neutral phrase instead of being pushed to one side.
// Keep in step with blueprintSummary in shared/constants.js.
function archetypeParts(bp) {
  return {
    money: bp.money > 60 ? 'saver' : bp.money < 40 ? 'spender who lives for now' : 'balanced saver-spender',
    roots: bp.roots < 40 ? 'who’d move cities for the right role' : bp.roots > 60 ? 'anchored to family roots' : 'flexible about where to live',
    kids: bp.kids > 55 ? 'wants kids within a few years' : bp.kids < 40 ? 'focused on shared partnership' : 'open on when to have kids',
    ambition: bp.ambition > 70 ? 'won’t apologise for ambition' : bp.ambition <= 40 ? 'protects evening work-life balance' : 'balances career and home',
  };
}

function synthesizeArchetype(blueprint) {
  const p = archetypeParts(blueprint);
  return `In short: a ${p.money} ${p.roots}, ${p.kids}, and ${p.ambition}.`;
}

module.exports = {
  calculatePillarOverlap,
  computeMatchScore,
  synthesizeArchetype,
  archetypeParts
};
