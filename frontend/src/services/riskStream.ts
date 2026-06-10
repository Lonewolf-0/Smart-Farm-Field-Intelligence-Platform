export const connectRiskStream = (
    fieldId: string,
    token: string,
    onAlert: (alerts: any[]) => void
) => {

    const eventSource = new EventSource(
        `http://localhost:5000/api/analysis/${fieldId}/risks/stream?token=${token}`
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