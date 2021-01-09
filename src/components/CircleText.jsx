import React, { useMemo } from "react";
import { getUniqueId } from "./../utils";

const CircleText = ({ r = 10, rotate = 0, children, ...props }) => {
  const id = useMemo(getUniqueId, []);

  return (
    <>
      <path
        fill="transparent"
        d={[
          ["M", 0, r].join(" "),
          ["A", r, r, 0, 0, 1, 0, -r].join(" "),
          ["A", r, r, 0, 0, 1, 0, r].join(" "),
        ].join(" ")}
        id={id}
        transform={`rotate(${rotate})`}
      ></path>
      <text textAnchor="middle" {...props}>
        <textPath href={`#${id}`} startOffset="50%">
          {children}
        </textPath>
      </text>
    </>
  );
};

export default CircleText;
