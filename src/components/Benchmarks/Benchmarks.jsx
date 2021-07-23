import React from "react";
import { timeFormat } from "d3"
import { benchmarkData, benchmarkInfo } from "./constants"
import { getOrdinal } from "./../../utils"
import Timeline from "./Timeline"
import "./Benchmarks.css"

const xAccessor = d => new Date([d.month || 1, d.day || 1, d.year].join("/"))
const yAccessor = d => d.level
const yMinAccessor = d => d.min || d.level
const yMaxAccessor = d => d.max || d.level
const Benchmarks = ({ data }) => {
  console.log(benchmarkData)
  console.log(data)
  const benchmarks = Object.keys(benchmarkData)
  console.log(benchmarks)

  const formatDate = d => [
    timeFormat("%B %-d")(d),
    getOrdinal(d.getDate(d)),
    timeFormat(", %Y")(d),
  ].join("")
  const getDate = d => formatDate(xAccessor(d))

  return (
    <div className="Benchmarks">
      <h1>Earth Health KPIs</h1>
      <div className="Benchmarks__grid">
        {benchmarks.map(benchmarkName => {
          const data = benchmarkData[benchmarkName].levels
          const latestValue = data[data.length - 1]
          const info = benchmarkInfo[benchmarkName]
          return (
            <div className="Benchmarks__card" key={benchmarkName}>
              <div className="Benchmarks__card__top">
                <h2>{info.name}</h2>
                <div className="Benchmarks__card__top__value">
                  <div className="Benchmarks__value">
                    {latestValue.level.toLocaleString()} {benchmarkData[benchmarkName].unit}
                  </div>
                </div>
              </div>
              <div className="Benchmarks__chart">
                <Timeline data={data} xAccessor={xAccessor} yAccessor={yAccessor} yMinAccessor={yMinAccessor} yMaxAccessor={yMaxAccessor} />
              </div>
              <div className="Benchmarks__note">
                <div>Last updated: {getDate(latestValue)}</div>
                <div>Data from <a href={info.sourceUrl}>{info.source}</a></div>
              </div>
              <div className="Benchmarks__fact">
                {info.fact}
              </div>
            </div>
          )
        })}

        <div className="Benchmarks__card Benchmarks__card--metrics">
          <h2>Extreme weather</h2>
          <div className="Benchmarks__metric-row">
            <div>
              Climate-related disasters in the past 20 years, <em>compared to the previous 20-year period</em>
            </div>
            <div className="Benchmarks__value">
              +83%
            </div>
          </div>
          <div className="Benchmarks__metric-row">
            <div>
              Change in number of wildfires in California <em>since the early 1970s</em>
            </div>
            <div className="Benchmarks__value">
              +500%
            </div>
          </div>
          <div className="Benchmarks__note">
            <div>Data from <a href="https://e360.yale.edu/digest/extreme-weather-events-have-increased-significantly-in-the-last-20-years">the Yale School of the Environment</a> & <a href="https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2019EF001210">AGU</a></div>
          </div>
          <div className="Benchmarks__fact">
          </div>
        </div>
        <div className="Benchmarks__card Benchmarks__card--metrics">
          <h2>Global forest area</h2>
          <div className="Benchmarks__metric-row">
            <div>
              Change in forest area <em>per year</em> (past 5 years)
            </div>
            <div className="Benchmarks__value">
              -0.12%
            </div>
          </div>
          <div className="Benchmarks__metric-row">
            <div>
              Change in forest area <em>in the past 20 years</em>
            </div>
            <div className="Benchmarks__value">
              -6.3%
            </div>
          </div>
          <div className="Benchmarks__metric-row">
            <div>
              Change in tree cover in <em>2020</em>
            </div>
            <div className="Benchmarks__value">
              -25.8 Mha
            </div>
          </div>
          <div className="Benchmarks__note">
            <div>Data from <a href="http://www.fao.org/forest-resources-assessment/en/">the Food and Agriculture Organization of the UN</a> & <a href="https://www.globalforestwatch.org/dashboards/global/">Global Forest Watch</a></div>
          </div>
          <div className="Benchmarks__fact">
          </div>
        </div>

      </div>
    </div>
  )
}

export default Benchmarks