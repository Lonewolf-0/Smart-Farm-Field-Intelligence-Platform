import { getNasaPowerData } from "./nasaPower.service";

async function test() {
  try {
    // Somewhere in central US
    const lat = 40.7128;
    const lng = -74.0060;
    
    // Fetch last 7 days of 2025 (API has data delay, so 2025 is safe)
    const startDate = "20250101";
    const endDate = "20250107";
    
    console.log("Fetching NASA POWER API...");
    const data = await getNasaPowerData(lat, lng, startDate, endDate);
    
    console.log("\nResults:");
    data.forEach(d => {
      console.log(`Date: ${d.date}`);
      console.log(`  Tmean: ${d.tmean}°C`);
      console.log(`  Tmax: ${d.tmax}°C, Tmin: ${d.tmin}°C`);
      console.log(`  Solar Rad: ${d.solarRadiation} MJ/m2/day`);
      console.log(`  ET0: ${d.et0} mm/day`);
      if (d.et0 >= 0 && d.et0 <= 15) {
        console.log("  => ET0 is within expected reasonable range (2-8 mm/day usually)");
      } else {
        console.log("  => ET0 is OUT of typical range!");
      }
      console.log("------------------------");
    });

  } catch (err) {
    console.error("Test failed:", err);
  }
}

test();
