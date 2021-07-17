const cheerio = require('cheerio')
const fetch = require('node-fetch')
const fs = require('fs')
const d3 = require('d3')

const URL = 'https://data.giss.nasa.gov/gistemp/graphs/graph_data/Global_Mean_Estimates_based_on_Land_and_Ocean_Data/graph.txt'

async function pullHtml() {
  return new Promise(async (resolve, reject) => {
    fetch(URL)
      .then((res) => res.text())
      .then(resolve)
      .catch(reject)
  })
}

function parse(res) {
  const dsvString = res.split("\n").slice(5).join("\n").replace(/ {5}/g, "\t")
  const data = d3.tsvParse("Year\tNo_Smoothing\tLowess(5)\n" + dsvString).map(d => ({
    year: +d.Year,
    level: +d.No_Smoothing,
  }))

  return { unit: 'degrees', levels: data }
}

; (async () => {
  const html = await pullHtml()
  const json = parse(html)

  fs.writeFileSync(
    `${process.env.LOCATION || './src/data/'}temperature.json`,
    JSON.stringify(json)
  )
})()
