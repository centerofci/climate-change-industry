import React, { useMemo, useRef, useCallback, useState } from "react";
import { scaleLinear } from "d3-scale";
import { range } from "d3-array";

import { moveCentered, useChartDimensions } from "./../../utils";

import "./MissionsTimeline.css";

const MissionsTimeline = ({ currentYear, yearRange = [], onChange }) => {
  const [ref, dms] = useChartDimensions();
  const [hoveredYear, setHoveredYear] = useState(null);
  const isDragging = useRef(false);

  const xScale = useMemo(() => {
    return scaleLinear().domain(yearRange).range([0, dms.width]);
  }, [yearRange.join("-"), dms.width]);

  const years = useMemo(() => {
    return range(yearRange[0], yearRange[1] + 1, 1);
  }, [yearRange.join("-"), dms.width]);

  const yearTicks = useMemo(() => {
    let runningYear = 0;
    return [
      yearRange[0],
      ...range(Math.ceil(yearRange[0] / 10) * 10, yearRange[1] + 10, 10),
      yearRange[1],
    ].filter((d) => {
      const isTooClose = d - runningYear < 6;
      runningYear = d;
      return !isTooClose;
    });
  }, [yearRange.join("-"), dms.width]);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    window.removeEventListener("mouseup", onMouseUp);
    window.removeEventListener("keydown", onKeyDown);
  }, []);

  const onKeyDown = useCallback((e) => {
    if (e.key !== "Escape") return;
    isDragging.current = false;
    window.removeEventListener("mouseup", onMouseUp);
    window.removeEventListener("keydown", onKeyDown);
  }, []);

  const onMouseDown = (e) => {
    const x = e.clientX - ref.current.getBoundingClientRect().left;
    const year = Math.round(xScale.invert(x));
    onChange(year);
    isDragging.current = true;
  };

  const onMouseMove = (e) => {
    const x = e.clientX - ref.current.getBoundingClientRect().left;
    const year = Math.round(xScale.invert(x));
    setHoveredYear(year);
    if (!isDragging.current) return;
    onChange(year);

    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("keydown", onKeyDown);
  };

  return (
    <div
      className="MissionsTimeline"
      ref={ref}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
      onMouseLeave={() => setHoveredYear(null)}
    >
      {years.map((year) => (
        <div
          key={year}
          className={`MissionsTimeline__year MissionsTimeline__year--is-${
            currentYear === year ? "active" : ""
          }`}
          style={moveCentered(xScale(year))}
        >
          {yearTicks.includes(year) && Math.abs(currentYear - year) > 2 && (
            <div className="MissionsTimeline__label">{year}</div>
          )}
        </div>
      ))}
      {hoveredYear && hoveredYear !== currentYear && (
        <div
          className="MissionsTimeline__hovered-year"
          style={moveCentered(xScale(hoveredYear))}
        >
          <div className="MissionsTimeline__label">{hoveredYear}</div>
        </div>
      )}
      <div
        className="MissionsTimeline__marker"
        style={moveCentered(xScale(currentYear))}
      >
        <div className="MissionsTimeline__label">{currentYear}</div>
      </div>
    </div>
  );
};

export default MissionsTimeline;
