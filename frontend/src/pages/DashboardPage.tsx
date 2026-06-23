import { BarChart3, AlertTriangle, Sprout, RefreshCw, CloudSun, Tractor, FileText, Eye, Download } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../services/api";
import type { RiskAlert } from "../types";
import { connectRiskStream } from "../services/riskStream";
import { showNotification } from "../utils/notification";
import SoilCard from "../components/Dashboard/SoilCard";
import IrrigationCard from "../components/Dashboard/IrrigationCard";
import WeatherCard from "../components/Dashboard/WeatherCard";
import CropSuitabilityCard from "../components/Dashboard/CropSuitabilityCard";
import FertilizerCard from "../components/Dashboard/FertilizerCard";
import NDVICard from "../components/Dashboard/NDVICard";
import PesticideCard from "../components/Dashboard/PesticideCard";
import RiskAlertCard from "../components/Dashboard/RiskAlertCard";
import SummaryCard from "../components/Dashboard/SummaryCard";
import CustomSelect from "../components/UI/CustomSelect";
import { AnalysisProvider, type AnalysisData } from "../context/AnalysisContext";
import { useField } from "../context/FieldContext";
import { useAuth } from "../context/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function DashboardPage() {
  const { fields, isLoadingFields: loadingFields, selectedFieldId, setSelectedFieldId } = useField();
  const { user } = useAuth();
  const [criticalAlerts, setCriticalAlerts] = useState<RiskAlert[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "crop_health" | "agronomy">("overview");

  // Report and Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState({ current: 0, total: 8, label: "" });
  
  // Cache State
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [lastAnalyzedTimestamp, setLastAnalyzedTimestamp] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedFieldId) return;
    const cacheKey = `dashboard_analysis_${selectedFieldId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setAnalysisData(parsed.results);
        setLastAnalyzedTimestamp(parsed.timestamp);
      } catch (e) {
        console.warn("Invalid cache", e);
        setAnalysisData(null);
        setLastAnalyzedTimestamp(null);
      }
    } else {
      setAnalysisData(null);
      setLastAnalyzedTimestamp(null);
    }
  }, [selectedFieldId]);

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        void Notification.requestPermission();
      }
    }
  }, []);

  // SSE Real-time Risk Alerts listener
  useEffect(() => {
    if (!selectedFieldId) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const eventSource = connectRiskStream(selectedFieldId, token, (newAlerts: RiskAlert[]) => {
      // 1. Filter out already-dismissed alerts from triggering notifications
      let dismissed: string[] = [];
      try {
        const stored = localStorage.getItem("dismissed_risks");
        dismissed = stored ? JSON.parse(stored) : [];
      } catch (err) {
        console.error(err);
      }

      newAlerts.forEach((alert) => {
        const uniqueKey = `${selectedFieldId}_${alert.type}_${alert.expectedDate}`;
        if (!dismissed.includes(uniqueKey)) {
          const notificationSessionKey = `notified_${uniqueKey}`;
          if (!sessionStorage.getItem(notificationSessionKey)) {
            showNotification(alert);
            sessionStorage.setItem(notificationSessionKey, "true");
          }
        }
      });

      // 2. Dynamically merge incoming high/critical alerts into the active Analysis context
      setAnalysisData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          risks: newAlerts,
        };
      });
    });

    return () => {
      eventSource.close();
    };
  }, [selectedFieldId]);

  const handleAnalyzeField = async () => {
    if (!selectedFieldId) return;
    setIsAnalyzing(true);
    try {
      const steps = [
        { key: "soil", label: "Analyzing Soil Profile...", endpoint: `/analysis/${selectedFieldId}/soil` },
        { key: "ndvi", label: "Fetching Satellite NDVI...", endpoint: `/analysis/${selectedFieldId}/ndvi` },
        { key: "weather", label: "Forecasting Weather...", endpoint: `/analysis/${selectedFieldId}/weather` },
        { key: "irrigation", label: "Assessing Irrigation Needs...", endpoint: `/analysis/${selectedFieldId}/irrigation` },
        { key: "crop", label: "Computing Crop Suitability...", endpoint: `/analysis/${selectedFieldId}/crop` },
        { key: "fertilizer", label: "Calculating Fertilizer Plan...", endpoint: `/analysis/${selectedFieldId}/fertilizer` },
        { key: "pesticide", label: "Assessing Pesticide Risk...", endpoint: `/analysis/${selectedFieldId}/pesticide` },
        { key: "risks", label: "Compiling Risk Alerts...", endpoint: `/analysis/${selectedFieldId}/risks` },
      ];

      const newResults: Partial<AnalysisData> = {};

      for (let i = 0; i < steps.length; i++) {
        setAnalyzeProgress({ current: i + 1, total: steps.length, label: steps[i].label });
        try {
          const res = await api.post(steps[i].endpoint);
          if (steps[i].key === "soil") {
            const histRes = await api.get(`/analysis/${selectedFieldId}/soil/history`);
            newResults.soil = histRes.data?.data;
          } else {
            newResults[steps[i].key as keyof AnalysisData] = res.data?.data;
          }
        } catch (e) {
          console.warn(`Failed step ${steps[i].label}`, e);
        }
      }
      
      const timestamp = Date.now();
      localStorage.setItem(`dashboard_analysis_${selectedFieldId}`, JSON.stringify({ timestamp, results: newResults }));
      setAnalysisData(newResults as AnalysisData);
      setLastAnalyzedTimestamp(timestamp);
    } catch (err) {
      console.error("Analysis failed", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAgronomyReport = async (action: "view" | "download") => {
    if (!selectedFieldId || !analysisData) return;

    // Pre-open a blank tab synchronously to bypass the popup blocker for async actions
    let newTab: Window | null = null;
    if (action === "view") {
      newTab = window.open("", "_blank");
      if (newTab) {
        newTab.document.write("<p style='font-family: sans-serif; text-align: center; margin-top: 50px;'>Generating PDF report... Please wait.</p>");
      }
    }

    try {
      setGeneratingReport(true);

      const activeField = fields.find((f) => f.id === selectedFieldId);
      const area = activeField?.area || 1;
      const selectedCrop = localStorage.getItem("selectedCrop") || "Wheat";

      // 1. Fetch latest fertilizer plan for the selected crop
      let fertilizerPlan: any = null;
      try {
        const useSoilTestData = localStorage.getItem("useSoilTestData") !== "false";
        const payload: any = { crop: selectedCrop };
        if (!useSoilTestData) {
          const sN = localStorage.getItem("soilN");
          const sP = localStorage.getItem("soilP");
          const sK = localStorage.getItem("soilK");
          if (sN !== null) payload.soilN = Number(sN);
          if (sP !== null) payload.soilP = Number(sP);
          if (sK !== null) payload.soilK = Number(sK);
        }
        const res = await api.post(`/analysis/${selectedFieldId}/fertilizer`, payload);
        if (res.data?.success) {
          fertilizerPlan = res.data.data;
        }
      } catch (err) {
        console.warn("Failed to fetch fresh fertilizer plan, falling back to cached analysis", err);
      }

      if (!fertilizerPlan && analysisData.fertilizer) {
        if (analysisData.fertilizer.crop?.toLowerCase() === selectedCrop.toLowerCase()) {
          fertilizerPlan = analysisData.fertilizer;
        }
      }

      // Initialize jsPDF
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth(); // 210
      const pageHeight = doc.internal.pageSize.getHeight(); // 297
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin; // 180

      let yPos = 20;

      // Helper function to draw divider lines
      const drawDivider = (y: number) => {
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
      };

      // PAGE 1: HEADER & METADATA & CROP SUITABILITY & IRRIGATION
      // 1. BRAND HEADER
      doc.setFillColor(16, 185, 129); // Emerald-500
      doc.rect(0, 0, pageWidth, 25, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text("SMART FARM - AGRONOMY REPORT", margin, 16);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Agricultural Analytics & Recommendation Platform", pageWidth - margin - 75, 16);

      yPos = 35;

      // 2. DOCUMENT TITLE
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13); // was 14
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text("COMPREHENSIVE AGRONOMY RECOMMENDATIONS", margin, yPos);
      yPos += 6; // was 8

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5); // was 9
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, yPos);
      yPos += 5; // was 6

      drawDivider(yPos);
      yPos += 6; // was 8

      // 3. METADATA SECTION (Premium Card Design)
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.3);
      doc.rect(margin, yPos, contentWidth, 20, "DF"); // was 24

      // Column 1 values
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8); // was 8.5
      doc.setTextColor(100, 116, 139); // slate-500 label
      doc.text("User Name:", margin + 5, yPos + 5); // was yPos + 6
      doc.setTextColor(15, 23, 42); // slate-900 value
      doc.text(`${user?.name || "N/A"}`, margin + 28, yPos + 5);

      doc.setTextColor(100, 116, 139);
      doc.text("Field Name:", margin + 5, yPos + 10); // was yPos + 12
      doc.setTextColor(15, 23, 42);
      doc.text(`${activeField?.name || "N/A"}`, margin + 28, yPos + 10);

      doc.setTextColor(100, 116, 139);
      doc.text("Field Area:", margin + 5, yPos + 15); // was yPos + 18
      doc.setTextColor(15, 23, 42);
      doc.text(`${area.toFixed(2)} ha`, margin + 28, yPos + 15);

      // Column 2 values
      doc.setTextColor(100, 116, 139);
      doc.text("Selected Crop:", margin + 95, yPos + 5); // was yPos + 6
      doc.setTextColor(16, 185, 129); // emerald value for crop
      doc.text(`${selectedCrop}`, margin + 125, yPos + 5);

      doc.setTextColor(100, 116, 139);
      doc.text("Coordinates:", margin + 95, yPos + 10); // was yPos + 12
      doc.setTextColor(15, 23, 42);
      const coordsText = `${activeField?.centroid?.lat?.toFixed(4) || "N/A"}, ${activeField?.centroid?.lng?.toFixed(4) || "N/A"}`;
      doc.text(coordsText, margin + 125, yPos + 10);

      doc.setTextColor(100, 116, 139);
      doc.text("Report Class:", margin + 95, yPos + 15); // was yPos + 18
      doc.setTextColor(15, 23, 42);
      doc.text("Standard Agronomy Recs", margin + 125, yPos + 15);

      yPos += 20; // was 24
      drawDivider(yPos);
      yPos += 6; // was 8

      // 4. CROP SUITABILITY SECTION
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5); // was 11
      doc.setTextColor(16, 185, 129); // Emerald-500
      doc.text("1. Crop Suitability Analysis", margin, yPos);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8); // was 8.5
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text("Matches localized soil properties, climate parameters, and texture constraints against potential crops.", margin, yPos + 4);
      yPos += 7.5; // was yPos += 5 twice (10mm)

      const cropSuitabilityList = (analysisData.crop || []) as Array<{
        name: string;
        score: number;
        breakdown: { ph: number; temperature: number; rainfall: number; soilTexture: number };
      }>;

      const cropHeaders = [["Crop Name", "Suitability Score", "Soil pH Fit", "Temp Fit", "Rainfall Fit", "Soil Texture Fit"]];
      const cropRows = cropSuitabilityList.slice(0, 5).map((c) => [
        c.name || "N/A",
        c.score !== undefined ? `${c.score.toFixed(0)}%` : "N/A",
        c.breakdown?.ph !== undefined ? `${c.breakdown.ph.toFixed(0)}%` : "N/A",
        c.breakdown?.temperature !== undefined ? `${c.breakdown.temperature.toFixed(0)}%` : "N/A",
        c.breakdown?.rainfall !== undefined ? `${c.breakdown.rainfall.toFixed(0)}%` : "N/A",
        c.breakdown?.soilTexture !== undefined ? `${c.breakdown.soilTexture.toFixed(0)}%` : "N/A",
      ]);

      if (cropRows.length === 0) {
        cropRows.push(["No suitability data", "-", "-", "-", "-", "-"]);
      }

      autoTable(doc, {
        startY: yPos,
        head: cropHeaders,
        body: cropRows,
        theme: "striped",
        headStyles: { fillColor: [30, 41, 59], halign: "left" }, // Slate-800 header
        columnStyles: {
          0: { cellWidth: 40, halign: "left" },
          1: { cellWidth: 28, halign: "center", fontStyle: "bold" },
          2: { cellWidth: 28, halign: "center" },
          3: { cellWidth: 28, halign: "center" },
          4: { cellWidth: 28, halign: "center" },
          5: { cellWidth: 28, halign: "center" },
        },
        styles: { cellPadding: 2.5, fontSize: 8 }, // cellPadding was 3
      });

      yPos = (doc as any).lastAutoTable.finalY + 6; // was + 8

      // 5. IRRIGATION & WATER MANAGEMENT SECTION
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5); // was 11
      doc.setTextColor(16, 185, 129); // Emerald-500
      doc.text("2. Irrigation & Soil Moisture Management", margin, yPos);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8); // was 8.5
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text("Monitors current soil moisture indices, evapotranspiration loss, and calculates future irrigation targets.", margin, yPos + 4);
      yPos += 7.5; // was yPos += 5 twice (10mm)

      const irrigation = analysisData.irrigation || {};
      const waterReq = irrigation.waterRequired || 0;
      const liters = (waterReq * 10000).toLocaleString();

      const irrigationHeaders = [["Parameter", "Metric Value", "Actionable Guidance / Status"]];
      const irrigationRows = [
        ["Current Soil Moisture", `${irrigation.currentSoilMoisture || 0}%`, "Current percentage of moisture content in top layer."],
        ["Next Irrigation Target", irrigation.nextIrrigationDays === 0 ? "TODAY" : `${irrigation.nextIrrigationDays || 0} Days`, irrigation.nextIrrigationDays <= 1 ? "Critical watering required." : "Soil moisture level is acceptable."],
        ["Water Quantity Required", `${waterReq} mm (${liters} L/ha)`, waterReq > 0 ? `Target volume to restore field root zone.` : "No supplemental watering needed currently."],
        ["Daily Evapotranspiration", `${irrigation.dailyET || 0} mm/day`, "Daily crop moisture consumption rate."],
        ["7-Day Rainfall Forecast", `${irrigation.rainfallNext7Days || 0} mm`, "Expected local rainfall quantity."],
      ];

      autoTable(doc, {
        startY: yPos,
        head: irrigationHeaders,
        body: irrigationRows,
        theme: "striped",
        headStyles: { fillColor: [30, 41, 59], halign: "left" }, // Slate-800 header
        columnStyles: {
          0: { cellWidth: 50, halign: "left", fontStyle: "bold" },
          1: { cellWidth: 40, halign: "center" },
          2: { cellWidth: 90, halign: "left" },
        },
        styles: { cellPadding: 2.5, fontSize: 8 }, // cellPadding was 3
      });

      yPos = (doc as any).lastAutoTable.finalY + 6; // was + 8

      // 6. SOIL BASELINE & NUTRIENT PLAN SECTION
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5); // was 11
      doc.setTextColor(16, 185, 129); // Emerald-500
      doc.text("3. Soil Baseline & Nutrient Plan", margin, yPos);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8); // was 8.5
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`Compares soil baseline values against crop requirements for ${selectedCrop} to calculate deficits.`, margin, yPos + 4);
      yPos += 7.5; // was yPos += 5 twice (10mm)

      // Soil Baseline vs Crop Requirements
      const useSoilTestData = localStorage.getItem("useSoilTestData") !== "false";
      let baseline = { nitrogen: 60, phosphorus: 40, potassium: 50 };
      if (!useSoilTestData) {
        const sN = localStorage.getItem("soilN");
        const sP = localStorage.getItem("soilP");
        const sK = localStorage.getItem("soilK");
        if (sN !== null) baseline.nitrogen = Number(sN);
        if (sP !== null) baseline.phosphorus = Number(sP);
        if (sK !== null) baseline.potassium = Number(sK);
      } else if (fertilizerPlan?.soilBaselines) {
        baseline = fertilizerPlan.soilBaselines;
      } else if (analysisData.fertilizer?.soilBaselines) {
        baseline = analysisData.fertilizer.soilBaselines;
      }
      
      const cropNutrients: Record<string, { n: number; p: number; k: number }> = {
        "Wheat": { n: 120, p: 60, k: 40 },
        "Rice": { n: 150, p: 60, k: 60 },
        "Maize": { n: 180, p: 80, k: 60 },
        "Soybean": { n: 30, p: 60, k: 40 },
        "Cotton": { n: 150, p: 60, k: 60 },
        "Sugarcane": { n: 250, p: 100, k: 120 },
        "Mustard": { n: 80, p: 40, k: 20 },
        "Chickpea": { n: 20, p: 50, k: 20 },
        "Groundnut": { n: 25, p: 50, k: 40 },
        "Potato": { n: 180, p: 80, k: 100 },
        "Tomato": { n: 150, p: 60, k: 80 },
        "Onion": { n: 100, p: 50, k: 60 },
        "Sunflower": { n: 80, p: 60, k: 40 },
        "Barley": { n: 80, p: 40, k: 30 },
        "Millet": { n: 60, p: 30, k: 20 }
      };

      const activeCropRequirements = cropNutrients[selectedCrop] || { n: 100, p: 50, k: 50 };
      const reqN = activeCropRequirements.n;
      const reqP = activeCropRequirements.p;
      const reqK = activeCropRequirements.k;

      const availableN = Number(((baseline.nitrogen || 0) * 0.5).toFixed(1));
      const availableP = Number(((baseline.phosphorus || 0) * 0.4).toFixed(1));
      const availableK = Number(((baseline.potassium || 0) * 0.6).toFixed(1));

      const defN = Math.max(0, reqN - availableN);
      const defP = Math.max(0, reqP - availableP);
      const defK = Math.max(0, reqK - availableK);

      const nutrientHeaders = [["Nutrient Element", "Soil Baseline (kg/ha)", "Crop Requirement (kg/ha)", "Net Deficit (kg/ha)"]];
      const nutrientRows = [
        ["Nitrogen (N)", (baseline.nitrogen || 0).toFixed(1), reqN.toFixed(1), defN > 0 ? `${defN.toFixed(1)} (Deficit)` : "0.0 (Optimal)"],
        ["Phosphorus (P)", (baseline.phosphorus || 0).toFixed(1), reqP.toFixed(1), defP > 0 ? `${defP.toFixed(1)} (Deficit)` : "0.0 (Optimal)"],
        ["Potassium (K)", (baseline.potassium || 0).toFixed(1), reqK.toFixed(1), defK > 0 ? `${defK.toFixed(1)} (Deficit)` : "0.0 (Optimal)"],
      ];

      autoTable(doc, {
        startY: yPos,
        head: nutrientHeaders,
        body: nutrientRows,
        theme: "striped",
        headStyles: { fillColor: [30, 41, 59], halign: "left" }, // Slate-800 header
        columnStyles: {
          0: { cellWidth: 45, halign: "left", fontStyle: "bold" },
          1: { cellWidth: 45, halign: "center" },
          2: { cellWidth: 45, halign: "center" },
          3: { cellWidth: 45, halign: "center" },
        },
        styles: { cellPadding: 2.5, fontSize: 8 },
        didParseCell: function(cellData: any) {
          if (cellData.section === 'body' && cellData.column.index === 3) {
            if (cellData.cell.raw && cellData.cell.raw.includes('Deficit')) {
              cellData.cell.styles.textColor = [239, 68, 68]; // Red
              cellData.cell.styles.fontStyle = 'bold';
            } else {
              cellData.cell.styles.textColor = [16, 185, 129]; // Emerald
              cellData.cell.styles.fontStyle = 'bold';
            }
          }
        }
      });

      // Force page break to move all remaining sections (recs & timeline) to Page 2
      doc.addPage();
      yPos = 20;

      // 7. FERTILIZER RECOMMENDATIONS & COST ESTIMATES
      const recommendations = fertilizerPlan?.recommendations || [];
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(16, 185, 129); // Emerald-500
      doc.text("4. Fertilizer Recommendations & Cost Estimates", margin, yPos);
      yPos += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text("Recommends active commercial fertilizer types, application quantities, bag requirements, and cost projections.", margin, yPos);
      yPos += 5;

      const recHeaders = [["Fertilizer Product", "Dose / Hectare", `Total Qty (${area.toFixed(2)} ha)`, "50kg Bags", "Cost / ha", "Total Cost"]];
      
      let totalCostPerHa = 0;
      const recRows = recommendations.map((prod: any) => {
        const FERT_PRICES: Record<string, { pricePerKg: number; bagSizeKg: number }> = {
          "Urea": { pricePerKg: 0.60, bagSizeKg: 50 },
          "DAP": { pricePerKg: 0.80, bagSizeKg: 50 },
          "MOP": { pricePerKg: 0.70, bagSizeKg: 50 }
        };
        const pricing = FERT_PRICES[prod.name] || { pricePerKg: 0.6, bagSizeKg: 50 };
        const totalBags = Math.ceil(((prod.quantity || 0) * area) / pricing.bagSizeKg);
        const prodCostPerHa = (prod.quantity || 0) * pricing.pricePerKg;
        const totalProdCost = prodCostPerHa * area;
        totalCostPerHa += prodCostPerHa;
        
        return [
          prod.name || "N/A",
          `${(prod.quantity || 0).toFixed(1)} ${prod.unit || "kg"}/ha`,
          `${((prod.quantity || 0) * area).toFixed(1)} ${prod.unit || "kg"}`,
          totalBags.toString(),
          `$${prodCostPerHa.toFixed(2)}`,
          `$${totalProdCost.toFixed(2)}`
        ];
      });

      const grandTotalCost = totalCostPerHa * area;
      
      if (recRows.length === 0) {
        recRows.push(["No products needed", "0.0 kg/ha", "0.0 kg", "0", "$0.00", "$0.00"]);
      } else {
        recRows.push([
          "Total",
          "",
          "",
          "",
          `$${totalCostPerHa.toFixed(2)}`,
          `$${grandTotalCost.toFixed(2)}`
        ]);
      }

      autoTable(doc, {
        startY: yPos,
        head: recHeaders,
        body: recRows,
        theme: "striped",
        headStyles: { fillColor: [16, 185, 129], halign: "left" }, // Emerald header for the recommendations table to pop!
        columnStyles: {
          0: { cellWidth: 40, halign: "left", fontStyle: "bold" },
          1: { cellWidth: 30, halign: "right" },
          2: { cellWidth: 30, halign: "right" },
          3: { cellWidth: 25, halign: "center" },
          4: { cellWidth: 25, halign: "right" },
          5: { cellWidth: 30, halign: "right" },
        },
        styles: { cellPadding: 3, fontSize: 8 },
        didParseCell: function(cellData: any) {
          if (cellData.section === 'body' && cellData.row.index === recRows.length - 1 && recRows.length > 1) {
            cellData.cell.styles.fontStyle = "bold";
            cellData.cell.styles.fillColor = [241, 245, 249];
          }
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;

      // 8. FERTILIZER APPLICATION TIMELINE
      // Section header + first step needs at least 50mm
      if (yPos + 50 > pageHeight - margin) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(16, 185, 129); // Emerald-500
      doc.text("5. Fertilizer Application Timeline", margin, yPos);
      yPos += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text("Details the structured crop-cycle timeline for applying baseline (basal) and split fertilizer doses.", margin, yPos);
      yPos += 7;

      if (fertilizerPlan && fertilizerPlan.scheduleSteps && fertilizerPlan.scheduleSteps.length > 0) {
        fertilizerPlan.scheduleSteps.forEach((step: any) => {
          const splitDesc = doc.splitTextToSize(step.description || "", contentWidth - 10);
          const descLines = splitDesc.length;
          const boxHeight = 16 + (descLines * 4.5) + (step.recommendations?.length ? 10 : 6);

          if (yPos + boxHeight > pageHeight - margin) {
            doc.addPage();
            yPos = 20;
          }

          // Stage title box (Premium slate styled box)
          doc.setFillColor(248, 250, 252); // slate-50
          doc.setDrawColor(226, 232, 240); // slate-200
          doc.setLineWidth(0.3);
          doc.rect(margin, yPos, contentWidth, boxHeight, "DF");

          // Dynamic Tag
          const tagText = step.days === 0 ? "BASAL" : `DAY +${step.days}`;
          const tagWidth = Math.max(16, doc.getTextWidth(tagText) + 4);
          doc.setFillColor(245, 158, 11); // Amber-500
          doc.rect(margin + 5, yPos + 5, tagWidth, 6, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(255, 255, 255);
          doc.text(tagText, margin + 7, yPos + 9.5);

          // Name
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(15, 23, 42); // slate-900
          doc.text(step.stage || "N/A", margin + 5 + tagWidth + 4, yPos + 9.5);

          // Description
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(71, 85, 105); // slate-600
          doc.text(splitDesc, margin + 5, yPos + 16);

          // Recommendations
          if (step.recommendations && step.recommendations.length > 0) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8.5);
            doc.setTextColor(15, 23, 42);
            
            const recTexts = step.recommendations.map((r: any) => `${r.name || "N/A"}: ${((r.quantity || 0) * area).toFixed(1)} kg (${(r.quantity || 0).toFixed(1)} kg/ha)`).join("   |   ");
            doc.text(`Dose Split:  ${recTexts}`, margin + 5, yPos + boxHeight - 6);
          } else {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(8.5);
            doc.setTextColor(148, 163, 184);
            doc.text("No fertilizer application needed at this stage.", margin + 5, yPos + boxHeight - 6);
          }

          yPos += boxHeight + 6;
        });
      } else {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text("No schedule steps calculated.", margin, yPos);
      }

      // Add footers on all pages
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Smart Farm Field Intelligence Platform | Page ${i} of ${pageCount}`, margin, pageHeight - 10);
      }

      // Filename formatting
      const sanitize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/__+/g, "_");
      const uName = sanitize(user?.name || "user");
      const fName = sanitize(activeField?.name || "field");
      const cName = sanitize(selectedCrop || "crop");
      const filename = `${uName}_${fName}_${cName}.pdf`;

      if (action === "download") {
        doc.save(filename);
      } else {
        const pdfUrl = doc.output("bloburl");
        if (newTab) {
          newTab.location.href = pdfUrl.toString();
        }
      }
    } catch (err) {
      console.error("Agronomy report generation failed:", err);
      if (newTab) {
        newTab.close();
      }
    } finally {
      setGeneratingReport(false);
    }
  };

  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (lastAnalyzedTimestamp) {
      setNow(Date.now());
      // Optionally update `now` every minute so it's not permanently stale for the whole session
      interval = setInterval(() => setNow(Date.now()), 60000);
    }
    return () => clearInterval(interval);
  }, [lastAnalyzedTimestamp]);

  const isStale24h = lastAnalyzedTimestamp ? now - lastAnalyzedTimestamp > 24 * 60 * 60 * 1000 : false;
  const isStale7d = lastAnalyzedTimestamp ? now - lastAnalyzedTimestamp > 7 * 24 * 60 * 60 * 1000 : false;

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"
    });
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl sm:p-8 min-h-[calc(100vh-6rem)]">
      
      {/* Non-blocking Progress Banner */}
      {isAnalyzing && (
        <div className="mb-6 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 shadow-lg shadow-emerald-950/20 animate-fadeIn flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-emerald-200">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="font-semibold text-sm">Analyzing Field Data...</span>
          </div>
          <div className="flex-1 w-full max-w-md">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-emerald-300">{analyzeProgress.label}</span>
              <span className="text-emerald-400 font-medium">{analyzeProgress.current} / {analyzeProgress.total}</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-emerald-900/30">
              <div 
                className="bg-emerald-400 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${(analyzeProgress.current / analyzeProgress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-50 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300/15 text-emerald-200">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200">
                Dashboard
              </p>
              <h2 className="text-3xl font-semibold text-white">
                Field Analytics
              </h2>
            </div>
          </div>
          
          {/* Segmented Control */}
          <div className="relative grid grid-cols-3 p-1 bg-slate-950/40 rounded-xl border border-white/10 w-full sm:w-[580px]">
            <div 
              className="absolute inset-y-1 bg-emerald-500 rounded-lg transition-all duration-300 ease-out shadow-md"
              style={{
                width: "calc((100% - 6px) / 3)",
                transform: 
                  activeTab === "overview" ? "translateX(3px)" : 
                  activeTab === "crop_health" ? "translateX(calc(100% + 3px))" : 
                  "translateX(calc(200% + 3px))"
              }}
            />
            <button
              onClick={() => setActiveTab("overview")}
              className={`relative z-10 flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                activeTab === "overview" ? "text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              <CloudSun className="w-4 h-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("crop_health")}
              className={`relative z-10 flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                activeTab === "crop_health" ? "text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              <Sprout className="w-4 h-4" />
              Crop Health
            </button>
            <button
              onClick={() => setActiveTab("agronomy")}
              className={`relative z-10 flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                activeTab === "agronomy" ? "text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              <Tractor className="w-4 h-4" />
              Agronomy Recs
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Field Selector */}
          <div className="flex items-center gap-3 w-full sm:w-auto min-w-[200px]">
            {loadingFields ? (
              <span className="text-slate-300 animate-pulse bg-slate-950/50 px-4 py-2 rounded-xl border border-white/10 flex-1">Loading fields...</span>
            ) : fields.length > 0 ? (
              <div className="w-full">
                <CustomSelect
                  value={fields.find((f) => f.id === selectedFieldId) || null}
                  onChange={(val) => setSelectedFieldId(val.id as string)}
                  options={fields.map((f) => ({
                    id: f.id,
                    name: `${f.name} (${f.area.toFixed(1)} ha)`,
                  }))}
                />
              </div>
            ) : (
              <span className="text-slate-400 bg-slate-950/50 px-4 py-2 rounded-xl border border-white/10 flex-1">No fields saved</span>
            )}
          </div>

          {/* Time & Analyze Button */}
          {fields.length > 0 && selectedFieldId && (
            <div className="flex items-center gap-4 w-full sm:w-auto">
              {lastAnalyzedTimestamp && (
                <div className="hidden sm:block text-xs text-slate-400 text-right">
                  <p>Last analyzed</p>
                  <p className="font-medium text-slate-300">{formatDate(lastAnalyzedTimestamp)}</p>
                </div>
              )}
              <button
                onClick={handleAnalyzeField}
                disabled={isAnalyzing}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                <RefreshCw className={`w-4 h-4 ${isAnalyzing ? "animate-spin" : ""}`} />
                {analysisData ? (isAnalyzing ? "Refreshing..." : "Refresh") : (isAnalyzing ? "Analyzing..." : "Analyze Field")}
              </button>
            </div>
          )}
        </div>
      </div>

      {!loadingFields && fields.length === 0 && (
        <div className="mt-8 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6 text-center">
          <p className="text-yellow-200">You haven't saved any fields yet. Draw and save a field on the Map to view analytics.</p>
        </div>
      )}

      {selectedFieldId && (
        <AnalysisProvider value={{
          data: analysisData,
          timestamp: lastAnalyzedTimestamp,
          isLoading: isAnalyzing,
          isStale24h,
          isStale7d,
          refreshAnalysis: handleAnalyzeField,
          hasCachedData: !!analysisData
        }}>
          {/* Stale Warnings Banner */}
          {analysisData && isStale7d && (
            <div className="mt-6 p-4 rounded-2xl border border-red-500/30 bg-red-500/15 text-red-200 flex items-start gap-3 shadow-lg shadow-red-950/20 animate-fadeIn">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-white text-sm">DATA IS STALE</p>
                <p className="text-xs leading-relaxed mt-1">This analysis data is older than 7 days. Please click Refresh to get the latest insights.</p>
              </div>
            </div>
          )}
          {analysisData && isStale24h && !isStale7d && (
            <div className="mt-6 p-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/15 text-yellow-200 flex items-start gap-3 shadow-lg shadow-yellow-950/20 animate-fadeIn">
              <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-white text-sm">DATA MAY BE OUTDATED</p>
                <p className="text-xs leading-relaxed mt-1">This analysis data is older than 24 hours. Click Refresh for the latest updates.</p>
              </div>
            </div>
          )}

          {/* Critical Warnings Banner */}
          {criticalAlerts.length > 0 && (
            <div 
              data-testid="critical-alerts-banner"
              className="mt-6 p-4 rounded-2xl border border-red-500/30 bg-red-500/15 text-red-200 flex items-start gap-3 shadow-lg shadow-red-950/20 animate-fadeIn"
            >
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-white text-sm">CRITICAL WARNING ACTIVE</p>
                <div className="mt-1 space-y-1.5 text-xs">
                  {criticalAlerts.map((alert, idx) => (
                    <p key={idx} className="leading-relaxed">
                      • <strong>{alert.message}</strong> (Expected: {alert.expectedDate}) — {alert.recommendation}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab Contents */}
          {analysisData ? (
            <div>
              {activeTab === "overview" && (
                <div className="mt-8 grid gap-4 md:grid-cols-2 items-stretch animate-fadeIn">
                  <WeatherCard fieldId={selectedFieldId} />
                  <SummaryCard />
                </div>
              )}

              {activeTab === "crop_health" && (
                <div className="mt-8 grid gap-4 md:grid-cols-2 items-stretch animate-fadeIn">
                  <NDVICard fieldId={selectedFieldId} />
                  <SoilCard fieldId={selectedFieldId} />
                  <PesticideCard fieldId={selectedFieldId} />
                  <RiskAlertCard 
                    fieldId={selectedFieldId} 
                    onCriticalAlerts={setCriticalAlerts} 
                  />
                </div>
              )}

              {activeTab === "agronomy" && (
                <div className="mt-8 space-y-6 animate-fadeIn">
                  {/* Agronomy Report Banner */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4.5 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-md gap-4">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-emerald-400" />
                        Agronomy Recommendations Report
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Generate a unified PDF report comprising crop suitability scores, moisture schedules, and fertilizer guidelines.</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        onClick={() => handleAgronomyReport("view")}
                        disabled={generatingReport}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 text-white rounded-xl text-xs font-bold transition-all cursor-pointer w-full sm:w-auto h-[36px]"
                      >
                        {generatingReport ? (
                          <>
                            <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
                            <span>Loading...</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 text-emerald-400" />
                            <span>View Report</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleAgronomyReport("download")}
                        disabled={generatingReport}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 rounded-xl text-xs font-bold transition-all cursor-pointer w-full sm:w-auto h-[36px]"
                      >
                        {generatingReport ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span>Download PDF</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 items-stretch">
                    <CropSuitabilityCard fieldId={selectedFieldId} />
                    <IrrigationCard fieldId={selectedFieldId} />
                    <div className="md:col-span-2">
                      <FertilizerCard fieldId={selectedFieldId} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-slate-700/50 bg-slate-800/30 p-12 text-center animate-fadeIn">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Analysis Data</h3>
              <p className="text-slate-400 max-w-md mx-auto mb-6">Run your first analysis to generate soil profiles, weather forecasts, and vegetation health metrics.</p>
              <button
                onClick={handleAnalyzeField}
                disabled={isAnalyzing}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-900/50"
              >
                {isAnalyzing ? "Analyzing..." : "Run First Analysis"}
              </button>
            </div>
          )}
        </AnalysisProvider>
      )}
  </section>
  );
}

export default DashboardPage;
