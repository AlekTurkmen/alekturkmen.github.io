// dashboard.jsx
import React, { useEffect, useState } from 'react';
import ActivityCalendar from 'react-activity-calendar';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import supabase from './supabaseClient';

function Dashboard() {
  const [activities, setActivities] = useState([]);
  const [livestreams, setLivestreams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const customTheme = {
    light: [
      '#ffebe9', // Level 0
      '#ffc1c0', // Level 1
      '#ff9492', // Level 2
      '#ff6b6b', // Level 3
      '#ff0000'  // Level 4
    ],
    dark: [
      '#ffebe9',
      '#ffc1c0',
      '#ff9492', 
      '#ff6b6b',
      '#ff0000'
    ]
  };

  const parseDurationToSeconds = (duration) => {
    if (!duration) return 0;
    const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!matches) return 0;
    const [_, hours, minutes, seconds] = matches;
    return (parseInt(hours || 0) * 3600) + 
           (parseInt(minutes || 0) * 60) + 
           parseInt(seconds || 0);
  };

  const formatDuration = (duration) => {
    const seconds = parseDurationToSeconds(duration);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString) => {
    // Force UTC to avoid timezone issues
    const date = new Date(dateString + 'T00:00:00Z');
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    });
  };

  const calculateStreamPercentage = (activities) => {
    // Calculate 16-hour days since Nov 8th 2024 to now
    const startDate = new Date('2024-11-08');
    const currentDate = new Date();
    const totalDays = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
    const totalHours = totalDays * 16; // 16 hours per day instead of 24
    
    // Sum all streaming hours
    const streamedHours = activities.reduce((sum, activity) => sum + activity.count, 0);
    
    // Calculate percentage
    return ((streamedHours / totalHours) * 100).toFixed(1);
  };

  // Add this function to generate thumbnail URL
  const getYoutubeThumbnail = (videoId) => {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  };

  // Replace the watch button in your component render with this
  const VideoThumbnail = ({ videoId }) => (
    <a 
      href={`https://youtube.com/watch?v=${videoId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="relative block w-32 h-24 hover:transform hover:scale-105 transition-transform" // Fixed width and height
    >
      <img
        src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
        alt="Video thumbnail"
        className="w-full h-full object-cover rounded-md"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-black bg-opacity-60 rounded-full w-8 h-8 flex items-center justify-center">
          <span className="text-white text-lg">▶</span>
        </div>
      </div>
    </a>
  );

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from('livestreams')
          .select('*')
          .gte('published_at', '2024-11-08')
          .order('published_at', { ascending: true }); // Changed to ascending for latest on right

        if (error) throw error;

        // Process data for activity calendar
        const dateMap = new Map();
        let maxDuration = 0;

        data.forEach(stream => {
          const date = stream.published_at.split('T')[0];
          const duration = parseDurationToSeconds(stream.duration);
          const existing = dateMap.get(date) || 0;
          dateMap.set(date, existing + duration);
          maxDuration = Math.max(maxDuration, existing + duration);
        });

        const activities = Array.from(dateMap.entries()).map(([date, duration]) => ({
          date,
          count: Math.round(duration / 3600),
          level: Math.min(4, Math.floor((duration / maxDuration) * 4))
        }));

        setActivities(activities);
        setLivestreams(data.reverse()); // Reverse for latest first in grid
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="bg-gray-100 p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Alek's Livestream Dashboard</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold mb-4">Streaming Activity</h2>
          {isLoading && <div>Loading...</div>}
          {error && <div className="text-red-500">Error: {error}</div>}
          {!isLoading && !error && activities.length > 0 && (
            <>
              <ActivityCalendar
                data={activities}
                blockSize={20}
                blockMargin={4}
                fontSize={14}
                theme={customTheme}
                showWeekdayLabels
                labels={{
                  totalCount: '{{count}} hours livestreamed since November 8th {{year}}'
                }}
                renderBlock={(block, activity) =>
                  React.cloneElement(block, {
                    'data-tooltip-id': 'activity-tooltip',
                    'data-tooltip-html': `${activity.count} hours on ${formatDate(activity.date)}`
                  })
                }
              />
              <ReactTooltip 
                id="activity-tooltip"
                className="bg-white text-gray-800 border border-gray-200 shadow-lg"
              />
              <div className="text-left text-sm mt-2">
                Streamed {calculateStreamPercentage(activities)}% of hours awake since November 8th 2024
              </div>
            </>
          )}
        </div>

        {/* Rest of dashboard components */}

        <div className="grid grid-cols-3 gap-4">
          {livestreams.map(stream => (
            <div key={stream.video_id} className="bg-white shadow-md rounded-lg p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-l font-semibold">{stream.title}</h2>
                  <p className="text-gray-600">
                    Published: {stream.published_at.split('T')[0]}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center text-gray-700 space-x-4">
                <div>
                  <strong>Duration:</strong> {formatDuration(stream.duration)}
                </div>
                <VideoThumbnail videoId={stream.video_id} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;