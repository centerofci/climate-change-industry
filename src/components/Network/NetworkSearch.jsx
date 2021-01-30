import React, { useEffect, useState, useMemo } from "react";

import {
  countBy,
  flatten,
  useDebounce,
  sortByFunction,
  fromPairs,
} from "./../../utils";
import { types } from "./../../constants";
import Icon from "./../Icon/Icon";

import "./NetworkSearch.css";

const NetworkSearch = ({ data, searchTerm, setSearchTerm }) => {
  const [searchTermLocal, setSearchTermLocal] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const allItems = useMemo(
    () => flatten(types.map((type) => data[type].map((d) => ({ ...d, type })))),
    [data]
  );

  useEffect(() => {
    setSearchTermLocal(searchTerm);
  }, [searchTerm]);

  const debouncedSearchTerm = useDebounce(searchTermLocal, 300);

  const [didMount, setDidMount] = useState(false);
  useEffect(() => {
    if (!didMount) {
      setDidMount(true);
      return;
    }
    setSearchTerm(searchTermLocal ? searchTermLocal : null);
  }, [debouncedSearchTerm]);

  const onSearchTermChange = (e) => {
    const newSearchTerm = e.target.value;
    setSearchTermLocal(newSearchTerm);
  };

  const uniqueStringsPerField = useMemo(() => {
    let uniqueStringsPerField = {};
    fields.forEach((field) => {
      const items = countBy(allItems, fieldToAccessorMap[field]);
      uniqueStringsPerField[field] = Object.keys(items)
        .filter((d) => d)
        .sort(sortByFunction((d) => -items[d]));
    });
    return uniqueStringsPerField;
  }, [allItems]);

  const searchTermLocalLower = searchTermLocal.toLowerCase();

  const filteredStringsPerField = fromPairs(
    fields.map((field) => [
      field,
      uniqueStringsPerField[field].filter((d) =>
        d.toLowerCase().includes(searchTermLocalLower)
      ),
    ])
  );

  useEffect(() => {
    const onKeydown = (e) => {
      if (e.key !== "Escape") return;
      setIsOpen(false);
    };
    window.addEventListener("keydown", onKeydown);

    return () => {
      window.removeEventListener("keydown", onKeydown);
    };
  }, []);

  return (
    <div className="NetworkSearch">
      <div className="NetworkSearch__input">
        <input
          value={searchTermLocal}
          onChange={onSearchTermChange}
          placeholder="Search for a mission"
          onFocus={() => setIsOpen(true)}
        />
        {!!searchTermLocal && (
          <Icon
            className="NetworkSearch__input__close"
            name="x"
            size="s"
            onClick={() => setSearchTerm("")}
          />
        )}
      </div>
      {isOpen && (
        <>
          <div className="NetworkSearch__modal">
            {fields.map((field) => (
              <div className="NetworkSearch__field" key={field}>
                <h6>{field}</h6>
                <div className="NetworkSearch__options">
                  {filteredStringsPerField[field].slice(0, 5).map((item) => (
                    <button
                      className="NetworkSearch__option"
                      key={item}
                      onClick={() => setSearchTerm(item)}
                    >
                      {item}
                    </button>
                  ))}
                  {filteredStringsPerField[field].length > 4 && (
                    <div className="NetworkSearch__more">
                      + {filteredStringsPerField[field].length - 4} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div
            className="NetworkSearch__modal__background"
            onClick={() => setIsOpen(false)}
          ></div>
        </>
      )}
    </div>
  );
};

export default NetworkSearch;

const fieldToAccessorMap = {
  Interventions: (d) => [d["type"] == "Interventions" ? d["label"] : undefined],
  Investments: (d) => [d["type"] == "Investments" ? d["label"] : undefined],
  Actors: (d) => [d["type"] == "Actors" ? d["label"] : undefined],
  Regulations: (d) => [d["type"] == "Regulations" ? d["label"] : undefined],
};
const fields = Object.keys(fieldToAccessorMap);
