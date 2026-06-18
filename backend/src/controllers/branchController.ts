import { Request, Response } from "express";
import { 
  findNearestBranches, 
  getAllBranchesService, 
  getBranchByIdService, 
  getBranchPricesService 
} from "../services/branchService";

export const getAllBranches = async (req: Request, res: Response): Promise<void> => {
  try {
    const rows = await getAllBranchesService();
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch branches" });
  }
};

export const getNearestBranches = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng, limit } = req.query;
    if (!lat || !lng) {
      res.status(400).json({ success: false, error: "Missing lat or lng" });
      return;
    }
    const nearest = await findNearestBranches(
      parseFloat(lat as string), 
      parseFloat(lng as string), 
      limit ? parseInt(limit as string, 10) : 5
    );
    res.json({ success: true, data: nearest });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch nearest branches" });
  }
};

export const getBranchById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const branch = await getBranchByIdService(id);
    if (!branch) {
      res.status(404).json({ success: false, error: "Branch not found" });
      return;
    }
    res.json({ success: true, data: branch });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch branch" });
  }
};

export const getBranchPrices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const branchPrices = await getBranchPricesService(id);
    if (!branchPrices) {
      res.status(404).json({ success: false, error: "Branch not found" });
      return;
    }
    res.json({ success: true, data: branchPrices.products });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch branch prices" });
  }
};

export const comparePrices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { product, lat, lng } = req.query;
    if (!product || !lat || !lng) {
      res.status(400).json({ success: false, error: "Missing product, lat, or lng" });
      return;
    }
    const nearest = await findNearestBranches(
      parseFloat(lat as string), 
      parseFloat(lng as string), 
      10 // get top 10 nearest to find who has the product
    );
    
    // filter branches that have the product and extract its price
    const comparison = nearest.flatMap(branch => {
      const prod = (branch.products || []).find((p: any) => 
        p.name.toLowerCase().includes((product as string).toLowerCase())
      );
      if (prod) {
        return [{
          branchId: branch.id,
          branchName: branch.name,
          distance: branch.distance,
          product: prod.name,
          price: prod.price,
          unit: prod.unit
        }];
      }
      return [];
    });
    
    // Sort by price ascending
    comparison.sort((a, b) => a.price - b.price);
    
    res.json({ success: true, data: comparison });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to compare prices" });
  }
};
