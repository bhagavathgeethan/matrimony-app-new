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

function synthesizeArchetype(blueprint) {
  const moneyDesc = blueprint.money > 60 ? "saver" : "living for now";
  const rootsDesc = blueprint.roots < 45 ? "who'd move cities for the right role" : "anchored to family roots";
  const kidsDesc = blueprint.kids > 50 ? "wants kids within a few years" : "focused on shared partnership";
  const ambitionDesc = blueprint.ambition > 70 ? "won't apologise for ambition" : "protects evening work-life balance";

  return `In short: a ${moneyDesc} ${rootsDesc}, ${kidsDesc}, and ${ambitionDesc}.`;
}

module.exports = {
  calculatePillarOverlap,
  computeMatchScore,
  synthesizeArchetype
};
