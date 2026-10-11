const API_URL = "https://statfin.stat.fi/PxWeb/api/v1/en/StatFin/synt/12dy.px";

const DIM_YEAR = "timeperiod_y";
const DIM_AREA = "alue_23_20260101";
const DIM_CONTENT = "contentscode";

const WHOLE_COUNTRY_CODE = "SSS";
const WHOLE_COUNTRY_NAME = "WHOLE COUNTRY";
const CONTENT_POPULATION = "synt-vaesto";
const CONTENT_BIRTHS = "synt-vm01";
const CONTENT_DEATHS = "synt-vm11";

const YEARS = [];
for (let year = 2000; year <= 2021; year++) {
  YEARS.push(String(year));
}

function buildQuery(areaCode, contentCode) {
  return {
    query: [
      {
        code: DIM_YEAR,
        selection: {
          filter: "item",
          values: YEARS,
        },
      },
      {
        code: DIM_AREA,
        selection: {
          filter: "item",
          values: [areaCode],
        },
      },
      {
        code: DIM_CONTENT,
        selection: {
          filter: "item",
          values: [contentCode],
        },
      },
    ],
    response: {
      format: "json-stat2",
    },
  };
}

async function fetchJson(query) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(query),
  });

  if (!res.ok) {
    throw new Error("The API request failed with status " + res.status + ".");
  }

  return res.json();
}

function labelsInOrder(dimension) {
  const index = dimension.category.index;
  const label = dimension.category.label;

  return Object.keys(index)
    .sort((a, b) => index[a] - index[b])
    .map((key) => label[key]);
}

function checkChartLibrary() {
  if (typeof frappe === "undefined") {
    throw new Error(
      "The Frappe-chart library did not load. Check that unpkg.com can be reached, then reload the page."
    );
  }
}

function friendlyError(error) {
  const message = String(error && error.message ? error.message : error);

  if (/Failed to fetch|Load failed|NetworkError/i.test(message)) {
    return (
      message +
      " This is usually a network problem. If you opened this page straight from" +
      " the file system, the browser may block the request. Serve the folder with" +
      ' "python3 -m http.server" and open it through localhost instead.'
    );
  }

  return message;
}

(function fixNavigationLinksWhenOpenedAsFile() {
  if (location.protocol !== "file:") return;

  document.querySelectorAll("a#navigation").forEach((link) => {
    const href = link.getAttribute("href");
    if (href && href.startsWith("/")) {
      link.setAttribute("href", href.slice(1));
    }
  });
})();

