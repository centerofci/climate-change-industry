import React from "react";
import { format } from "d3-format";

import StatusPill from "./StatusPill";
import Icon from "./../Icon/Icon";

import "./NetworkModal.css";
import { contributionAreaColors } from "../../constants";

const NetworkModal = ({ country = {}, mitigationArea, actors = [], onChangeState, onClose }) => {
  console.log(country, mitigationArea, actors)
  return (
    <>
      <div className="NetworkModal__background" onClick={onClose}></div>
      <div className="NetworkModal">
        <div className="NetworkModal__content">
          <div className="NetworkModal__close" onClick={onClose}>
            <Icon size="s" name="x" />
          </div>

          <div className="NetworkModal__name">
            <div>

              Individuals & Organizations in {country}{!!mitigationArea && <> working on <span style={{ color: contributionAreaColors[mitigationArea] }}>{mitigationArea}</span></>}
            </div>
          </div>


          <div className="NetworkModal__info">
            {actors.map(actor => (
              <div key={actor["id"]}>
                <button className="plain NetworkModal__info__item" onClick={() => {
                  onChangeState("item", actor["id"])
                  onChangeState("country", null)
                  onChangeState("mitigation-area", null)
                  onChangeState("back-country", country)
                  onChangeState("back-mitigation-area", mitigationArea)
                }}>
                  {actor["label"]}
                </button>
              </div>
            ))}
          </div>
          {/*
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
          )} */}
        </div>
      </div>
    </>
  );
};

export default NetworkModal;
