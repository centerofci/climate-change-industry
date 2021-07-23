import seaLevelData from "./../../data/sea_levels.json"
import co2Data from "./../../data/co2_levels.json"
import ch4Data from "./../../data/ch4_levels.json"
import tempData from "./../../data/temperature.json"

export const benchmarkData = { seaLevels: seaLevelData, co2: co2Data, ch4: ch4Data, temp: tempData };

export const benchmarkInfo = {
  seaLevels: {
    name: "Sea Level Rise",
    source: "NASA",
    sourceUrl: "https://climate.nasa.gov/vital-signs/sea-level/",
  },
  co2: {
    name: "Atmospheric CO2 levels",
    source: "NASA",
    sourceUrl: "https://climate.nasa.gov/vital-signs/carbon-dioxide/",
  },
  ch4: {
    name: "Atmospheric methane levels",
    source: "NOAA",
    sourceUrl: "https://gml.noaa.gov/ccgg/trends_ch4/",
    fact: "Methane will trap 84x more heat than the same amount of CO2 would over a 20 year time period."
  },
  temp: {
    name: "Global Temperature Rise",
    source: "NASA",
    sourceUrl: "https://climate.nasa.gov/vital-signs/global-temperature/",
    fact: "If the climate stabilizes at 2C above pre-industrial levels, over 40% of current permafrost could melt. Stabilizing at 1.5C instead of 2C would save ~2 million square kilometers of permafrost."
  }
}