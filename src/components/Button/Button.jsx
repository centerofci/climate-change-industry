import React, { Component } from "react";
import classNames from "classnames";

import "./Button.css";

class Button extends Component {
  getClassName() {
    return classNames(
      "Button",
      `Button--style-${this.props.styleType}`,
      this.props.className
    );
  }

  render() {
    return (
      <button {...this.props} className={this.getClassName()}>
        {this.props.children}
      </button>
    );
  }
}

export default Button;
