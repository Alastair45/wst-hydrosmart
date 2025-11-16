const toggleSidebar = document.getElementById("toggleSidebar");
const sidebar = document.getElementById("sidebar");
const btnTable = document.getElementById("btnTable");
const btnChart = document.getElementById("btnChart");
const parameterSelect = document.getElementById("parameterSelect");
const chartTypeSelect = document.getElementById("chartType");
const analysisText = document.getElementById("analysisText");
const chartContainer = document.getElementById("dataChart");

// buttons.js
document.addEventListener("DOMContentLoaded", () => {

  // Sidebar toggle
  const toggleSidebar = document.getElementById("toggleSidebar");
  const sidebar = document.getElementById("sidebar");

  toggleSidebar.addEventListener("click", () => {
    sidebar.classList.toggle("sidebar-visible");
    toggleSidebar.classList.toggle("active");
  });

  // Section buttons
  btnArticle.addEventListener("click", () => showSection("article-section"));
  btnTable.addEventListener("click", () => showSection("table-section"));
  btnChart.addEventListener("click", () => showSection("chart-section"));

  // Chart parameter changes
  parameterSelect.addEventListener("change", () => {
    if (chartReady) applyChartDateFilter();
  });

  chartTypeSelect.addEventListener("change", () => {
    if (chartReady) applyChartDateFilter();
  });

  // Table date filter buttons
  if (btnFilterDate) {
    btnFilterDate.addEventListener("click", () => applyDateFilter(true));
  }

  if (btnClearDate) {
    btnClearDate.addEventListener("click", () => {
      const today = new Date().toISOString().slice(0, 10);
      if (dateSelect) dateSelect.value = today;
      applyDateFilter(false);
    });
  }

  // Chart date filter buttons
  if (btnFilterChart) {
    btnFilterChart.addEventListener("click", () => applyChartDateFilter(true));
  }

  if (btnClearChart) {
    btnClearChart.addEventListener("click", () => {
      const today = new Date().toISOString().slice(0, 10);
      if (chartDateSelect) chartDateSelect.value = today;
      applyChartDateFilter(false);
    });
  }

});