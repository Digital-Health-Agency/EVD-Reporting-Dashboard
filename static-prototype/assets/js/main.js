(function () {
  const DATA = window.DASHBOARD_DATA;

  const fmt = (n) => (typeof n === "number" ? n.toLocaleString() : "--");
  const pct = (n) => `${(n * 100).toFixed(1)}%`;
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };
  const splitText = (obj) => `M ${fmt(obj.male)} | F ${fmt(obj.female)}`;

  function renderMeta() {
    const updated = new Date(DATA.meta.lastUpdated);
    setText(
      "lastUpdated",
      `Last updated: ${updated.toLocaleString("en-KE", {
        dateStyle: "medium",
        timeStyle: "short",
      })}`
    );
    setText("reportingPeriod", DATA.meta.reportingPeriod);
    setText("daysSinceLastCase", DATA.meta.daysSinceLastCase);
    const affected = DATA.counties.filter((c) => c.confirmed > 0).length;
    setText("countiesAffected", `${affected} of ${DATA.counties.length}`);
  }

  function renderKPIs() {
    const s = DATA.summary;

    setText("kpiConfirmed", fmt(s.confirmedCasesTotal.total));
    setText("kpiConfirmedSplit", splitText(s.confirmedCasesTotal));

    setText("kpiNewConfirmed", fmt(s.newConfirmed24h.total));
    setText("kpiNewConfirmedSplit", splitText(s.newConfirmed24h));

    setText("kpiAdmitted", fmt(s.currentlyAdmitted.total));
    setText("kpiAdmittedSplit", splitText(s.currentlyAdmitted));

    setText("kpiDeaths", fmt(s.totalDeaths.total));
    setText("kpiDeathsSplit", splitText(s.totalDeaths));

    setText("kpiNewDeaths", fmt(s.newDeaths24h.total));
    setText("kpiNewDeathsSplit", splitText(s.newDeaths24h));

    setText("kpiRecoveries", fmt(s.totalRecoveries.total));
    setText("kpiRecoveriesSplit", splitText(s.totalRecoveries));

    setText("kpiCFR", pct(s.caseFatalityRate));

    setText("kpiSuspected", fmt(s.suspectedCases.total));
    setText("kpiSuspectedSplit", splitText(s.suspectedCases));
  }

  function renderPOE() {
    const p = DATA.pointsOfEntry;
    setText("poeScreened", fmt(p.screened));
    setText("poeSuspected", fmt(p.suspectedCases));
    setText("poeContacts", splitText(p.contactsListed));

    const list = document.getElementById("poeEntryList");
    list.innerHTML = "";
    p.byEntryPoint
      .slice()
      .sort((a, b) => b.screened - a.screened)
      .forEach((ep) => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${ep.name}</span><span>${fmt(
          ep.screened
        )} screened &middot; ${fmt(ep.suspected)} suspected</span>`;
        list.appendChild(li);
      });
  }

  function renderContactTracing() {
    const hf = DATA.healthFacilities;
    const comm = DATA.community;

    setText("hfContactsListed", splitText(hf.contactsListed) + ` (Total ${fmt(hf.contactsListed.total)})`);
    setText("hfContactsFollowedUp", splitText(hf.contactsFollowedUp) + ` (Total ${fmt(hf.contactsFollowedUp.total)})`);

    const rate = hf.contactsFollowedUp.total / hf.contactsListed.total;
    setText("hfFollowUpRate", pct(rate));
    document.getElementById("followUpProgressBar").style.width = pct(rate);

    setText("commContactsTraced", splitText(comm.contactsTraced) + ` (Total ${fmt(comm.contactsTraced.total)})`);
  }

  function renderCommunity() {
    const c = DATA.community;
    setText("commSignals", fmt(c.signalsGenerated));
    setText("commVerified", `${fmt(c.verifiedSignalsLinked.total)} (${splitText(c.verifiedSignalsLinked)})`);
    setText("commVerifiedRate", pct(c.verifiedSignalsLinked.total / c.signalsGenerated));
    setText("commTracedSplit", splitText(c.contactsTraced));
  }

  function renderLabs() {
    const l = DATA.labs;
    setText("labTests", fmt(l.testsDone));
    setText("labPositive", fmt(l.positiveTests));
    setText("labNegative", fmt(l.negativeTests));
    setText("labPositivity", pct(l.positiveTests / l.testsDone));
    setText("labTAT", `${l.turnaroundTimeHrs} hrs`);
  }

  function renderCountyFilter() {
    const select = document.getElementById("countyFilter");
    DATA.counties.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.county;
      opt.textContent = c.county;
      select.appendChild(opt);
    });
  }

  function renderCountyTable(filterCounty) {
    const tbody = document.querySelector("#countyTable tbody");
    tbody.innerHTML = "";
    const rows = DATA.counties.filter(
      (c) => filterCounty === "all" || c.county === filterCounty
    );
    rows.forEach((c) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${c.county}</td>
        <td>${fmt(c.suspected)}</td>
        <td>${fmt(c.confirmed)}</td>
        <td>${fmt(c.admitted)}</td>
        <td>${fmt(c.deaths)}</td>
        <td>${fmt(c.recoveries)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  let trendChart, sexChart, countyChart;

  function renderTrendChart(period) {
    const ctx = document.getElementById("trendChart");
    let labels = DATA.trend.map((d) =>
      new Date(d.date).toLocaleDateString("en-KE", { month: "short", day: "numeric" })
    );

    let suspected = DATA.trend.map((d) => d.suspected);
    let confirmed = DATA.trend.map((d) => d.confirmed);
    let deaths = DATA.trend.map((d) => d.deaths);
    let recoveries = DATA.trend.map((d) => d.recoveries);

    if (period === "cumulative") {
      const cumulate = (arr) => {
        let running = 0;
        return arr.map((v) => (running += v));
      };
      suspected = cumulate(suspected);
      confirmed = cumulate(confirmed);
      deaths = cumulate(deaths);
      recoveries = cumulate(recoveries);
    } else if (period === "24h") {
      labels = labels.slice(-1);
      suspected = suspected.slice(-1);
      confirmed = confirmed.slice(-1);
      deaths = deaths.slice(-1);
      recoveries = recoveries.slice(-1);
    }

    const datasets = [
      { label: "Suspected", data: suspected, borderColor: "#8a8f98", backgroundColor: "transparent", tension: 0.3 },
      { label: "Confirmed", data: confirmed, borderColor: "#0b5e6c", backgroundColor: "transparent", tension: 0.3 },
      { label: "Deaths", data: deaths, borderColor: "#b3261e", backgroundColor: "transparent", tension: 0.3 },
      { label: "Recoveries", data: recoveries, borderColor: "#146c43", backgroundColor: "transparent", tension: 0.3 },
    ];

    if (trendChart) trendChart.destroy();
    trendChart = new Chart(ctx, {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  function renderSexChart() {
    const ctx = document.getElementById("sexChart");
    const s = DATA.summary.confirmedCasesTotal;
    if (sexChart) sexChart.destroy();
    sexChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Male", "Female"],
        datasets: [
          {
            data: [s.male, s.female],
            backgroundColor: ["#0b5e6c", "#e07a5f"],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } },
      },
    });
  }

  function renderCountyChart(filterCounty) {
    const ctx = document.getElementById("countyChart");
    const rows = DATA.counties.filter(
      (c) => filterCounty === "all" || c.county === filterCounty
    );
    if (countyChart) countyChart.destroy();
    countyChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: rows.map((c) => c.county),
        datasets: [
          { label: "Confirmed", data: rows.map((c) => c.confirmed), backgroundColor: "#0b5e6c" },
          { label: "Deaths", data: rows.map((c) => c.deaths), backgroundColor: "#b3261e" },
          { label: "Recoveries", data: rows.map((c) => c.recoveries), backgroundColor: "#146c43" },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  function bindFilters() {
    document.getElementById("periodFilter").addEventListener("change", (e) => {
      renderTrendChart(e.target.value);
    });
    document.getElementById("countyFilter").addEventListener("change", (e) => {
      renderCountyTable(e.target.value);
      renderCountyChart(e.target.value);
    });
  }

  function init() {
    renderMeta();
    renderKPIs();
    renderPOE();
    renderContactTracing();
    renderCommunity();
    renderLabs();
    renderCountyFilter();
    renderCountyTable("all");
    renderTrendChart("7d");
    renderSexChart();
    renderCountyChart("all");
    bindFilters();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
