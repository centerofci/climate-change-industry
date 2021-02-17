import React, { useState, useCallback } from "react";

import Icon from "./../Icon/Icon";
import NetworkSearch from "./NetworkSearch";
import NetworkBubbles from "./NetworkBubbles";
import NetworkFilters from "./NetworkFilters";
import NetworkList from "./NetworkList";
import NetworkTooltip from "./NetworkTooltip";
import NetworkModal from "./NetworkModal";

import { typeShapes } from "./../../constants";
import { groupOptions, groupOptionsById } from "./../../group-options";

import "./Network.css";

const Network = ({
  data,
  groupType,
  focusedItem,
  searchTerm,
  onChangeState,
  focusedNode,
}) => {
  const [activeFilters, setActiveFilters] = useState([]);
  const [hoveredItem, onHoverItem] = useState(null);
  const [areFiltersShowing, setAreFiltersShowing] = useState(false);
  const [isAboutShowing, setIsAboutShowing] = useState(false);

  const groupMeta = groupOptionsById[groupType];

  const onFocusItem = useCallback((newItem) => {
    onChangeState("item", newItem);
  });

  const setFocusedNodeId = useCallback((newItem) => {
    onChangeState("focused", newItem);
  });

  const setSearchTerm = (newTerm) => {
    onChangeState("search", newTerm);
  };

  const onCloseFocusedItem = useCallback(() => {
    onFocusItem(null);
  }, []);

  return (
    <div className="Network__wrapper">
      <div className="Network__main">
        <div
          className={`Network__sidebar Network__sidebar--filters-${
            areFiltersShowing ? "showing" : "hidden"
          } Network__sidebar--about-${isAboutShowing ? "showing" : "hidden"}`}
        >
          <div className="Network__sidebar__top">
            <h1 className="Network__title">The Climate Change Industry</h1>
            <div className="Network__type">
              <div className="Network__toggle">
                {groupOptions.map(({ label, id }) => (
                  <button
                    key={id}
                    className={`Network__toggle__button Network__toggle__button--is-${
                      groupType == id ? "selected" : "unselected"
                    }`}
                    onClick={() => {
                      setActiveFilters([]);
                      setSearchTerm(null);
                      onHoverItem(null);
                      onChangeState("group", id);
                      setFocusedNodeId(null);
                    }}
                  >
                    <svg viewBox="-75 -75 150 150">{typeShapes[id]}</svg>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="Network__about">
            <h1>The Climate Change Industry</h1>
            This is about
            <button
              className="Network__sidebar__close"
              onClick={() => setIsAboutShowing(false)}
            >
              <Icon name="x" size="s" />
            </button>
          </div>

          <div className="Network__mobile-buttons">
            <button
              className="Network__button Network__mobile-button"
              onClick={() => setAreFiltersShowing(true)}
            >
              <Icon name="controls" />
            </button>
            <button
              className="Network__button Network__mobile-button"
              onClick={() => setIsAboutShowing(true)}
            >
              <Icon name="info" />
            </button>
          </div>

          <h6 className="Network__sidebar__bottom-label">
            {groupType == "Actors" ? "Filter by actor" : "Filter by"}
          </h6>

          <div className="Network__sidebar__bottom">
            <button
              className="Network__sidebar__close"
              onClick={() => setAreFiltersShowing(false)}
            >
              <Icon name="x" size="s" />
            </button>
            {groupType == "Actors" ? (
              <div className="Network__sidebar__section Network__filters">
                <NetworkList
                  data={data[groupType]}
                  filters={groupMeta["filters"]}
                  {...{ focusedNode, setFocusedNodeId }}
                />
              </div>
            ) : (
              <>
                <div className="Network__sidebar__section Network__search">
                  <NetworkSearch {...{ data, searchTerm, setSearchTerm }} />
                </div>
                <div className="Network__sidebar__section Network__filters">
                  <NetworkFilters
                    filters={groupMeta["filters"]}
                    {...{ activeFilters }}
                    data={data[groupType]}
                    onUpdateFilters={setActiveFilters}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="Network__bubbles">
          <NetworkBubbles
            {...{
              data,
              groupType,
              groupMeta,
              activeFilters,
              focusedItem,
              onFocusItem,
              hoveredItem,
              onHoverItem,
              focusedNode,
              setFocusedNodeId,
            }}
            searchTerm={searchTerm.toLowerCase()}
          />
        </div>
      </div>

      {!!hoveredItem && (
        <NetworkTooltip
          data={hoveredItem}
          groupType={groupType}
          isFocused={hoveredItem["id"] == focusedNode["id"]}
          onFocus={onFocusItem}
        />
      )}

      {focusedItem && (
        <NetworkModal info={focusedItem} onClose={onCloseFocusedItem} />
      )}
    </div>
  );
};

export default Network;
