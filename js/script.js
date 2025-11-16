let chart = null;
let xmlData = [];
let chartReady = false;
let chartVisible = false;

const dateSelect = document.getElementById("dateSelect");
const btnFilterDate = document.getElementById("btnFilterDate");
const btnClearDate = document.getElementById("btnClearDate");
const tableStatus = document.getElementById("tableStatus");

const chartDateSelect = document.getElementById("chartDateSelect");
const btnFilterChart = document.getElementById("btnFilterChart");
const btnClearChart = document.getElementById("btnClearChart");
const chartStatus = document.getElementById("chartStatus");

const avgLightEl = document.getElementById("avgLight");
const avgTempEl = document.getElementById("avgTemp");
const avgHumEl = document.getElementById("avgHum");
const avgMoistEl = document.getElementById("avgMoist");
const avgPHEl = document.getElementById("avgPH");
const todayCountEl = document.getElementById("todayCount");
const homeUpdatedEl = document.getElementById("homeUpdated");
const tableBody = document.querySelector("#dataTable tbody");

const sections = document.querySelectorAll(".content-section");

document.addEventListener("DOMContentLoaded", () => {
  loadXMLData();
  showSection("article-section");
});

function showSection(id) {
  sections.forEach(s => s.classList.add("hidden"));
  const section = document.getElementById(id);
  if (section) section.classList.remove("hidden");
  chartVisible = id === "chart-section";
  if (id === "table-section") applyDateFilter();
  if (chartVisible && chartReady) applyChartDateFilter();
}

function loadXMLData() {
  fetch("getxml.php?file=" + encodeURIComponent("xml/data.xml"), { cache: "no-store" })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .then(xmlText => {
      const parser = new DOMParser();
      const xml = parser.parseFromString(xmlText, "application/xml");
      const entries = xml.getElementsByTagName("entry");

      xmlData = Array.from(entries).map(e => ({
        time: e.getElementsByTagName("time")[0]?.textContent || "",
        date: e.getElementsByTagName("date")[0]?.textContent || "",
        light: parseFloat(e.getElementsByTagName("light")[0]?.textContent || 0),
        temperature: parseFloat(e.getElementsByTagName("temperature")[0]?.textContent || 0),
        humidity: parseFloat(e.getElementsByTagName("humidity")[0]?.textContent || 0),
        moisture: parseFloat(e.getElementsByTagName("moisture")[0]?.textContent || 0),
        ph: parseFloat(e.getElementsByTagName("ph")[0]?.textContent || 0)
      }));

      fillTable(xmlData);

      if (dateSelect) {
        const today = new Date().toISOString().slice(0, 10);
        dateSelect.value = today;
        applyDateFilter();
      }

      if (chartDateSelect) {
        const today = new Date().toISOString().slice(0, 10);
        chartDateSelect.value = today;
      }

      updateHomeAverages();

      chartReady = true;
      if (chartVisible) applyChartDateFilter();
    })
    .catch(err => {
      console.error("Error loading XML:", err);
      if (analysisText) analysisText.textContent = "Failed to load data. Check /xml/data.xml and run the server.";
    });
}

// Apply date filter from dateSelect; if empty show all
function applyDateFilter(showAlert = false) {
  if (!dateSelect) {
    fillTable(xmlData);
    return;
  }
  const selected = dateSelect.value;
  if (!selected) {
    fillTable(xmlData);
    if (tableStatus) tableStatus.textContent = "";
    return;
  }

  const filtered = xmlData.filter(d => getDateKey(d.date) === selected);

  if (!filtered || filtered.length === 0) {
    // If user pressed Filter, still show an alert but keep the inline table message
    if (showAlert) {
      alert("No records to display.");
    }
    // Render the empty-table row so the "No records to display." message remains visible
    fillTable(filtered);
    if (tableStatus);
    return;
  }

  // has data
  fillTable(filtered);
  if (tableStatus);
}

function fillTable(data) {
  if (!tableBody) return;
  tableBody.innerHTML = "";
  if (!data || data.length === 0) {
    tableBody.insertAdjacentHTML("beforeend", `
      <tr><td colspan="6" style="text-align:center;color:#666;">No records to display.</td></tr>
    `);
    return;
  }
  data.forEach(row => {
    tableBody.insertAdjacentHTML("beforeend", `
      <tr>
        <td>${row.time}</td>
        <td>${row.light}</td>
        <td>${row.temperature}</td>
        <td>${row.humidity}</td>
        <td>${row.moisture}</td>
        <td>${row.ph}</td>
      </tr>
    `);
  });
}

