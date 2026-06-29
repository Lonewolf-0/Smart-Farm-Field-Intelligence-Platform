import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { showNotification } from '../../src/utils/notification';

describe('showNotification', () => {
    let originalNotification: any;
    let mockRequestPermission: ReturnType<typeof vi.fn>;
    let MockNotification: any;

    beforeEach(() => {
        originalNotification = global.Notification;
        mockRequestPermission = vi.fn();

        MockNotification = vi.fn();
        MockNotification.requestPermission = mockRequestPermission;
        MockNotification.permission = 'default';

        global.Notification = MockNotification as any;
    });

    afterEach(() => {
        global.Notification = originalNotification;
        vi.clearAllMocks();
    });

    it('requests permission if permission is not granted', () => {
        MockNotification.permission = 'default';

        showNotification({ type: 'error', message: 'Test error message' });

        expect(mockRequestPermission).toHaveBeenCalledTimes(1);
    });

    it('requests permission if permission is denied', () => {
        MockNotification.permission = 'denied';

        showNotification({ type: 'info', message: 'Test info message' });

        expect(mockRequestPermission).toHaveBeenCalledTimes(1);
    });

    it('creates a new Notification with correct arguments if permission is granted', () => {
        MockNotification.permission = 'granted';

        showNotification({ type: 'success', message: 'Test success message' });

        expect(mockRequestPermission).not.toHaveBeenCalled();
        expect(MockNotification).toHaveBeenCalledTimes(1);
        expect(MockNotification).toHaveBeenCalledWith(' SUCCESS', {
            body: 'Test success message'
        });
    });
});
