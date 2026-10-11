const inputArea = document.querySelector("#input-area");
const submitButton = document.querySelector("#submit-data");
const addDataButton = document.querySelector("#add-data");
const chartContainer = document.querySelector("#chart");
const statusText = document.querySelector("#status");

let chart = null;
let currentLabels = [];
let currentValues = [];
let currentAreaName = WHOLE_COUNTRY_NAME;

let nameToCode = new Map();
let codeToName = new Map();

function setStatus(message) {
  statusText.textContent = message;
}

function drawPopulationChart(labels, values, areaName) {
  checkChartLibrary();

  const chartData = {
    labels: labels,
    datasets: [
      {
        name: "Population - " + areaName,
        values: values,
      },
    ],
  };

  if (chart && typeof chart.destroy === "function") {
    chart.destroy();
  }
  chartContainer.innerHTML = "";

  chart = new frappe.Chart("#chart", {
    title: "Population of " + areaName,
    data: chartData,
    type: "line",
    height: 450,
    colors: ["#eb5146"],
    lineOptions: {
      hideDots: 1,
      regionFill: 0,
    },
  });
}

async function loadAreaCodes() {
  const res = await fetch(API_URL);
  if (!res.ok) {
    throw new Error("Could not load the list of municipalities (status " + res.status + ").");
  }

  const metadata = await res.json();
  const areaVariable = metadata.variables.find((v) => v.code === DIM_AREA);

  areaVariable.values.forEach((code, i) => {
    const name = areaVariable.valueTexts[i];
    nameToCode.set(name.trim().toLowerCase(), code);
    codeToName.set(code, name);
  });
}

function findAreaCode(name) {
  if (nameToCode.size === 0) return null;

  const key = name.trim().toLowerCase();
  return nameToCode.has(key) ? nameToCode.get(key) : null;
}

async function showPopulation(areaCode, areaName) {
  const data = await fetchJson(buildQuery(areaCode, CONTENT_POPULATION));

  currentLabels = labelsInOrder(data.dimension[DIM_YEAR]);
  currentValues = data.value.slice();
  currentAreaName = areaName;

  drawPopulationChart(currentLabels, currentValues, currentAreaName);
}

function predictNextValue(values) {
  if (values.length < 2) {
    return values[values.length - 1];
  }

  let sumOfDeltas = 0;
  for (let i = 1; i < values.length; i++) {
    sumOfDeltas += values[i] - values[i - 1];
  }
  const meanDelta = sumOfDeltas / (values.length - 1);

  return values[values.length - 1] + meanDelta;
}

function addPrediction() {
  if (currentValues.length === 0) return;

  const nextValue = predictNextValue(currentValues);
  const lastYear = Number(currentLabels[currentLabels.length - 1]);
  const nextYear = String(lastYear + 1);

  currentLabels.push(nextYear);
  currentValues.push(nextValue);

  drawPopulationChart(currentLabels, currentValues, currentAreaName);

  setStatus(
    "Added a prediction for " + nextYear + ": about " + Math.round(nextValue) + " people."
  );
}

submitButton.addEventListener("click", async (event) => {
  event.preventDefault();

  const typed = inputArea.value;
  const areaCode = findAreaCode(typed);

  if (areaCode === null) {
    setStatus(
      'No municipality named "' +
        typed +
        '" was found. Try the English or Finnish name, for example Helsinki, Espoo or Akaa.'
    );
    return;
  }

  const areaName = codeToName.get(areaCode);
  setStatus("Loading data for " + areaName + "...");

  try {
    await showPopulation(areaCode, areaName);

    localStorage.setItem("selectedAreaCode", areaCode);
    localStorage.setItem("selectedAreaName", areaName);

    setStatus("Now showing " + areaName + ".");
  } catch (error) {
    console.error(error);
    setStatus("Loading failed: " + friendlyError(error));
  }
});

addDataButton.addEventListener("click", () => {
  addPrediction();
});

async function init() {
  setStatus("Loading population data for the whole country...");

  try {
    await Promise.all([
      loadAreaCodes(),
      showPopulation(WHOLE_COUNTRY_CODE, WHOLE_COUNTRY_NAME),
    ]);
    setStatus("Data loaded. Type a municipality name and press Search to switch.");
  } catch (error) {
    console.error(error);
    setStatus("Loading failed: " + friendlyError(error));
  }
}

init();

