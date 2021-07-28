const cheerio = require('cheerio')
const fetch = require('node-fetch')
const fs = require('fs')

const SEA_LEVEL_URL = 'https://climate.nasa.gov/vital-signs/sea-level/'

async function pullHtml() {
  return new Promise(async (resolve, reject) => {
    fetch(SEA_LEVEL_URL)
      .then((res) => res.text())
      .then(resolve)
      .catch(reject)
  })
}

function parse(html) {
  const $ = cheerio.load(html)

  const latestMeasurement = $('.latest_measurement .value')
    .contents()
    .get(0)
    .nodeValue.trim()

  const uncertainty = $('.latest_measurement .value .error')
    .contents()
    .get(0)
    .nodeValue.trim()
    .match(/([0-9.])+/g)[0]

  const script = $('.graph_container').prev().html()
  const chartExtract = script
    .match(/var data = charts\.createData.*/gi)[0]
    .replace('var data = charts.createData("SeaLevel",', '')
    .replace(', "mm");', '')
  const chartData = JSON.parse(chartExtract).map((o) => {
    const { month, day, year, x, y } = o
    return {
      month: +month,
      day: +day,
      year: +year,
      year_fraction: +x,
      level: +y,
      min: +y - +uncertainty,
      max: +y + +uncertainty,
    }
  })

  return { unit: 'mm', levels: chartData }
}

; (async () => {
  const html = await pullHtml()
  const json = parse(html)

  fs.writeFileSync(
    `${process.env.LOCATION || './src/data/'}sea_levels.json`,
    JSON.stringify(json)
  )
})()
