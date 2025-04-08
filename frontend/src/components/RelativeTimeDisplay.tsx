import React from 'react';

interface RelativeTimeDisplayProps {
  dateString: string | Date | null | undefined;
}

const RelativeTimeDisplay: React.FC<RelativeTimeDisplayProps> = ({ dateString }) => {

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffHours / 24);

    const timeOptions: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true, 
    };
    const formattedTime = date.toLocaleTimeString(undefined, timeOptions);

    const dateOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
    };
    const formattedDate = date.toLocaleDateString(undefined, dateOptions);

    if (diffSeconds < 60) {
      return `just now`; // Or ${diffSeconds} seconds ago
    }
    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    }
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }
    // Check if it was yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.getFullYear() === yesterday.getFullYear() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getDate() === yesterday.getDate()) {
      return `Yesterday at ${formattedTime}`;
    }
    if (diffDays <= 14) {
       return `${diffDays} days ago at ${formattedTime}`;
    }
    
    return `${formattedDate} at ${formattedTime}`;
  };

  if (!dateString) {
    return <span className="text-gray-400 text-xs">Date unavailable</span>;
  }

  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
       console.error("Invalid date string received:", dateString);
       return <span className="text-gray-400 text-xs">Invalid date</span>;
    }
    const formattedDisplay = formatRelativeTime(date);
    return <span title={date.toLocaleString()} className="text-gray-500 text-xs">{formattedDisplay}</span>;
  } catch (error) {
     console.error('Error parsing date:', error, "Input:", dateString);
     return <span className="text-gray-400 text-xs">Date error</span>;
  }
};

export default RelativeTimeDisplay; 