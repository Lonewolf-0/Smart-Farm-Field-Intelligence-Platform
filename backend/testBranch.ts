import { findNearestBranches } from './src/services/branchService';

async function test() {
  try {
    const branches = await findNearestBranches(18.5204, 73.8567, 5);
    console.log("Success:", branches);
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
