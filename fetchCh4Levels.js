const cheerio = require('cheerio')
const fetch = require('node-fetch')
const fs = require('fs')

const CH4_LEVEL_URL =
  'https://gml.noaa.gov/webdata/ccgg/trends/ch4/ch4_mm_gl.txt'

async function pullData() {
  return new Promise(async (resolve, reject) => {
    fetch(CH4_LEVEL_URL)
      .then((res) => res.text())
      .then(resolve)
      .catch(reject)
  })
}

function parse(text) {
  // remove comment lines, standardize number of spaces, split by line
  let data = text.replace(/^#.*/gm, '').replace(/ {2,}/g, ' ').split('\n')

  // split each line by spaces, then put each value into a JSON object
  let result = data
    .filter((o) => o.split(' ').length > 1)
    .map((o) => {
      let split = o.split(' ')
      return { year: +split[1], month: +split[2], level: +split[4], min: +split[4] - 7, max: +split[4] + 7 }
    })

  return { unit: 'ppb', levels: result }
}

; (async () => {
  const raw = await pullData()
  const json = parse(raw)

  fs.writeFileSync(
    `${process.env.LOCATION || './src/data/'}ch4_levels.json`,
    JSON.stringify(json)
  )
})()
