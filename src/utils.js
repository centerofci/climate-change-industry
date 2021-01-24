import { useEffect, useRef, useState } from "react";
import { format } from "d3-format";
import { timeParse } from "d3-time-format";

export const move = (x, y = 0, isAttr = false) => ({
  transform: `translate(${x}${isAttr ? "" : "px"}, ${y}${isAttr ? "" : "px"})`,
});

export const moveCentered = (x, y = 0) => ({
  transform: `translate(calc(${x}px - 50%), calc(${y}px - 50%))`,
});

export const moveTooltip = (x, y = 0) => ({
  transform: `translate(calc(${x}px - 50%), calc(${y}px - 100%))`,
});

export const getSpiralPositions = (
  n = 100,
  pointRadius = 5,
  angleDiff = 2,
  distance = 1.5
) => {
  let angle = 0;
  let points = new Array(n).fill(0).map((_, i) => {
    const radius = Math.sqrt(i + 0.6) * pointRadius * distance;
    angle += Math.asin(1 / radius) * pointRadius * angleDiff;
    angle = angle % (Math.PI * 2);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return {
      x: i ? x : x * 0.3,
      y: i ? y : y * 1,
      angle,
      r: radius,
    };
  });
  // let firstPoint = points[0];
  return points.map((d, i) => ({
    ...d,
    // x: d["x"] - firstPoint["x"],
    // y: d["y"] - firstPoint["y"],
    centerX:
      (Math.min(...points.slice(0, i).map((d) => d["x"])) +
        Math.max(...points.slice(0, i).map((d) => d["x"]))) /
      2,
    centerY:
      (Math.min(...points.slice(0, i).map((d) => d["y"])) +
        Math.max(...points.slice(0, i).map((d) => d["y"]))) /
      2,
  }));
};

let runningId = 0;
export const getUniqueId = () => {
  runningId++;
  return runningId;
};

export const flatten = (arr) => arr.reduce((a, b) => [...a, ...b], []);

export const getPointFromAngleAndDistance = (angle, distance) => ({
  x: Math.cos((angle * Math.PI) / 180) * distance,
  y: Math.sin((angle * Math.PI) / 180) * distance,
});

export const getAngleFromPoints = (p1, p2) =>
  Math.atan2(p1.y - p2.y, p1.x - p2.x) * (180 / Math.PI);

export const getAngleFromRadiusAndDistance = (r, distance) =>
  Math.atan(distance / (2 * r)) * 2 * (180 / Math.PI);

export const sum = (arr) => arr.reduce((a, b) => a + b, 0);

export const getDistanceFromXY = ([x, y]) =>
  Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));

export const getNumberWithUnits = (d, numDecimals = 1) => {
  const siUnits = Math.floor((d / 10).toFixed(0).toString().length);
  return siUnits >= 15
    ? format(`.${numDecimals}f`)(d / 1000000000000000) + " quadrillion"
    : siUnits >= 12
    ? format(`.${numDecimals}f`)(d / 1000000000000) + " trillion"
    : siUnits >= 9
    ? format(`.${numDecimals}f`)(d / 1000000000) + " billion"
    : siUnits >= 6
    ? format(`.${numDecimals}f`)(d / 1000000) + " million"
    : siUnits >= 3
    ? format(`.${numDecimals}f`)(d / 1000) + " thousand"
    : d < 0.001
    ? 0
    : d < 0.1
    ? format(`,.2f`)(d)
    : format(`,.02f`)(d);
};

// grabbed from https://gist.github.com/callumlocke/cc258a193839691f60dd
export const scaleCanvas = (canvas, context, width, height) => {
  // assume the device pixel ratio is 1 if the browser doesn't specify it
  const devicePixelRatio = window.devicePixelRatio || 1;

  // determine the 'backing store ratio' of the canvas context
  const backingStoreRatio =
    context.webkitBackingStorePixelRatio ||
    context.mozBackingStorePixelRatio ||
    context.msBackingStorePixelRatio ||
    context.oBackingStorePixelRatio ||
    context.backingStorePixelRatio ||
    1;

  // determine the actual ratio we want to draw at
  const ratio = devicePixelRatio / backingStoreRatio;

  if (devicePixelRatio !== backingStoreRatio) {
    // set the 'real' canvas size to the higher width/height
    canvas.width = width * ratio;
    canvas.height = height * ratio;

    // ...then scale it back down with CSS
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
  } else {
    // this is a normal 1:1 device; just scale it simply
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = "";
    canvas.style.height = "";
  }

  // scale the drawing context so everything will work at the higher ratio
  context.scale(ratio, ratio);
};

