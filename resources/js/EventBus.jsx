import React from "react";

export const EventBusContext = React.createContext();

export const EventBusProvider = ({ children }) => {
    const [events, setEvents] = React.useState({});

    const emit = (event, data) =>{
        if (events[event]) {
            events[event]?.forEach(cb => cb(data));
        }
    }

    const on = (event, callback) => {
        if (!events[event]) {
            events[event] = [];
        }

        events[event].push(callback);

        return () => {
            events[event] = events[event].filter(cb => cb !== callback);
        }
    }

    const off = (event, callback) => {
        if (events[event]) {
            events[event] = events[event].filter(cb => cb !== callback);
        }
    }

    return (
        <EventBusContext.Provider value={{ emit, on, off }}>
            {children}
        </EventBusContext.Provider>
    );
};

export const useEventBus = () => React.useContext(EventBusContext);