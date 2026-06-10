export const showNotification = (alert: any) => {

    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }

    if (Notification.permission === "granted") {
        new Notification(` ${alert.type.toUpperCase()}`, {
            body: alert.message,
        });
    }
};