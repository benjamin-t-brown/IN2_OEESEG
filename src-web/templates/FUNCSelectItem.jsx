import React from 'react';
import css from 'css';
import utils from '../utils';
import { getMouseDiagramPosContext } from 'context';
import expose from '../expose';

const divRowStyle = {
  padding: '8px',
  background: 'rgba(0, 0, 0, 0.25)',
};

const labelStyle = {
  marginBottom: '4px',
};

const FUNCSelectItem = ({ rootNode, handleSubmit, handleCancelClick }) => {
  const [labelText, setLabelText] = React.useState('SELECT what?');

  const submit = () => {
    const templateToSubmit = structuredClone(template);
    const node = templateToSubmit.nodes.find(node => node.id === 'h4ex5d72k');
    node.content = `player.set('INVENTORY_SELECT_ITEM_TEXT', '${labelText}');
player.set('INVENTORY_NEXT_NODE_ID', 'gwp9hi899');
player.set('INVENTORY_NEXT_FILE_ID', player.get(CURRENT_FILE_VAR));
player.set('INVENTORY_MODE', 'selectItem');`;
    const mouseCoords = getMouseDiagramPosContext();

    console.log('SUBMIT', templateToSubmit, mouseCoords);
    const x = mouseCoords.x * expose.get_state('board').getScale() - 400;
    const y = mouseCoords.y * expose.get_state('board').getScale() - 500;
    handleSubmit(template, { left: -x, top: -y }, ['gwp9hi899']);
  };

  return (
    <div>
      <h3>New FUNC Select Item</h3>
      <div style={divRowStyle}>
        <label htmlFor="title" style={labelStyle}>
          Select Item Label Text
        </label>{' '}
        <br />
        <input
          id="title"
          value={labelText}
          onChange={ev => setLabelText(ev.target.value)}
          style={{
            width: '100%',
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          margin: '5px',
        }}
      >
        <div className="confirm-button" onClick={submit}>
          <span className="no-select">OK</span>
        </div>
        <div className="cancel-button" onClick={handleCancelClick}>
          <span className="no-select">Cancel</span>
        </div>
      </div>
    </div>
  );
};

export default FUNCSelectItem;

const template = {
  nodes: [
    {
      id: 'h4ex5d72k',
      type: 'action',
      content:
        "player.set('INVENTORY_SELECT_ITEM_TEXT', 'Place what?');\r\nplayer.set('INVENTORY_NEXT_NODE_ID', 'gwp9hi899');\r\nplayer.set('INVENTORY_NEXT_FILE_ID', player.get(CURRENT_FILE_VAR));\r\nplayer.set('INVENTORY_MODE', 'selectItem');",
      left: '0px',
      top: '0px',
      rel: null,
      voice: false,
    },
    {
      id: 'ng62ixro9',
      type: 'next_file',
      content: 'FUNC_Inventory.json',
      left: '63px',
      top: '120px',
      voice: false,
    },
    {
      id: 'cc16m91f9',
      type: 'text',
      content:
        "You do something with the ${player.get('selectedItem')?.label}...",
      left: '-206px',
      top: '524px',
      rel: null,
      voice: false,
    },
    {
      id: 'gwp9hi899',
      type: 'sub_root',
      content: 'sub_root',
      left: '136px',
      top: '186px',
      voice: false,
    },
    {
      id: 'cxp3pfodm',
      type: 'pass_fail',
      content: "Boolean(player.get('selectedItem'))",
      left: '43px',
      top: '270px',
      rel: null,
      voice: false,
    },
    {
      id: 'r4fgbwo95',
      type: 'pass_text',
      content: '',
      left: '4px',
      top: '401px',
      voice: false,
    },
    {
      id: 'oqkrq8f07',
      type: 'fail_text',
      content: 'No Item Selected.',
      left: '218px',
      top: '408px',
      voice: false,
      rel: null,
    },
  ],
  links: [
    {
      from: 'h4ex5d72k',
      to: 'ng62ixro9',
    },
    {
      from: 'gwp9hi899',
      to: 'cxp3pfodm',
    },
    {
      from: 'cxp3pfodm',
      to: 'r4fgbwo95',
    },
    {
      from: 'cxp3pfodm',
      to: 'oqkrq8f07',
    },
    {
      from: 'r4fgbwo95',
      to: 'cc16m91f9',
    },
  ],
};
