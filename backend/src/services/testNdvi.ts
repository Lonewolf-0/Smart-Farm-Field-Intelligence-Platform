import { getNDVIData } from "./ndviService";

async function testNDVI() {
  try {
    console.log("Testing NDVI with Agricultural Area (Iowa, USA)");
    // Iowa farm field
    const agPolygon = {
      type: "Polygon" as const,
      coordinates: [[
        [-93.600, 41.500],
        [-93.600, 41.501],
        [-93.599, 41.501],
        [-93.599, 41.500],
        [-93.600, 41.500]
      ]]
    };
    
    const agData = await getNDVIData(agPolygon);
    console.log("Agricultural Data:", agData);

    console.log("\nTesting NDVI with Non-Agricultural Area (Sahara Desert)");
    // Sahara desert
    const desertPolygon = {
      type: "Polygon" as const,
      coordinates: [[
        [10.000, 25.000],
        [10.000, 25.001],
        [10.001, 25.001],
        [10.001, 25.000],
        [10.000, 25.000]
      ]]
    };

    const desertData = await getNDVIData(desertPolygon);
    console.log("Desert Data:", desertData);

  } catch (error) {
    console.error("Test failed:", error);
  }
}

testNDVI();
