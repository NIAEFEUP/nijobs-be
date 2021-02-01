import React from "react"

export default ({children, level, variant}) => (
    <span
      style={{
        backgroundColor: `var(--ifm-color-${level}${variant ? `-${variant}` : ""})`,
        borderRadius: '5px',
        color: '#fff',
        padding: '0.3rem',
      }}>
      {children}
    </span>
  );
