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
            <div className="NetworkModal__year">{info["year"]}</div>
          </div>

          <div className="NetworkModal__status">
            {!!info["Status"] && <StatusPill status={info["Status"][0]} />}
          </div>

          {info["Amount"] && (
            <div className="NetworkModal__info">
              ${format(",.0f")(info["Amount"])}
            </div>
          )}
          {info["mainContributionArea"] && (
            <div className="NetworkModal__info">
              {info["mainContributionArea"].join(" & ")}
            </div>
          )}
          {info["Entity Type"] && (
            <div className="NetworkModal__info">
              {info["Entity Type"].join(", ")}
            </div>
          )}
          {info["Focus"] && (
            <div className="NetworkModal__info">{info["Focus"]}</div>
          )}
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
        </div>
      </div>
    </>
  );
};

export default NetworkModal;
