import React, { useEffect, useState } from 'react';

function WODPage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8080/test') 
      .then((response) => response.json())
      .then((data) => setData(data))
      .catch((error) => console.error('Error fetching WOD data:', error));
  }, []);

  return (
    <div>
      <h1>OBIS Table</h1>
      <table border="1">
        <thead>
          <tr>
            <th>Occurrence ID</th>
            <th>Event Date</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.occurrenceid}>
              <td>{row.occurrenceid}</td>
              <td>{row.eventdate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default WODPage;