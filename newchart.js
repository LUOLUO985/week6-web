const chartContainer = document.querySelector("#chart");
const statusText = document.querySelector("#status");

function setStatus(message) {
  statusText.textContent = message;
}

async function fetchSeries(areaCode, contentCode) {
  const data = await fetchJson(buildQuery(areaCode, contentCode));

  return {
    labels: labelsInOrder(data.dimension[DIM_YEAR]),
    values: data.value,
  };
}

async function showBirthsAndDeaths() {
  checkChartLibrary();

  const areaCode = localStorage.getItem("selectedAreaCode") || WHOLE_COUNTRY_CODE;
  const areaName = localStorage.getItem("selectedAreaName") || WHOLE_COUNTRY_NAME;

  setStatus("Loading births and deaths for " + areaName + "...");

  const [births, deaths] = await Promise.all([
    fetchSeries(areaCode, CONTENT_BIRTHS),
    fetchSeries(areaCode, CONTENT_DEATHS),
  ]);

  const chartData = {
    labels: births.labels,
    datasets: [
      {
        name: "Live births",
        values: births.values,
      },
      {
        name: "Deaths",
        values: deaths.values,
      },
    ],
  };

  chartContainer.innerHTML = "";

  new frappe.Chart("#chart", {
    title: "Births and deaths in " + areaName,
    data: chartData,
    type: "bar",
    height: 450,
    colors: ["#63d0ff", "#363636"],
    barOptions: {
      spaceRatio: 0.5,
    },
  });

  setStatus("Now showing births and deaths for " + areaName + " (" + areaCode + ").");
}

showBirthsAndDeaths().catch((error) => {
  console.error(error);
  setStatus("Loading failed: " + friendlyError(error));
});

