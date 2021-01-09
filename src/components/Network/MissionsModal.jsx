import React, { useMemo } from "react";

import { typeColors } from "./../../constants";
import StatusPill from "./StatusPill";
import Icon from "./../Icon/Icon";

import "./MissionsModal.css";

const MissionsModal = ({ info = {}, instruments = [], onClose }) => {
  const tech = useMemo(
    () =>
      (info["Technologies/Payload"] || [])
        .filter((d) => d)
        .map(
          (tech) =>
            instruments.find((d) => d["Name"] === tech) || {
              Name: tech,
            }
        ),
    [instruments]
  );

  const goals = useMemo(
    () =>
      (info["Goals"] || "")
        .split(", Objective")
        .filter((d) => d)
        .map((goal, i) => (i ? "Objective" : "") + goal.replace(/"/g, ""))
        .map(
          (goal) =>
            instruments.find((d) => d["Name"] === goal) || {
              Name: goal,
            }
        )
        .map((goal) => {
          let [name, description] = goal["Name"].split(":");
          if (!description) [name, description] = [description, name];
          return {
            ...goal,
            name,
            description,
          };
        }),
    [instruments]
  );

  return (
    <>
      <div className="MissionsModal__background" onClick={onClose}></div>
      <div className="MissionsModal">
        <div className="MissionsModal__content">
          <div className="MissionsModal__close" onClick={onClose}>
            <Icon size="s" name="x" />
          </div>
          <div className="MissionsModal__status">
            <StatusPill status={info["status"]} />
            {!!(info["Status"] || "").split(";")[1] && (
              <div className="MissionsModal__status__info">
                {info["Status"].split(";")[1]}
              </div>
            )}
          </div>
          <div className="MissionsModal__name">
            {info["name"]}
            <div className="MissionsModal__year">
              {[
                (info["Year of Launch"] ? +info["launchYear"] : null) || "??",
                (info["Arrival"] ? info["arrivalYear"] : null) || "??",
              ].join(" - ")}
            </div>
          </div>
          {info["photo"] && info["photo"][0] && (
            <img
              src={info["photo"][0]["thumbnails"]["large"]["url"]}
              alt="mission"
            />
          )}
          <div className="MissionsModal__info ">
            <span className={`MissionsModal__info MissionsModal__actor`}>
              {info["actors"].join(", ").replace(new RegExp(" -- ", "g"), ", ")}
            </span>
          </div>
          {!!info["programs"].length && (
            <div className="MissionsModal__info ">
              Programs:{" "}
              <span
                className={`MissionsModal__info program program--${info["program"]}`}
              >
                {info["programs"].join(", ")}
              </span>
            </div>
          )}
          <div className={`MissionsModal__info type`}>
            {(info["Mission Type"] || [])
              .map((d) => d.toLowerCase().trim())
              .map((type) => (
                <span
                  key={type}
                  className="MissionsModal__type-name"
                  style={{ color: typeColors[type] }}
                >
                  {type}
                </span>
              ))}
          </div>

          {!!tech.length && (
            <div className="MissionsModal__info">
              <h6>Technology & payloads</h6>
              <div className="MissionsModal__cards">
                {tech.map(({ Name }) => (
                  <div className="MissionsModal__card" key={Name}>
                    {Name}
                  </div>
                ))}
              </div>
            </div>
          )}
          {!!goals.length && (
            <div className="MissionsModal__info">
              <h6>Goals</h6>
              <div className="MissionsModal__cards">
                {goals.map(({ name, description }) => (
                  <div
                    className={
                      name ? `MissionsModal__card` : "MissionsModal__text"
                    }
                    key={name + description}
                  >
                    <b>{name}</b>
                    <div>{description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MissionsModal;
