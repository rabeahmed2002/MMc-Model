import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import GanttChart from "./GanttChart";

function calculatePoissonProbability(k, lambda) {
  const eToMinusLambda = Math.exp(-lambda);
  const lambdaToK = Math.pow(lambda, k);
  const kFactorial = factorial(k);
  const poissonProb = (eToMinusLambda * lambdaToK) / kFactorial;
  return poissonProb;
}

function factorial(n) {
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

export default function PoissonDistribution() {
  const [numServers, setNumServers] = useState("");
  const [servers, setServers] = useState([]);
  const [serversData, setServersData] = useState([]);

  const [lambda, setLambda] = useState("");
  const [mu, setMu] = useState("");
  const [data, setData] = useState([]);
  const [interArrivalTimes, setInterArrivalTimes] = useState([]);
  const [arrivalTimes, setArrivalTimes] = useState([]);
  const [serviceCount, setServiceCount] = useState(10);
  const [serviceTimes, setServiceTimes] = useState([]);
  const [departureTimes, setDepartureTimes] = useState([]);
  const [ganttData, setGanttData] = useState([]);

  //for lcg
  const [A, setA] = useState("");
  const [Z0, setZ0] = useState("");
  const [C, setC] = useState("");
  const [M, setM] = useState("");
  const [a, setAValue] = useState(1);
  const [b, setBValue] = useState(3);
  const [n, setN] = useState(10);
  const [randomPriorities, setRandomPriorities] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   if (lambda && mu && A && Z0 && C && M && n) {
  //     calculateCumulativeProbability();
  //     // Check if inter-arrival times, arrival times, and service times are already calculated
  //     if (interArrivalTimes.length === 0) {
  //       generateInterArrivalTimes();
  //     }
  //     if (arrivalTimes.length === 0) {
  //       generateArrivalTimes();
  //     }
  //     if (serviceTimes.length === 0) {
  //       generateServiceTimes();
  //     }
  //     // Check if departure times are already calculated
  //     if (departureTimes.length === 0) {
  //       generateDepartureTimes();
  //     }
  //     // Check if random priorities are already generated
  //     if (randomPriorities.length === 0) {
  //       generateRandomPriorities();
  //     }
  //     generateGanttData();
  //   }
  // }, [
  //   lambda,
  //   mu,
  //   A,
  //   Z0,
  //   C,
  //   M,
  //   n,
  //   interArrivalTimes,
  //   arrivalTimes,
  //   serviceTimes,
  //   departureTimes,
  //   randomPriorities,
  // ]);
  useEffect(() => {
    if (numServers > 0 && Number.isInteger(numServers)) {
      const generatedServersData = Array.from(
        { length: numServers },
        (_, serverIndex) => {
          const serverTasks = Array.from({ length: 10 }, (_, taskIndex) => {
            const task = {
              index: taskIndex + 1,
              startingTime: arrivalTimes[taskIndex], // Use the arrival time as the starting time for simplicity
              endingTime: departureTimes[taskIndex], // Use the departure time as the ending time for simplicity
              serviceTime: serviceTimes[taskIndex],
            };
            return task;
          });
          return { tasks: serverTasks };
        }
      );

      // Update the serversData state with the generated data
      setServersData(generatedServersData);
    } else {
      // Handle invalid input (e.g., show an error message)
      console.error("Invalid number of servers.");
      // You might want to set serversData to an empty array or handle this case differently
    }
  }, [numServers, arrivalTimes, departureTimes, serviceTimes]);

 
  const generateRandomPriorities = () => {
    const lcgNumbers = [];
    const rnValues = [];

    let Z = parseInt(Z0);

    for (let i = 0; i < n; i++) {
      const R = (parseInt(A) * Z + parseInt(C)) % parseInt(M);
      lcgNumbers.push(R);
      rnValues.push(R / parseInt(M));
      Z = R;
    }

    const priorities = rnValues.map((rn) => (3 - 1) * rn + 1); // (b - a) * rn + a
    const roundedPriorities = priorities.map((priority) =>
      Math.round(priority)
    );

    setRandomPriorities(roundedPriorities);
  };

  //

  const generateServiceTimes = () => {
    const generatedServiceTimes = [];
    for (let i = 0; i < serviceCount; i++) {
      const randomValue = Math.random();
      const serviceTime = -mu * Math.log(randomValue).toFixed(4);
      generatedServiceTimes.push(serviceTime);
    }
    setServiceTimes(generatedServiceTimes);
  };

  const generateDepartureTimes = () => {
    const generatedDepartureTimes = [];
    let prevDepartureTime = 0;

    for (let i = 0; i < serviceTimes.length; i++) {
      const serviceTime = serviceTimes[i];
      const departureTime =
        Math.max(arrivalTimes[i], prevDepartureTime) + serviceTime;
      generatedDepartureTimes.push(departureTime);
      prevDepartureTime = departureTime;
    }

    setDepartureTimes(generatedDepartureTimes);
  };

  const calculateCumulativeProbability = () => {
    let cumulativeProb = 0;
    const tempData = [];

    for (let k = 0; ; k++) {
      const poissonProb = calculatePoissonProbability(k, parseFloat(lambda));
      cumulativeProb += poissonProb;

      const lookup =
        tempData.length === 0
          ? 0
          : tempData[tempData.length - 1].cumulativeProb;

      tempData.push({
        interval: k,
        cumulativeProb: cumulativeProb,
        lookup: lookup,
      });

      if (cumulativeProb >= 1) {
        break;
      }
    }

    setData(tempData);
  };

  const generateInterArrivalTimes = () => {
    const generatedInterArrivalTimes = [];

    // Check if data is available
    if (data.length > 0) {
      generatedInterArrivalTimes.push(0); // First inter-arrival time is 0

      for (let i = 1; i < 10; i++) {
        const randomNum = Math.random();
        const selectedData = data.find(
          (row) => randomNum >= row.lookup && randomNum <= row.cumulativeProb
        );

        // Check if selectedData is defined
        if (selectedData) {
          generatedInterArrivalTimes.push(selectedData.interval);
        }
      }
    }

    setInterArrivalTimes(generatedInterArrivalTimes);
  };

  // Update arrival times logic
// const generateArrivalTimes = () => {
//   const generatedArrivalTimes = [0]; // First arrival time is 0
//   let prevArrivalTime = 0;

//   for (let i = 1; i < interArrivalTimes.length; i++) {
//     const interArrivalTime = interArrivalTimes[i - 1]; // Use previous inter-arrival time
//     const currentArrivalTime = prevArrivalTime + interArrivalTime;
//     generatedArrivalTimes.push(currentArrivalTime);
//     prevArrivalTime = currentArrivalTime;
//   }

//   setArrivalTimes(generatedArrivalTimes);
// };
const generateArrivalTimes = () => {
  // const generatedArrivalTimes = [0]; // First arrival time is 0
  let prevArrivalTime = 0;

  for (let i = 1; i < interArrivalTimes.length; i++) {
    const interArrivalTime = interArrivalTimes[i - 1];
    const currentArrivalTime = prevArrivalTime + interArrivalTime;
    // generatedArrivalTimes.push(currentArrivalTime);
    prevArrivalTime = currentArrivalTime;
  }

  setArrivalTimes(interArrivalTimes+prevArrivalTime);
};


  // const generateGanttData = () => {
  //   const ganttData = [];

  //   for (let i = 0; i < numServers; i++) {
  //     const serverData = {
  //       label: `Server ${i + 1}`,
  //       data: [],
  //       backgroundColor: `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(
  //         Math.random() * 256
  //       )}, ${Math.floor(Math.random() * 256)}, 0.6)`,
  //     };

  //     for (let j = 0; j < interArrivalTimes.length; j++) {
  //       const arrivalTime = arrivalTimes[j];
  //       const serviceTime = serviceTimes[j];
  //       const priority = randomPriorities[j];

  //       serverData.data.push({
  //         x: arrivalTime,
  //         y: serviceTime,
  //         priority: priority,
  //       });
  //     }

  //     ganttData.push(serverData);
  //   }

  //   return ganttData;
  // };

  // const ganttData = generateGanttData();

  // const options = {
  //   scales: {
  //     xAxes: [
  //       {
  //         type: "linear", // Use linear scale for numeric data
  //         position: "bottom",
  //         scaleLabel: {
  //           display: true,
  //           labelString: "Time", // Label for the x-axis
  //         },
  //         ticks: {
  //           beginAtZero: true, // Start the scale at zero
  //         },
  //       },
  //     ],
  //     yAxes: [
  //       {
  //         stacked: true,
  //         scaleLabel: {
  //           display: true,
  //           labelString: "Service Time", // Label for the y-axis
  //         },
  //       },
  //     ],
  //   },
  //   tooltips: {
  //     callbacks: {
  //       title: (tooltipItem, data) => {
  //         return `Server ${tooltipItem[0].datasetIndex + 1}`;
  //       },
  //       label: (tooltipItem, data) => {
  //         const dataset = data.datasets[tooltipItem.datasetIndex];
  //         const item = dataset.data[tooltipItem.index];
  //         return `Arrival Time: ${item.x}, Service Time: ${item.y}, Priority: ${item.priority}`;
  //       },
  //     },
  //   },
  // };
  const initialServersData = Array.from({ length: numServers }, (_, index) => {
    return {
      tasks: [],
      queue: [], // Queue for tasks waiting to be processed
    };
  });

  // Calculate turnaround time (Ending Time - Arrival Time)
  const calculateTurnaroundTime = (task) => {
    return (task.endingTime - task.arrivalTime).toFixed(2);
  };

  // Calculate waiting time (Starting Time - Arrival Time)
  const calculateWaitingTime = (task) => {
    return (task.startingTime - task.arrivalTime).toFixed(2);
  };

  // Calculate response time (Starting Time - Arrival Time)
  const calculateResponseTime = (task) => {
    return (task.startingTime - task.arrivalTime).toFixed(2);
  };

  const generateGanttData = () => {
    const ganttData = [];
    const servers = Array.from({ length: numServers }, () => ({ endTime: 0 }));
    const queue = [];

    for (let i = 0; i < interArrivalTimes.length; i++) {
        const arrivalTime = arrivalTimes[i];
        const serviceTime = serviceTimes[i];
        const priority = randomPriorities[i];

        // Find the first available server within the limit of numServers
        let availableServer = servers.findIndex(
            (server, index) => server.endTime <= arrivalTime && index < numServers
        );

        // Check if there are tasks in the queue that were interrupted by higher priority tasks
        const interruptedTask = queue.find(task => task.arrivalTime <= servers[availableServer].endTime && task.priority > priority);

        if (interruptedTask) {
            const startingTime = servers[availableServer].endTime;
            const endingTime = startingTime + interruptedTask.serviceTime;
            servers[availableServer] = { endTime: endingTime };

            const task = {
                index: interruptedTask.index,
                arrivalTime: interruptedTask.arrivalTime,
                serviceTime: interruptedTask.serviceTime,
                priority: interruptedTask.priority,
                startingTime,
                endingTime,
                serverNumber: availableServer + 1,
                turnaroundTime: (endingTime - interruptedTask.arrivalTime).toFixed(4),
                waitingTime: (startingTime - interruptedTask.arrivalTime).toFixed(4),
                responseTime: (startingTime - interruptedTask.arrivalTime).toFixed(4),
            };

            ganttData.push(task);
            // Remove the interrupted task from the queue
            queue.splice(queue.indexOf(interruptedTask), 1);
        }

        // If no available server found within the limit, place the task in the queue
        if (availableServer === -1) {
            queue.push({
                index: i + 1,
                arrivalTime,
                serviceTime,
                priority,
            });
        } else {
            const startingTime = Math.max(
                arrivalTime,
                servers[availableServer - 1]?.endTime || 0
            );
            const endingTime = startingTime + serviceTime;
            servers[availableServer] = { endTime: endingTime };

            const task = {
                index: i + 1,
                arrivalTime,
                serviceTime,
                priority,
                startingTime,
                endingTime,
                serverNumber: availableServer + 1,
                turnaroundTime: (endingTime - arrivalTime).toFixed(4),
                waitingTime: (startingTime - arrivalTime).toFixed(4),
                responseTime: (startingTime - arrivalTime).toFixed(4),
            };

            ganttData.push(task);
        }
    }

    // Add tasks from the queue to the ganttData
    queue.forEach((task) => {
        const availableServer = servers.findIndex(
            (server) => server.endTime <= task.arrivalTime
        );
        const startingTime =
            Math.max(
                task.arrivalTime,
                servers[availableServer - 1]?.endTime || 0
            ) || task.arrivalTime;
        const endingTime = (startingTime + task.serviceTime).toFixed(4);
        servers[availableServer] = { endTime: endingTime };

        const queuedTask = {
            ...task,
            startingTime,
            endingTime,
            serverNumber: availableServer + 1,
            turnaroundTime: (endingTime - task.arrivalTime).toFixed(4),
            waitingTime: (startingTime - task.arrivalTime).toFixed(4),
            responseTime: (startingTime - task.arrivalTime).toFixed(4),
        };

        ganttData.push(queuedTask);
    });

    // Sort the ganttData by arrivalTime for proper ordering
    ganttData.sort((a, b) => a.arrivalTime - b.arrivalTime);

    setTasks(ganttData);
};


  return (
    <div className="text-center upr">
      {/* {serversData.length > 0 && <GanttChart serversData={serversData} />} */}
      <h4 className="p-4">MMc Simulation Model</h4>
      <label>
        Enter Number of Servers:
        <input
          className="text-center"
          type="number"
          step="0.01"
          value={numServers}
          onChange={(e) => setNumServers(parseInt(e.target.value))}
        />
      </label>
      <label>
        Enter the average rate (lambda):
        <input
          className="text-center"
          type="number"
          step="0.01"
          value={lambda}
          onChange={(e) => setLambda(e.target.value)}
        />
      </label>
      <br />
      <label>
        Enter Mean Service Rate (μ):
        <input
          className="text-center"
          type="number"
          step="0.01"
          value={mu}
          onChange={(e) => setMu(e.target.value)}
        />
      </label>
      <div className="text-center upr">
        <h4 className="p-4">Enter Values to Apply LCG Algorithm</h4>
        <label>
          Enter A:
          <input
            type="number"
            value={A}
            onChange={(e) => setA(e.target.value)}
          />
        </label>
        <br />
        <label>
          Enter Z0:
          <input
            type="number"
            value={Z0}
            onChange={(e) => setZ0(e.target.value)}
          />
        </label>
        <br />
        <label>
          Enter C:
          <input
            type="number"
            value={C}
            onChange={(e) => setC(e.target.value)}
          />
        </label>
        <br />
        <label>
          Enter M:
          <input
            type="number"
            value={M}
            onChange={(e) => setM(e.target.value)}
          />
        </label>
        <br />
        <label>
          Enter N:
          <input
            type="number"
            value={n}
            onChange={(e) => setN(e.target.value)}
          />
        </label>
      
      </div>
      {/* <Bar data={{ datasets: ganttData }} options={options} /> */}
      {/* <button
        className="btn btn-light"
        onClick={() => {
          calculateCumulativeProbability();
          generateInterArrivalTimes();
          generateArrivalTimes();
          generateServiceTimes();
          generateDepartureTimes();
          generateRandomPriorities();
          generateGanttData();
        }}
        disabled={!lambda || !mu || !A || !Z0 || !C || !M || !n}
      >
        Go
      </button> */}
      <br />
      <GanttChart tasks={tasks} />;
      {/* {serversData.length > 0 && <GanttChart serversData={serversData} />} */}
      {data.length > 0 && (
        <div className="mt-4">
          <h5>Cumulative Poisson Probability Table:</h5>
          <table className="table">
            <thead>
              <tr>
                <th>k</th>
                <th>Cumulative Probability (P(X &lt;= k))</th>
                <th>Lookup Value</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index}>
                  <td>{index}</td>
                  <td>{row.cumulativeProb}</td>
                  <td>{row.lookup}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Button to generate inter-arrival times */}
      {/* <button
        className="btn btn-light mt-2"
        onClick={generateInterArrivalTimes}
        disabled={!data.length}
      >
        Generate Inter-Arrival Times
      </button> */}
      {/* Table for Inter-Arrival Times */}
      {interArrivalTimes.length > 0 && (
        <div className="mt-4">
          <h5>Generated Inter-Arrival and Service Times:</h5>
          <table className="table">
            <thead>
              <tr>
                <th>Index</th>
                <th>Inter-Arrival Time</th>
                <th>Arrival Time</th>
                <th>Service Time</th>
                <th>Priority</th>
                {/* <th>Departure Time</th> */}
              </tr>
            </thead>
            <tbody>
              {interArrivalTimes.map((time, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{time}</td>
                  <td>{arrivalTimes[index]}</td>
                 <td>{Math.floor(serviceTimes[index] + 1)}</td>

                  <td>{randomPriorities[index]}</td>
                  {/* <td>{departureTimes[index]}</td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tasks.length > 0 && (
        <div className="mt-4">
          <h5>Task Metrics:</h5>
          <table className="table">
            <thead>
              <tr>
                <th>Index</th>
                {/* <th>Arrival Time</th> */}
                {/* <th>service</th> */}
                <th>Server n0.</th>
                <th>Starting Time</th>
                <th>Ending Time</th>
                <th>Turnaround Time</th>
                <th>Waiting Time</th>
                <th>Response Time</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.index}>
                  <td>{task.index}</td>
                  {/* <td>{task.arrivalTime}</td> */}
                  {/* <td>{task.serviceTime}</td> */}
                  <td>{task.serverNumber}</td>
                  <td>{Math.floor(task.startingTime)}</td>
                  <td>{Math.floor(task.endingTime)}</td>
                  <td>{task.turnaroundTime}</td>
                  <td>{task.waitingTime}</td>
                  <td>{task.responseTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
        <button
        className="btn btn-light"
        onClick={() => {
          calculateCumulativeProbability();
          generateInterArrivalTimes();
          generateArrivalTimes();
          generateServiceTimes();
          generateDepartureTimes();
          generateRandomPriorities();
          generateGanttData();
        }}
        disabled={!lambda || !mu || !A || !Z0 || !C || !M || !n}
      >
        Go
      </button>
    </div>
  );
}
