import React from 'react';

const liCls = '';

const DropDownCard = ({ data = [], setOpen }) => (
  <div className="shadow h-auto w-56 absolute">
    <ul className="text-left">
      {data.map((item, i) => (
        <li key={i} className={liCls} onClick={() => setOpen(false)}>
          {item}
        </li>
      ))}
    </ul>
  </div>
);

export default DropDownCard;
