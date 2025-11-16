document.addEventListener("DOMContentLoaded", () => {
  const dateFilter = document.getElementById("dateFilter");

  if (dateFilter) {
    // Default to today
    const today = new Date().toISOString().slice(0, 10);
    dateFilter.value = today;

    // Load immediately with today’s filter
    loadCriticalData(today);

    // Update when user changes
    dateFilter.addEventListener("change", () => {
      const selected = dateFilter.value;
      if (selected) {
        loadCriticalData(selected);
      } else {
        // If cleared, show all dates
        loadCriticalData();
      }
    });
  } else {
    // If no filter input exists, just load all
    loadCriticalData();
  }
});

function loadCriticalData(filterDate = null) {
  // Adjust path: notifications.html is in /html/, xml is in /xml/
  fetch("../xml/data.xml", { cache: "no-store" })
    .then(res => res.text())
    .then(xmlText => {
      const parser = new DOMParser();
      const xml = parser.parseFromString(xmlText, "application/xml");
      const entries = xml.getElementsByTagName("entry");

      const data = Array.from(entries).map(e => ({
        time: e.getElementsByTagName("time")[0]?.textContent || "",
        date: e.getElementsByTagName("date")[0]?.textContent || "",
        light: parseFloat(e.getElementsByTagName("light")[0]?.textContent || 0),
        temperature: parseFloat(e.getElementsByTagName("temperature")[0]?.textContent || 0),
        humidity: parseFloat(e.getElementsByTagName("humidity")[0]?.textContent || 0),
        moisture: parseFloat(e.getElementsByTagName("moisture")[0]?.textContent || 0),
        ph: parseFloat(e.getElementsByTagName("ph")[0]?.textContent || 0)
      }));

      renderCritical(data, filterDate);
    })
    .catch(err => {
      console.error("Error loading notifications:", err);
      document.getElementById("notificationsContainer").textContent =
        "Failed to load notifications.";
    });
}

function renderCritical(data, filterDate = null) {
  const container = document.getElementById("notificationsContainer");
  container.innerHTML = "";

  // Group by date
  const grouped = {};
  data.forEach(d => {
    if (!grouped[d.date]) grouped[d.date] = [];
    // Critical conditions (leafy greens thresholds)
    if (d.light > 150 ||
        d.temperature < 15 || d.temperature > 30 ||
        d.humidity < 40 || d.humidity > 80 ||
        d.moisture < 30 || d.moisture > 70 ||
        d.ph < 5.0 || d.ph > 7.5) {
      grouped[d.date].push(d);
    }
  });

  // Sort dates latest → oldest
  let dates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

  // Apply filter if provided
  if (filterDate) {
    dates = dates.filter(d => d === filterDate);
  }

  if (dates.length === 0) {
    container.innerHTML = "<p style='color:#666;'>No records found.</p>";
    return;
  }

  dates.forEach(date => {
    const section = document.createElement("div");
    section.className = "critical-day";
    section.innerHTML = `<h3>${date} (${grouped[date].length} records found)</h3>`;

    const table = document.createElement("table");
    table.innerHTML = `
      <thead>
        <tr>
          <th>Time</th>
          <th>Light</th>
          <th>Temperature</th>
          <th>Humidity</th>
          <th>Moisture</th>
          <th>pH</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");
    grouped[date].forEach(row => {
      // Decide per-cell class
      const lightClass = (row.light > 100) ? "critical-cell" : "";
      const tempClass  = (row.temperature < 15 || row.temperature > 30) ? "critical-cell" : "";
      const humClass   = (row.humidity < 40 || row.humidity > 80) ? "critical-cell" : "";
      const moistClass = (row.moisture < 30 || row.moisture > 70) ? "critical-cell" : "";
      const phClass    = (row.ph < 5.0 || row.ph > 7.5) ? "critical-cell" : "";

      tbody.insertAdjacentHTML("beforeend", `
        <tr>
          <td>${row.time}</td>
          <td class="${lightClass}">${row.light}</td>
          <td class="${tempClass}">${row.temperature}</td>
          <td class="${humClass}">${row.humidity}</td>
          <td class="${moistClass}">${row.moisture}</td>
          <td class="${phClass}">${row.ph}</td>
        </tr>
      `);
    });

    section.appendChild(table);
    container.appendChild(section);
  });
}

