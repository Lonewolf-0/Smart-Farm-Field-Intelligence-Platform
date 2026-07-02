import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { connectRiskStream } from '../../src/services/riskStream';

class MockEventSource {
    url: string;
    onmessage: ((event: any) => void) | null = null;
    onerror: ((error: any) => void) | null = null;

    constructor(url: string) {
        this.url = url;
    }
}

describe('connectRiskStream', () => {
    let originalEventSource: any;
    let consoleErrorSpy: any;

    beforeEach(() => {
        originalEventSource = global.EventSource;
        global.EventSource = MockEventSource as any;

        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        global.EventSource = originalEventSource;
        consoleErrorSpy.mockRestore();
    });

    it('should create an EventSource with the correct URL', () => {
        const fieldId = '123';
        const token = 'test-token';
        const onAlert = vi.fn();

        const eventSource = connectRiskStream(fieldId, token, onAlert) as unknown as MockEventSource;

        expect(eventSource).toBeInstanceOf(MockEventSource);
        expect(eventSource.url).toBe(`http://localhost:5000/analysis/${fieldId}/risks/stream?token=${token}`);
    });

    it('should call onAlert when receiving an array message', () => {
        const onAlert = vi.fn();
        const eventSource = connectRiskStream('123', 'token', onAlert) as unknown as MockEventSource;

        const mockData = [{ id: 1, type: 'Flood' }];
        if (eventSource.onmessage) {
            eventSource.onmessage({ data: JSON.stringify(mockData) });
        }

        expect(onAlert).toHaveBeenCalledTimes(1);
        expect(onAlert).toHaveBeenCalledWith(mockData);
    });

    it('should ignore non-array messages (like initial connected message)', () => {
        const onAlert = vi.fn();
        const eventSource = connectRiskStream('123', 'token', onAlert) as unknown as MockEventSource;

        const mockData = { message: 'connected' };
        if (eventSource.onmessage) {
            eventSource.onmessage({ data: JSON.stringify(mockData) });
        }

        expect(onAlert).not.toHaveBeenCalled();
    });

    it('should log an error on onerror', () => {
        const onAlert = vi.fn();
        const eventSource = connectRiskStream('123', 'token', onAlert) as unknown as MockEventSource;

        const mockError = new Error('Network error');
        if (eventSource.onerror) {
            eventSource.onerror(mockError);
        }

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith('SSE Error:', mockError);
    });
});
