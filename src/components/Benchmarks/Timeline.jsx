import React, { useMemo } from "react";
import uniqueId from "lodash/uniqueId";
import { scaleLinear, scaleTime, extent, line, area, curveMonotoneX, curveStep } from "d3"
import { useChartDimensions } from "../../utils";
import "./Timeline.css";

const Timeline = ({ data, xAccessor, yAccessor }) => {
  const [ref, dms] = useChartDimensions();
  const deltaHeight = 20
  const timelineId = useMemo(() => uniqueId(), [])

  const deltaAccessor = (d, i) => data[i - 1] && (yAccessor(d, i) - yAccessor(data[i - 1])) / (xAccessor(d, i) - xAccessor(data[i - 1]))

  const { lineD, areaD, deltaZero, lineDeltaD, areaDeltaD, xTicks, yearsExtent } = useMemo(() => {
    const xExtent = extent(data, xAccessor)
    const yearsExtent = xExtent.map(x => x.getFullYear())
    const xScale = scaleTime()
      .domain(xExtent)
      .range([0, dms.width])

    const numberOfDecades = Math.floor((yearsExtent[1] - yearsExtent[0]) / 10)
    const xTicks = xScale.ticks(numberOfDecades).map(d => ([xScale(d), d.getFullYear()]))

    const yExtent = extent(data, yAccessor)
    const yScale = scaleLinear()
      // .domain(extent(data, yAccessor))
      .domain(yExtent[0] > 0 ? [0, extent(data, yAccessor)[1]] : yExtent)
      .range([dms.height, 0])

    const deltaScale = scaleLinear()
      .domain(extent(data, deltaAccessor))
      .range([deltaHeight, 0])

    const lineD = line()
      .x(d => xScale(xAccessor(d)))
      .y(d => yScale(yAccessor(d)))
      .curve(curveMonotoneX)(data)

    const areaD = area()
      .x(d => xScale(xAccessor(d)))
      .y0(yScale(0))
      .y1(d => yScale(yAccessor(d)))
      .curve(curveMonotoneX)(data)

    const lineDeltaD = area()
      .x(d => xScale(xAccessor(d)))
      .y((d, i) => deltaScale(deltaAccessor(d, i + 1)))
      .curve(curveStep)(data.slice(1))

    const deltaZero = deltaScale(0)
    const areaDeltaD = area()
      .x(d => xScale(xAccessor(d)))
      .y0(deltaZero)
      .y1((d, i) => deltaScale(deltaAccessor(d, i + 1)))
      .curve(curveStep)(data.slice(1))

    return { lineD, areaD, deltaZero, lineDeltaD, areaDeltaD, xTicks, yearsExtent }
  }, [dms, data, xAccessor, yAccessor])

  return (
    <div className="Timeline">
      <div className="Timeline__wrapper" ref={ref}>
        <svg width={dms.width} height={dms.height}>
          <path d={lineD} className="Timeline__line" />
          <path d={areaD} className="Timeline__area" />
        </svg>
        <div className="Timeline__x-ticks">
          {xTicks.map(([offset, year]) => (
            <div key={year} className="Timeline__x-tick" style={{
              transform: `translateX(${offset}px)`
            }} />
          ))}
        </div>
      </div>
      <div className="Timeline__x">
        {yearsExtent.map(year => <div key={year} className="Timeline__year">{year}</div>)}
      </div>
      <svg width={dms.width} height={deltaHeight} className="Timeline__delta">
        <defs>
          <linearGradient id={`Timeline__line-gradient--${timelineId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0" stopColor="transparent" />
            <stop offset={(deltaZero * 100 / deltaHeight) + "%"} stopColor="transparent" />
            <stop offset={(deltaZero * 100 / deltaHeight) + "%"} stopColor="#afb9c5" />
            <stop offset="100%" stopColor="#afb9c5" />
          </linearGradient>
        </defs>
        <path d={lineDeltaD} fill="var(--accent-2)" stroke="var(--accent-2)" />
        <path d={areaDeltaD} fill="var(--accent-2)" />
        <path d={lineDeltaD} fill={`url(#Timeline__line-gradient--${timelineId})`} stroke={`url(#Timeline__line-gradient--${timelineId})`} />
        <path d={areaDeltaD} fill={`url(#Timeline__line-gradient--${timelineId})`} />
      </svg>
    </div>
  )
}

export default Timeline