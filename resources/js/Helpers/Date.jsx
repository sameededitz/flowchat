export const formatMessageDateLong = (date) => {
    const now = new Date();
    const messageDate = new Date(date);

    // Check if the message is from today
    if (isToday(messageDate)) {
        return messageDate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    } else if (isYesterday(messageDate)) {
        return 'Yesterday' + ' ' + messageDate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    } else if (messageDate.getFullYear() === now.getFullYear()) {
        return messageDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        }) + ' ' + messageDate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    } else {
        return messageDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        }) + ' ' + messageDate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    }
}

export const formatMessageDateShort = (date) => {
    const now = new Date();
    const messageDate = new Date(date);

    // Check if the message is from today
    if (isToday(messageDate)) {
        return messageDate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    } else if (isYesterday(messageDate)) {
        return 'Yesterday';
    } else if (messageDate.getFullYear() === now.getFullYear()) {
        return messageDate.toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
        });
    } else {
        return messageDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    }
}

export const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
}

export const isYesterday = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();
}