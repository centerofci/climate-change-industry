import React from "react";

import { statusColors } from "./../../constants";

import "./StatusPill.css";

const StatusPill = ({ status }) => {
  return (
    <div
      className="StatusPill"
      style={{
        "--status-color": statusColors[status],
        background: `${statusColors[status]}33`,
      }}
    >
      {status}
    </div>
  );
};
export default StatusPill;