// Helper: normalize a date string to YYYY-MM-DD (prefer regex, fallback to Date)
function normalizeDateStr(s) {
  if (!s) return null;
  const m = String(s).trim().match(/(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

// Keep previous getDateKey for backwards compatibility (uses normalizeDateStr)
function getDateKey(timeStr) {
  return normalizeDateStr(timeStr);
}

// Apply chart date filter and redraw chart using filtered data.
// If no records for the selected date, render message inside chart container.
// When invoked by the user (showAlert === true) show a Windows alert AND keep the inline message.
function applyChartDateFilter(showAlert = false) {
  if (!chartDateSelect) {
    drawChart(parameterSelect.value, chartTypeSelect.value, xmlData);
    if (chartStatus) chartStatus.textContent = "";
    return;
  }

  const selected = chartDateSelect.value ? chartDateSelect.value.trim() : "";
  const dataToUse = !selected ? xmlData : xmlData.filter(d => normalizeDateStr(d.date) === selected);

  if (!dataToUse || dataToUse.length === 0) {
    // Destroy previous chart instance if any
    if (chart) {
      try { chart.destroy(); } catch (e) { /* ignore */ }
      chart = null;
    }

    // Always render the inline "No data..." message inside the chart container
    if (chartContainer) {
      chartContainer.innerHTML = `
        <div class="chart-empty" role="status" aria-live="polite"
             style="display:flex;align-items:center;justify-content:center;height:400px;color:#666;font-weight:600;">
          No data for selected day.
        </div>
      `;
    }

    if (showAlert) {
      // Only show OS alert when user pressed Filter
      alert("No data for selected day.");
    }

    if (chartStatus);
    return;
  }

  // Has data -> clear any empty-message and draw chart
  if (chartContainer) chartContainer.innerHTML = "";
  if (chartStatus);
  drawChart(parameterSelect.value, chartTypeSelect.value, dataToUse);
}

// Modified drawChart to accept a data array (defaults to xmlData)
function drawChart(parameter = "all", chartType = "line", dataArr = xmlData) {
  if (!chartContainer) return;

  // Ensure any previous empty-message or old chart is removed
  if (chart) {
    try { chart.destroy(); } catch (e) { /* ignore */ }
    chart = null;
  }
  chartContainer.innerHTML = "";

  const labels = dataArr.map(d => d.time);
  const colors = ["#078080", "#f45d48", "#4e9f3d", "#6a4c93", "#e4a788"];
  const params = ["light", "temperature", "humidity", "moisture", "ph"];

  const series =
    parameter === "all"
      ? params.map((p) => ({
        name: p.charAt(0).toUpperCase() + p.slice(1),
        data: dataArr.map(d => d[p])
      }))
      : [
        {
          name: parameter.charAt(0).toUpperCase() + parameter.slice(1),
          data: dataArr.map(d => d[parameter])
        }
      ];

  const options = {
    chart: {
      type: chartType,
      height: 400,
      background: "#f8f5f2",
    },
    series,
    colors,
    xaxis: { categories: labels },
    legend: { position: "top" },
  };

  chart = new ApexCharts(chartContainer, options);
  chart.render();

  updateAnalysis(parameter);
}

function updateHomeAverages(useYesterday = false) {
  if (!xmlData || xmlData.length === 0) {
    if (avgLightEl) avgLightEl.textContent = "—";
    if (avgTempEl) avgTempEl.textContent = "—";
    if (avgHumEl) avgHumEl.textContent = "—";
    if (avgMoistEl) avgMoistEl.textContent = "—";
    if (avgPHEl) avgPHEl.textContent = "—";
    if (todayCountEl) todayCountEl.textContent = "0";
    if (homeUpdatedEl) homeUpdatedEl.textContent = `No data available`;
    return;
  }

  // pick today or yesterday
  const d = new Date();
  if (useYesterday) {
    d.setDate(d.getDate() - 1); // go back one day
  }
  const key = d.toISOString().slice(0, 10);

  let rows = xmlData.filter(r => getDateKey(r.date) === key);
  rows = rows.slice(0, 24);

  const avg = arr => {
    if (!arr || arr.length === 0) return null;
    const sum = arr.reduce((s, v) => s + (Number(v) || 0), 0);
    return +(sum / arr.length).toFixed(2);
  };

  const lights = rows.map(r => r.light);
  const temps = rows.map(r => r.temperature);
  const hums = rows.map(r => r.humidity);
  const moists = rows.map(r => r.moisture);
  const phs = rows.map(r => r.ph);

  if (avgLightEl) avgLightEl.textContent = avg(lights) ?? "—";
  if (avgTempEl) avgTempEl.textContent = avg(temps) ?? "—";
  if (avgHumEl) avgHumEl.textContent = avg(hums) ?? "—";
  if (avgMoistEl) avgMoistEl.textContent = avg(moists) ?? "—";
  if (avgPHEl) avgPHEl.textContent = avg(phs) ?? "—";
  if (todayCountEl) todayCountEl.textContent = rows.length.toString();

  if (homeUpdatedEl) {
    homeUpdatedEl.textContent = useYesterday
      ? `Showing yesterday's data (${key})`
      : `Showing today's data (${key})`;
  }
}

function todayLocalISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

const today = todayLocalISO();