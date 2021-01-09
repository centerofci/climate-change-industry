import React, { Component } from "react";
import classNames from "classnames";
import Button from "./../Button";

import "./ButtonGroup.css";

class ButtonGroup extends Component {
  getClassName() {
    return classNames("ButtonGroup", this.props.className);
  }

  getButtonClassName(button) {
    return classNames(button.className, {
      "Button--active": button.isActive,
    });
  }

  onChange = (button) => (e) => {
    this.props.onChange(button, e);
  };

  render() {
    let { buttons } = this.props;

    return (
      <div className={this.getClassName()}>
        {buttons.map((button, idx) => (
          <Button
            type="button"
            key={idx}
            style={{ "--accent": button.color }}
            className={this.getButtonClassName(button)}
            disabled={button.isDisabled}
            onClick={this.onChange(button)}
          >
            {button.label || button}
            {button.children}
          </Button>
        ))}
      </div>
    );
  }
}

export default ButtonGroup;
