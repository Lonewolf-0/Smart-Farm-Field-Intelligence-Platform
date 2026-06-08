import { Router } from "express";
import {
  getAllBranches,
  getNearestBranches,
  getBranchById,
  getBranchPrices,
  comparePrices
} from "../controllers/branchController";

const router = Router();

router.get("/", getAllBranches);
router.get("/nearest", getNearestBranches);
router.get("/compare", comparePrices);
router.get("/:id", getBranchById);
router.get("/:id/prices", getBranchPrices);

export default router;
