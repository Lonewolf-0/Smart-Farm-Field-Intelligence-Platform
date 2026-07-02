export const connectRiskStream = (
    fieldId: string,
    token: string,
    onAlert: (alerts: any[]) => void
) => {

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const eventSource = new EventSource(
        `${API_URL}/analysis/${fieldId}/risks/stream?token=${token}`
    );

    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        // Ignore initial "connected" message
        if (!Array.isArray(data)) return;

        onAlert(data);
    };

    eventSource.onerror = (error) => {
        console.error("SSE Error:", error);
    };

    return eventSource;
};