import React from "react"

export default ({children, level = "secondary", inline = false}) => (
    <div style={{
        paddingBottom: "12px",
        paddingRight: inline ? "12px": "initial",
        display: inline ? "inline-block" : "block",
        }}>
    <div
      style={{
        borderRadius: '5px',
        backgroundColor : "var(--ifm-alert-background-color)",
        borderColor: "var(--ifm-alert-border-color)",
        color: "var(--ifm-alert-color)",
        padding: '0.3rem',
        display: "inline-block",
      }}
      className={`alert--${level}`}>
      {children}
    </div>
    </div>
  );
