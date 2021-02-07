import React, { useState, useCallback } from "react";

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
        <div className="Network__sidebar">
          <div className="Network__sidebar__top">
            <h1>The Climate Change Industry</h1>
            <div className="Network__type">
              <div className="Network__toggle">
                {groupOptions.map(({ label, id }) => (
                  <button
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

          <h6 className="Network__sidebar__bottom-label">
            {groupType == "Actors" ? "Filter by actor" : "Filter by"}
          </h6>

          <div className="Network__sidebar__bottom">
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
