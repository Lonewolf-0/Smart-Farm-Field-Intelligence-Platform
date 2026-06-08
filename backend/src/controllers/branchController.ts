import { Request, Response } from "express";
import { pool } from "../config/db";
import { findNearestBranches } from "../services/branchService";

export const getAllBranches = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query("SELECT * FROM branches");
    res.json({ success: true, data: result.rows });
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
    const result = await pool.query("SELECT * FROM branches WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: "Branch not found" });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch branch" });
  }
};

export const getBranchPrices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT products FROM branches WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: "Branch not found" });
      return;
    }
    res.json({ success: true, data: result.rows[0].products });
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
    const comparison = nearest.map(branch => {
      const prod = (branch.products || []).find((p: any) => 
        p.name.toLowerCase().includes((product as string).toLowerCase())
      );
      if (prod) {
        return {
          branchId: branch.id,
          branchName: branch.name,
          distance: branch.distance,
          product: prod.name,
          price: prod.price,
          unit: prod.unit
        };
      }
      return null;
    }).filter(Boolean);
    
    // Sort by price ascending
    comparison.sort((a: any, b: any) => a.price - b.price);
    
    res.json({ success: true, data: comparison });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to compare prices" });
  }
};
