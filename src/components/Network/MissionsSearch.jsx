import React, { useEffect, useState, useMemo } from "react";

import { countBy, useDebounce, sortByFunction, fromPairs } from "./../../utils";
import Icon from "./../Icon/Icon";

import "./MissionsSearch.css";

const MissionsSearch = ({ data, searchTerm, setSearchTerm }) => {
  const [searchTermLocal, setSearchTermLocal] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setSearchTermLocal(searchTerm);
  }, [searchTerm]);

  const debouncedSearchTerm = useDebounce(searchTermLocal, 300);

  useEffect(() => {
    setSearchTerm(searchTermLocal ? searchTermLocal : null);
  }, [debouncedSearchTerm]);

  const onSearchTermChange = (e) => {
    const newSearchTerm = e.target.value;
    setSearchTermLocal(newSearchTerm);
  };

  const uniqueStringsPerField = useMemo(() => {
    let uniqueStringsPerField = {};
    fields.forEach((field) => {
      const items = countBy(data, fieldToAccessorMap[field]);
      uniqueStringsPerField[field] = Object.keys(items)
        .filter((d) => d)
        .sort(sortByFunction((d) => -items[d]));
    });
    return uniqueStringsPerField;
  }, [data]);

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
    <div className="MissionsSearch">
      <div className="MissionsSearch__input">
        <input
          value={searchTermLocal}
          onChange={onSearchTermChange}
          placeholder="Search for a mission"
          onFocus={() => setIsOpen(true)}
        />
        {!!searchTermLocal && (
          <Icon
            className="MissionsSearch__input__close"
            name="x"
            size="s"
            onClick={() => setSearchTerm("")}
          />
        )}
      </div>
      {isOpen && (
        <>
          <div className="MissionsSearch__modal">
            {fields.map((field) => (
              <div className="MissionsSearch__field" key={field}>
                <h6>{field}</h6>
                <div className="MissionsSearch__options">
                  {filteredStringsPerField[field].slice(0, 5).map((item) => (
                    <button
                      className="MissionsSearch__option"
                      key={item}
                      onClick={() => setSearchTerm(item)}
                    >
                      {item}
                    </button>
                  ))}
                  {filteredStringsPerField[field].length > 4 && (
                    <div className="MissionsSearch__more">
                      + {filteredStringsPerField[field].length - 4} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div
            className="MissionsSearch__modal__background"
            onClick={() => setIsOpen(false)}
          ></div>
        </>
      )}
    </div>
  );
};

export default MissionsSearch;

const fields = ["technology", "programs", "missions", "actors"];
const fieldToAccessorMap = {
  missions: (d) => [d["name"]],
  actors: (d) => d["actors"] || [],
  programs: (d) => d["programs"] || [],
  technology: (d) => d["Technologies/Payload"] || [],
};
