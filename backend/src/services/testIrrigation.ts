import { calculateIrrigation } from "./irrigationService";

const weatherNoRain: any = {
  forecast: Array(7).fill({ precipitation: 0 })
};

const weatherWithRain: any = {
  forecast: Array(7).fill({ precipitation: 10 }) // 10mm every day
};

const nasaDataNoRain = Array(7).fill({
  et0: 5.0,
  precipitation: 0
});

const nasaDataWithRain = Array(7).fill({
  et0: 3.0,
  precipitation: 20
});

console.log("--- Test 1: Sandy Soil with NO rain (Past & Future) ---");
const sandyResult = calculateIrrigation({ texture: "Sandy" }, weatherNoRain, nasaDataNoRain);
console.log("Result:", sandyResult);
if (sandyResult.nextIrrigationDays <= 1) {
  console.log("PASS: Sandy soil needs irrigation soon!");
} else {
  console.error("FAIL: Expected sandy soil to need irrigation soon.");
}

console.log("\n--- Test 2: Clay Soil with LOTS of rain (Past & Future) ---");
const clayResult = calculateIrrigation({ texture: "Clay" }, weatherWithRain, nasaDataWithRain);
console.log("Result:", clayResult);
if (clayResult.nextIrrigationDays > 5) {
  console.log("PASS: Clay soil has more days until irrigation!");
} else {
  console.error("FAIL: Expected clay soil to have many days until irrigation.");
}
