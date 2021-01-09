import React from "react";

import "./Toggle.css";
import ButtonGroup from "../Button/ButtonGroup/ButtonGroup";

const Toggle = ({ options, value, onChange, ...props }) => {
  const onChangeLocal = (button) => onChange(button.id);

  const buttons = options.map((option) => ({
    ...option,
    isActive: option.id === value,
  }));

  return <ButtonGroup {...props} buttons={buttons} onChange={onChangeLocal} />;
};

export default Toggle;
