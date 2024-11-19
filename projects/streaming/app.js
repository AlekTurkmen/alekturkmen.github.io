class StreamingHeatmap {
    constructor() {
        this.streamData = [];
        this.margin = {top: 50, right: 30, bottom: 30, left: 40};
        this.width = 960 - this.margin.left - this.margin.right;
        this.height = 200 - this.margin.top - this.margin.bottom;
        this.cellSize = 15; // Size of each day square
        this.cellPadding = 2; // Padding between squares
    }

    async fetchVideos(pageToken = '') {
        try {
            const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CONFIG.CHANNEL_ID}&maxResults=${CONFIG.MAX_RESULTS}&order=date&type=video&key=${CONFIG.API_KEY}${pageToken ? '&pageToken=' + pageToken : ''}`;
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            console.error('Error fetching videos:', error);
            return null;
        }
    }

    async fetchVideoDetails(videoIds) {
        try {
            const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails&id=${videoIds.join(',')}&key=${CONFIG.API_KEY}`;
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            console.error('Error fetching video details:', error);
            return null;
        }
    }

    async collectAllStreamData() {
        let allVideos = [];
        let pageToken = '';
        
        do {
            const response = await this.fetchVideos(pageToken);
            if (!response) break;
            
            allVideos = [...allVideos, ...response.items];
            pageToken = response.nextPageToken;
        } while (pageToken);

        const videoIds = allVideos.map(video => video.id.videoId);
        const videoDetails = await this.fetchVideoDetails(videoIds);
        
        // Process stream data with duration calculation
        this.streamData = videoDetails.items
            .filter(item => item.liveStreamingDetails)
            .map(item => {
                const startTime = new Date(item.liveStreamingDetails.actualStartTime);
                const endTime = new Date(item.liveStreamingDetails.actualEndTime);
                const durationHours = (endTime - startTime) / (1000 * 60 * 60); // Duration in hours
                
                // Convert to EST
                const startTimeEST = new Date(startTime.toLocaleString('en-US', { timeZone: 'America/New_York' }));
                const dateKey = startTimeEST.toISOString().split('T')[0];

                return {
                    date: dateKey,
                    duration: durationHours,
                    title: item.snippet.title
                };
            });

        this.renderHeatmap();
    }

    renderHeatmap() {
        // Calculate date range (from Nov 8th, 2024 to today)
        const endDate = new Date();
        const startDate = new Date('2024-11-08'); //The current date to Nov 8th, 2024

        // Ensure startDate begins at the start of its week (Sunday)
        const adjustedStartDate = new Date(startDate);
        const day = startDate.getDay();
        adjustedStartDate.setDate(startDate.getDate() - day);

        // Ensure endDate ends at the end of its week (Saturday)
        const adjustedEndDate = new Date(endDate);
        const endDay = endDate.getDay();
        adjustedEndDate.setDate(endDate.getDate() + (6 - endDay));

        // Create array of all dates in range
        const dates = d3.timeDays(adjustedStartDate, adjustedEndDate);

        // Group stream data by date
        const streamsByDate = d3.group(this.streamData, d => d.date);
        
        // Calculate hours streamed per day
        const hoursPerDay = new Map();
        dates.forEach(date => {
            const dateKey = date.toISOString().split('T')[0];
            const streams = streamsByDate.get(dateKey) || [];
            const totalHours = streams.reduce((sum, stream) => sum + stream.duration, 0);
            hoursPerDay.set(dateKey, totalHours);
        });

        // Calculate the number of weeks to determine width
        const totalWeeks = Math.ceil((adjustedEndDate - adjustedStartDate) / (7 * 24 * 60 * 60 * 1000));
        this.width = (this.cellSize + this.cellPadding) * totalWeeks + this.margin.left + this.margin.right;

        // Create SVG with adjusted width
        const svg = d3.select("#heatmap")
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        // Create color scale
        const colorScale = d3.scaleSequential()
            .domain([0, d3.max(Array.from(hoursPerDay.values())) || 1])
            .interpolator(d3.interpolateGreens);

        // Calculate week numbers for only this range
        const weekNumbers = d3.timeWeeks(adjustedStartDate, adjustedEndDate);

        // Create week groups
        const weeks = svg.selectAll(".week")
            .data(weekNumbers)
            .join("g")
            .attr("class", "week")
            .attr("transform", (d, i) => `translate(${i * (this.cellSize + this.cellPadding)}, 0)`);

        // Create day cells
        weeks.selectAll(".day")
            .data(d => d3.timeDays(d, new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000)))
            .join("rect")
            .attr("class", "day")
            .attr("width", this.cellSize)
            .attr("height", this.cellSize)
            .attr("y", d => d.getDay() * (this.cellSize + this.cellPadding))
            .attr("fill", d => {
                const dateKey = d.toISOString().split('T')[0];
                // Only color dates within our actual range
                if (d >= startDate && d <= endDate) {
                    const hours = hoursPerDay.get(dateKey) || 0;
                    return colorScale(hours);
                }
                return "#eee"; // Light gray for dates outside our range
            })
            .append("title")
            .text(d => {
                const dateKey = d.toISOString().split('T')[0];
                if (d >= startDate && d <= endDate) {
                    const hours = hoursPerDay.get(dateKey) || 0;
                    return `${d.toDateString()}\n${hours.toFixed(1)} hours streamed`;
                }
                return "This is the future";
            });

        // Add month labels with adjusted positioning
        const months = d3.timeMonths(adjustedStartDate, adjustedEndDate);
        svg.selectAll(".month")
            .data(months)
            .join("text")
            .attr("class", "month")
            .attr("x", d => {
                const weekNumber = Math.floor((d - adjustedStartDate) / (7 * 24 * 60 * 60 * 1000));
                return weekNumber * (this.cellSize + this.cellPadding);
            })
            .attr("y", -5)
            .text(d => d.toLocaleString('default', { month: 'short' }))
            .style("text-anchor", "start");

        // Add selected day labels (Mon, Wed, Fri)
        const selectedDays = [
            { day: 'Mon', index: 1 },
            { day: 'Wed', index: 3 },
            { day: 'Fri', index: 5 }
        ];
        
        svg.selectAll(".dayLabel")
            .data(selectedDays)
            .join("text")
            .attr("class", "dayLabel")
            .attr("x", -5)
            .attr("y", d => (d.index * (this.cellSize + this.cellPadding)) + this.cellSize)
            .style("text-anchor", "end")
            .text(d => d.day);
    }
}

// Initialize and run
const heatmap = new StreamingHeatmap();
heatmap.collectAllStreamData();