const http = require("http");
const { computeMatchScore, synthesizeArchetype } = require("../src/services/blueprintEngine");

function runUnitTests() {
  console.log("Running Blueprint & Core Matching Engine Tests...");

  // Test 1: Blueprint Overlap
  const user = {
    money: 72,
    moneyFlexibility: "open",
    roots: 31,
    rootsFlexibility: "firm",
    kids: 58,
    kidsFlexibility: "open",
    ambition: 84,
    ambitionFlexibility: "firm"
  };

  const candidate = {
    money: 75,
    roots: 35,
    kids: 60,
    ambition: 80
  };

  const scores = computeMatchScore(user, candidate);
  console.log("Computed Scores:", scores);
  if (scores.overall >= 80 && scores.overall <= 100) {
    console.log("✓ Test 1 Passed: Overlap calculation within expected bounds");
  } else {
    console.error("✗ Test 1 Failed");
    process.exit(1);
  }

  // Test 2: Archetype Synthesis
  const archetype = synthesizeArchetype(user);
  console.log("Archetype:", archetype);
  if (archetype.includes("saver") && archetype.includes("ambition")) {
    console.log("✓ Test 2 Passed: Archetype text synthesized correctly");
  } else {
    console.error("✗ Test 2 Failed");
    process.exit(1);
  }

  console.log("All non-auth tests passed successfully!");
}

runUnitTests();
