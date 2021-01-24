require("dotenv").config({
  path: ".env.local",
});
const { timeParse } = require("d3");
const fs = require("fs");
const d3TimeFormat = require("d3-time-format");
const fetch = require("node-fetch");

const apiUrlBase = "https://api.airtable.com/v0/";
const airtableBaseKey = "appm79HVYtbuke7SO";
const getApiUrl = (base) =>
  apiUrlBase +
  airtableBaseKey +
  `/${base.replace(/\//g, "%2F")}` +
  `?api_key=${process.env.AIRTABLE_API_KEY}`;

const bases = ["Interventions", "Investments", "Actors", "Regulations"];

const init = async () => {
  let rawData = {};
  let data = {};
  let nameMaps = {};
  for (const base of bases) {
    const res = await grabDataForBase(base);
    rawData[base] = res;
    nameMaps[base] = fromPairs(
      res["records"].map((d) => [
        d["id"],
        d["fields"]["Intervention"] ||
          d["fields"]["Entry Name"] ||
          d["fields"]["Entity"] ||
          d["fields"]["Regulation Name"],
      ])
    );
  }

  console.log("processing data");

  for (const base of bases) {
    data[base] = parseData(rawData[base], base, nameMaps);
  }

  console.log("we all good!");

  fs.writeFileSync(
    "./src/data.json",
    JSON.stringify(
      data,
      // {
      //   Missions: data["Missions"],
      //   "Instruments/Payloads": data["Instruments/Payloads"],
      //   Objectives: data["Objectives"],
      //   Investigations: data["Investigations"],
      // },
      null,
      2
    )
  );
};

init();

async function grabDataForBase(base) {
  const url = getApiUrl(base);
  console.log("fetching data for", base);
  let res = await asyncFetch(url);
  await sleep(300); // airtable's api limits us to 5 requests / second

  let iteration = 0;
  while (res["offset"] && iteration < 10) {
    const moreData = await grabMoreData(url, res["offset"]);
    res["offset"] = moreData["offset"];
    res["records"] = [...res["records"], ...moreData["records"]];
    iteration++;
  }

  return res;
}

async function grabMoreData(url, offset) {
  console.log("fetching more data for", url);
  const res = await asyncFetch(url + "&offset=" + offset);
  await sleep(300); // airtable's api limits us to 5 requests / second
  return res;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function asyncFetch(url) {
  return new Promise(async (resolve, reject) => {
    fetch(url)
      .then((res) => res.json())
      .then(resolve)
      .catch(reject);
  });
}

const statuses = [
  "Cancelled",
  "Unsuccessful",
  "Partial success",
  "Successful",
  "Active",
  "Planned",
];

const dataFunctions = {
  Interventions: (d) => ({
    ...d,
    id: d["Intervention"] && `Interventions--${d["Intervention"]}`,
    label: d["Intervention"],
  }),
  Investments: (d) => ({
    ...d,
    id: d["Entry Name"] && `Investments--${d["Entry Name"]}`,
    label: d["Entry Name"],
    date: timeParse("%Y-%m-%d")(d["Date"]),
  }),
  Actors: (d) => ({
    ...d,
    id: d["Entity"] && `Actors--${d["Entity"]}`,
    label: d["Entity"],
    year: +d["Year founded / Born"],
  }),
  Regulations: (d) => ({
    ...d,
    id: d["Regulation Name"] && `Regulations--${d["Regulation Name"]}`,
    label: d["Regulation Name"],
  }),
};
const fieldToTableNameMap = {
  "Associated Investments": "Investments",
  "Associated Regulations": "Regulations",
  "Enacted/Undertaken By": "Actors",
  "Funded by": "Actors",
  Source: "Actors",
  Recipient: "Actors",
  "Intervention(s) being addressed:": "Actors",
  "Directly Associated Orgs (e.g., employment/parent org):": "Actors",
  "Partners With": "Actors",
  "Enacting/Undertaking XYZ Interventions": "Interventions",
  "Funding XYZ Interventions": "Interventions",
  "Made XYZ Investment(s)": "Investments",
  "Received XYZ Investment(s)": "Investments",
  "Impacts the Following Interventions": "Interventions",
  // "Missions 2": "Missions",
  // Actor: "Actors",
  // "LEAG-LER ISRU Investigations": "LEAG-LER",
  // Technologies: "Instruments/Payloads",
  // "Technologies/Payload": "Instruments/Payloads",
  // Objective: "Objectives",
};
function parseData(rawData, base, nameMaps = {}) {
  const data = (rawData["records"] || []).map((d) => d["fields"]);

  const dataWithAllRecords = [...data].map((d) => {
    const fields = Object.keys(d);
    fields.forEach((field) => {
      const value = d[field];
      if (!nameMaps[fieldToTableNameMap[field] || field]) return;
      if (!Array.isArray(value)) return;

      const areRecords = value[0] && value[0].startsWith("rec");
      if (!areRecords) return;

      const valueNames = value.map(
        (id) => nameMaps[fieldToTableNameMap[field] || field][id]
      );
      d[field] = valueNames;
    });
    return d;
  });

  return dataWithAllRecords.map(dataFunctions[base]).filter((d) => d["id"]);
}

function parseStatus(str) {
  if (!str) return "";

  const lowerStr = str.toLowerCase();
  const matchingStatuses = statuses.filter((d) =>
    lowerStr.includes(d.toLowerCase())
  );
  let status = matchingStatuses[0];
  if (!status) {
    status = lowerStr.includes("partial")
      ? "Partial success"
      : lowerStr.includes("unsuccess")
      ? "Unsuccessful"
      : lowerStr.includes("success")
      ? "Successful"
      : lowerStr.includes("completed")
      ? "Successful"
      : lowerStr;
  }
  return status;
}

function yearAccessor(d) {
  if (!d) return null;
  const year = d.split(/[ \/]/g).slice(-1)[0];
  return year.length == 4 ? year : null;
}

function formatYear(date) {
  return d3TimeFormat.timeFormat("%Y")(date);
}

function fromPairs(arr) {
  let res = {};
  arr.forEach((d) => {
    res[d[0]] = d[1];
  });
  return res;
}
