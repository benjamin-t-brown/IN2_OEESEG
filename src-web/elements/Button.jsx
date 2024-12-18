import React from 'react';

const cls = 'confirm-button';

const Button = ({ onClick }) => (
  <div className={cls} onClick={onClick}>
    <span className="no-select">Dropdown button</span>
  </div>
);

export default Button;
