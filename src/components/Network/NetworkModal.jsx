import React, { useMemo } from "react";
import { format } from "d3-format";

import StatusPill from "./StatusPill";
import Icon from "./../Icon/Icon";

import "./NetworkModal.css";

const NetworkModal = ({ info = {}, onClose }) => {
  return (
    <>
      <div className="NetworkModal__background" onClick={onClose}></div>
      <div className="NetworkModal">
        <div className="NetworkModal__content">
          <div className="NetworkModal__close" onClick={onClose}>
            <Icon size="s" name="x" />
          </div>

          <div className="NetworkModal__name">
            {info["label"]}
            {/* <div className="NetworkModal__year">{info["year"]}</div> */}
          </div>

          <div className="NetworkModal__status">
            {!!info["Status"] && <StatusPill status={info["Status"][0]} />}
          </div>

          {info["Link to More Info on Entity (bio or overview page)"] && (
            <a
              href={info["Link to More Info on Entity (bio or overview page)"]}
              target="_blank"
              rel="noopener"
              className="NetworkModal__link"
            >
              More info
            </a>
          )}
          {info["URL for Context"] && (
            <a
              href={info["URL for Context"]}
              target="_blank"
              rel="noopener"
              className="NetworkModal__link"
            >
              More info
            </a>
          )}
          {info["Big/Latest News"] && (
            <a
              href={info["Big/Latest News"]}
              target="_blank"
              rel="noopener"
              className="NetworkModal__link"
            >
              Latest news
            </a>
          )}

          {info["Amount"] && (
            <div className="NetworkModal__info">
              <div className="NetworkModal__label">Amount:</div>$
              {format(",.0f")(info["Amount"])}
            </div>
          )}
          {[
            "Focus",
            "Date",
            "Topical Contribution Area",
            "Rate-Limiting Feature",
            "Entity Type",
            "Year founded / Born",
            "Funded by",
            "Enacted/Undertaken By",
            "Number of People Involved (to 3 sig digits)",
            "Directly Associated Orgs (e.g., employment/parent org):",
            "Partners With",
            "Enacting/Undertaking XYZ Interventions",
            "Funding XYZ Interventions",
            "Made XYZ Investment(s)",
            "Received XYZ Investment(s)",
            // "Amount",
            "Source",
            "Recipient",
            "Directly Associated Orgs (e.g., employment/parent org)",
          ].map(
            (key) =>
              info[key] && (
                <div className="NetworkModal__info">
                  <div className="NetworkModal__label">
                    {key.split(" (")[0]}:
                  </div>
                  {Array.isArray(info[key])
                    ? info[key].map((d) => <div>{d}</div>)
                    : info[key]}
                </div>
              )
          )}
          {/* {info["mainContributionArea"] && (
            <div className="NetworkModal__info">
              {info["mainContributionArea"].join(" & ")}
            </div>
          )} */}
          {info["Intervention(s) being addressed:"] &&
            !!info["Intervention(s) being addressed:"].filter((d) => d)
              .length && (
              <div className="NetworkModal__info">
                <div className="NetworkModal__label">
                  Interventions being addressed:
                </div>

                {info["Intervention(s) being addressed:"].join(", ")}
              </div>
            )}
        </div>
      </div>
    </>
  );
};

export default NetworkModal;