// from https://davidwalsh.name/javascript-debounce-function
// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
export const debounce = (func, wait, immediate) => {
  var timeout;
  return function () {
    var context = this,
      args = arguments;
    var later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

export const getDomainNameFromUrl = (url) => {
  var hostname;
  //find & remove protocol (http, ftp, etc.) and get hostname

  if (url.indexOf("//") > -1) {
    hostname = url.split("/")[2];
  } else {
    hostname = url.split("/")[0];
  }

  //find & remove port number
  hostname = hostname.split(":")[0];
  hostname = hostname.replace("www.", "");
  //find & remove "?"
  hostname = hostname.split("?")[0];

  return hostname;
};

export const groupBy = function (xs, key) {
  return xs.reduce(function (rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

export const parseDate = (date) => {
  if (!date) return null;
  const numberOfSlashes = date.split(/\//g).length - 1;
  const dateFormat = numberOfSlashes === 2 ? "%m/%d/%Y" : "%Y";
  return timeParse(dateFormat)(date);
};

export const sortBy = (arr, key) =>
  arr.sort((a, b) =>
    (typeof key === "function" ? key(a) : a[key]) >
    (typeof key === "function" ? key(b) : b[key])
      ? 1
      : -1
  );
export const sortByFunction = (key) => (a, b) =>
  (typeof key === "function" ? key(a) : a[key]) >
  (typeof key === "function" ? key(b) : b[key])
    ? 1
    : -1;

export const keepBetween = (value, min, max) =>
  Math.max(min, Math.min(max, value));

export function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

export const combineChartDimensions = (dimensions) => {
  let parsedDimensions = {
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    ...dimensions,
  };

  return {
    ...parsedDimensions,
    boundedHeight: Math.max(
      parsedDimensions.height -
        parsedDimensions.marginTop -
        parsedDimensions.marginBottom,
      0
    ),
    boundedWidth: Math.max(
      parsedDimensions.width -
        parsedDimensions.marginLeft -
        parsedDimensions.marginRight,
      0
    ),
  };
};

export const useChartDimensions = (passedSettings) => {
  const ref = useRef();
  const dimensions = combineChartDimensions(passedSettings);

  const [width, changeWidth] = useState(0);
  const [height, changeHeight] = useState(0);

  useEffect(() => {
    if (dimensions.width && dimensions.height) return [ref, dimensions];

    const element = ref.current;
    const resizeObserver = new ResizeObserver((entries) => {
      if (!Array.isArray(entries)) return;
      if (!entries.length) return;

      const entry = entries[0];

      if (width !== entry.contentRect.width)
        changeWidth(entry.contentRect.width);
      if (height !== entry.contentRect.height)
        changeHeight(entry.contentRect.height);
    });

    resizeObserver.observe(element);

    return () => resizeObserver.unobserve(element);
  }, []);

  const newSettings = combineChartDimensions({
    ...dimensions,
    width: dimensions.width || width,
    height: dimensions.height || height,
  });

  return [ref, newSettings];
};

export const fromPairs = (arr) => {
  let res = {};
  arr.forEach((d) => {
    res[d[0]] = d[1];
  });
  return res;
};

export function useInterval(callback, delay) {
  const savedCallback = useRef();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export const getUrlParams = () => {
  const parts = window.location.search.slice(1).split("&");
  if (!parts) return;
  let params = {};
  parts.forEach((part) => {
    const [key, value] = part.split("=");
    if (!key) return;
    params[key] = decodeURIComponent(value);
  });
  return params;
};

const paramsObjectToString = (obj) => {
  const keys = Object.keys(obj);
  const values = Object.values(obj);
  return keys
    .map((key, i) => [key, values[i]].map(encodeURIComponent).join("="))
    .filter((d, i) => values[i] != null)
    .join("&");
};

export const useQueryParams = () => {
  const [localParams, setLocalParams] = useState({});
  const currentParams = useRef({});

  useEffect(() => {
    const params = getUrlParams();
    setLocalParams(params);
    currentParams.current = params;
  }, []);

  const updateParams = (newParams) => {
    setParams({
      ...currentParams.current,
      ...newParams,
    });
  };

  const setParams = (newParams) => {
    const newUrl = [
      window.location.protocol,
      "//",
      window.location.host,
      window.location.pathname,
      "?",
      paramsObjectToString(newParams),
    ].join("");
    window.history.pushState({ path: newUrl }, "", newUrl);
    setLocalParams(newParams);
    currentParams.current = newParams;
  };

  return [localParams, updateParams, setParams];
};

export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function countBy(collection, func) {
  var object = Object.create(null);

  collection.forEach(function (item) {
    var key = func(item);
    if (key in object) {
      ++object[key];
    } else {
      object[key] = 1;
    }
  });

  return object;
}

export const truncate = (str, len = 23) =>
  str.length > len - 2 ? str.slice(0, len) + "..." : str;
