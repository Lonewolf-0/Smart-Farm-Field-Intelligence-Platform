import { getSoilProperties } from "./services/soilService";

const testSoilGrids = async () => {
  console.log("Testing with known land coordinates (lat: 52.41, lon: 5.39 - Netherlands)...");
  try {
    const data = await getSoilProperties(52.41, 5.39);
    console.log("Land Data:", JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.error("Land test failed:", err.message);
  }

  console.log("\nTesting with ocean coordinates (lat: 0, lon: 0)...");
  try {
    const oceanData = await getSoilProperties(0, 0);
    console.log("Ocean Data:", JSON.stringify(oceanData, null, 2));
  } catch (err: any) {
    console.error("Ocean test failed:", err.message);
  }
};

testSoilGrids();
