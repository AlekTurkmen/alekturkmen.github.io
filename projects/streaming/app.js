class StreamingHistory {
    constructor() {
        this.streamData = [];
    }

    async fetchVideos(pageToken = '') {
        try {
            console.log('Fetching videos...');
            const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CONFIG.CHANNEL_ID}&maxResults=${CONFIG.MAX_RESULTS}&order=date&type=video&key=${CONFIG.API_KEY}${pageToken ? '&pageToken=' + pageToken : ''}`;
            console.log('Request URL:', url);
            
            const response = await axios.get(url);
            console.log('Received video data:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                headers: error.response?.headers
            });
            
            throw error;
        }
    }

    async fetchVideoDetails(videoIds) {
        try {
            console.log('Fetching video details for:', videoIds);
            const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails&id=${videoIds.join(',')}&key=${CONFIG.API_KEY}`;
            const response = await axios.get(url);
            console.log('Received video details:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching video details:', error);
            throw error;
        }
    }

    async collectStreamData() {
        try {
            // Get initial list of videos
            const response = await this.fetchVideos();
            const videoIds = response.items.map(video => video.id.videoId);
            
            // Get detailed information for each video
            const details = await this.fetchVideoDetails(videoIds);
            
            // Filter for only livestreams and process the data
            this.streamData = details.items
                .filter(item => item.liveStreamingDetails)
                .map(item => {
                    const startTime = new Date(item.liveStreamingDetails.actualStartTime);
                    const endTime = new Date(item.liveStreamingDetails.actualEndTime);
                    const duration = (endTime - startTime) / (1000 * 60 * 60); // Duration in hours

                    return {
                        title: item.snippet.title,
                        startTime: startTime.toLocaleString('en-US', { timeZone: 'America/New_York' }),
                        endTime: endTime.toLocaleString('en-US', { timeZone: 'America/New_York' }),
                        duration: duration.toFixed(2)
                    };
                });

            // Display the results
            this.displayResults();

        } catch (error) {
            console.error('Error collecting stream data:', error);
            document.getElementById('heatmap').innerHTML = 'Error loading stream data. Please check the console for details.';
        }
    }

    displayResults() {
        const container = document.getElementById('heatmap');
        
        if (this.streamData.length === 0) {
            container.innerHTML = 'No livestreams found.';
            return;
        }

        const html = `
            <h3>Your Livestream History</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="text-align: left; padding: 8px;">Stream Title</th>
                        <th style="text-align: left; padding: 8px;">Start Time (EST)</th>
                        <th style="text-align: left; padding: 8px;">End Time (EST)</th>
                        <th style="text-align: left; padding: 8px;">Duration (hours)</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.streamData.map(stream => `
                        <tr>
                            <td style="padding: 8px;">${stream.title}</td>
                            <td style="padding: 8px;">${stream.startTime}</td>
                            <td style="padding: 8px;">${stream.endTime}</td>
                            <td style="padding: 8px;">${stream.duration}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = html;
    }
}

// Initialize and run
const streamHistory = new StreamingHistory();
streamHistory.collectStreamData();