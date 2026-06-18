import { streamRiskAlerts } from "./controllers/riskController";
import { getRiskAnalysisService } from "./services/riskAnalysisService";

jest.mock("./services/riskAnalysisService", () => ({
  getRiskAnalysisService: jest.fn()
}));

describe("Benchmark streamRiskAlerts", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        (getRiskAnalysisService as jest.Mock).mockClear();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("should measure performance of 1 hour of streaming", async () => {
        const mockRisks = [{ severity: "high", name: "Drought Risk" }];
        (getRiskAnalysisService as jest.Mock).mockResolvedValue(mockRisks);

        const mockReq = { params: { fieldId: "f1" }, user: { id: "u1" }, on: jest.fn() } as any;
        const mockRes = {
            setHeader: jest.fn(),
            write: jest.fn(),
            end: jest.fn(),
            status: jest.fn(() => mockRes)
        } as any;

        const start = performance.now();

        streamRiskAlerts(mockReq, mockRes);

        // Advance time by 1 hour (360 intervals of 10s)
        for(let i = 0; i < 360; i++) {
            jest.advanceTimersByTime(10000);
            await Promise.resolve(); // flush microtasks
        }

        const end = performance.now();
        const calls = (getRiskAnalysisService as jest.Mock).mock.calls.length;
        console.log(`Baseline Execution Time: ${(end - start).toFixed(2)}ms`);
        console.log(`Baseline API Calls (1 hr): ${calls}`);

        expect(calls).toBeGreaterThan(0);
    });
});
