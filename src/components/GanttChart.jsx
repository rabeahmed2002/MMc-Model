import React from 'react';

const GanttChart = ({ tasks, numberOfServers }) => {
  // If numberOfServers is 1, normalize all tasks to have the same server number
  if (numberOfServers === 1) {
    tasks = tasks.map(task => ({ ...task, serverNumber: 1 }));
  }

  // Find the maximum end time to define the scale of the chart
  const maxEndTime = Math.max(...tasks.map(task => task.endingTime));

  // Group tasks by server and sort by starting time
  const servers = {};
  tasks.forEach(task => {
    if (!servers[task.serverNumber]) {
      servers[task.serverNumber] = [];
    }
    servers[task.serverNumber].push(task);
  });

  Object.keys(servers).forEach(key => {
    servers[key].sort((a, b) => a.startingTime - b.startingTime);
  });

  // Define the scale factor (width of the chart divided by the maximum end time)
  const scaleFactor = 600 / maxEndTime; // Adjust the width (600px) as needed

  // Function to calculate the width of each task based on its duration
  const calculateTaskWidth = (task) => (task.endingTime - task.startingTime) * scaleFactor;

  // Style for the Gantt chart container
  const ganttChartStyle = {
    position: 'relative',
    width: '100%', // Use full width for better scaling
    height: `${numberOfServers * 60}px`, // Calculate height based on the number of servers
    background: '#eeeeee',
    border: '1px solid #bdbdbd',
    padding: '10px',
    margin: '20px 0',
    overflowX: 'auto',
    whiteSpace: 'nowrap',
  };

  // Style for each task in the Gantt chart
  const taskStyle = (task) => ({
    height: '50px', // Task height
    background: task.priority === 'High' ? '#ffccbc' : '#80cbc4', // Priority color
    position: 'absolute',
    left: `${task.startingTime * scaleFactor}px`,
    width: `${calculateTaskWidth(task)}px`, // Width based on duration
    border: '1px solid #004d40',
    textAlign: 'center',
    lineHeight: '50px',
    color: 'white',
    fontSize: '10px', // Font size for readability
    overflow: 'hidden',
    whiteSpace: 'nowrap', // Ensure text stays on one line
    zIndex: task.priority === 'High' ? 10 : 1, // Priority tasks on top
  });

  return (
    <div style={ganttChartStyle}>
      {Object.keys(servers).map(server => (
        <div key={server} style={{ position: 'relative', height: '60px', marginBottom: '10px' }}>
          {servers[server].map((task, index) => (
            <div key={index} style={taskStyle(task)}>
              {`P${task.index} [${task.priority}]`}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default GanttChart;
