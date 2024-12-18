import React from 'react';
import { notify } from './notifications';

const DeclList = props => {
  const { declarations } = props;
  const [declValue, setDeclValue] = React.useState(declarations?.[0]);
  const handleDeclClick = ({ variable, value }) => {
    notify(`Copied '$${variable}'`);
    navigator.clipboard.writeText(`$${variable}`);
  };

  return declarations?.length ? (
    <div>
      <div
        style={{
          margin: '6px 0',
          background: 'rgba(0, 0, 0, 0.5)',
        }}
      >
        Decl:{' '}
        <span
          style={{
            color: 'lightblue',
          }}
        >
          {declValue?.variable}
        </span>{' '}
        ={' '}
        <span
          style={{
            color: '#f0f0f0',
          }}
        >
          {declValue?.value}
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          margin: '6px 0',
        }}
      >
        {declarations
          .sort((a, b) => {
            return a.variable.localeCompare(b.variable);
          })
          .map(({ variable, value }) => {
            return (
              <div
                key={variable}
                style={{
                  background: 'rgb(131 108 40)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '32px',
                  margin: '2px',
                }}
                onClick={() => handleDeclClick({ variable, value })}
                onMouseOver={() => setDeclValue({ variable, value })}
              >
                <span style={{ color: 'white', userSelect: 'none' }}>
                  {'$'}
                  {variable}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  ) : null;
};

export default DeclList;
