import React from 'react';
import css from 'css';
import { random_id } from 'utils';

const exitListToString = strings => {
  if (strings.length < 2) {
    return 'There are exits to the ' + strings[0] + '.';
  }
  if (strings.length === 2) {
    return 'There are exits to the ' + strings[0] + ' and ' + strings[1] + '.';
  }
  return (
    'There are exits to the ' +
    strings.slice(0, strings.length - 1).join(', ') +
    ', and ' +
    strings[strings.length - 1] +
    '.'
  );
};

const divRowStyle = {
  padding: '8px',
  background: 'rgba(0, 0, 0, 0.25)',
};

const labelStyle = {
  marginBottom: '4px',
};

const textareaStyle = {
  padding: '5px',
  background: 'rgb(53, 53, 53)',
  resize: 'none',
  // whiteSpace: 'pre',
  color: css.colors.TEXT_LIGHT,
  width: '100%',
};

const BasicOEESEGRoom = ({ rootNode, handleSubmit, handleCancelClick }) => {
  const [state, dispatch] = React.useReducer(
    (state, action) => {
      const newState = { ...state };
      newState[action.type] = action.value;
      if (action.type === 'exits') {
        // Enforce directions are always sorted in this order.
        const correctDirections = ['NORTH', 'EAST', 'SOUTH', 'WEST'];
        const sortDirections = arr => {
          return arr.sort((a, b) => {
            return correctDirections.indexOf(a) - correctDirections.indexOf(b);
          });
        };
        newState.exits = sortDirections(action.value);
      }
      return newState;
    },
    {
      backgroundImage: 'Caves_Cave1',
      heading: 'n',
      title: '<Title>',
      examineSurroundings:
        "<Primary Description>.\n\n${player.get('exitText')}\n\n${player.get('itemsText')}",
      examineSurroundings2:
        "<Succinct Description>.\n\n${player.get('exitText')}\n\n${player.get('itemsText')}",
      playSoundText: "engine.playOneOfSound('step', [1, 2, 3]);",
      exits: ['NORTH'],
    }
  );

  const submit = (window.current_confirm = () => {
    const templateToSubmit = structuredClone(template);
    const nodes = templateToSubmit.nodes;
    const links = templateToSubmit.links;

    nodes.find(({ id }) => id === 'a16zgg7gs').content =
      state.examineSurroundings;
    nodes.find(({ id }) => id === 'tkouu5dgg').content =
      state.examineSurroundings2;
    nodes.find(({ id }) => id === 'lmrkynfi0').content =
      "player.set('itemsText', engine.getRoomItemsText());\nplayer.set('exitText', '" +
      exitListToString(state.exits) +
      "');";
    nodes.find(({ id }) => id === 'eace68zi5').content = state.title;
    nodes.find(({ id }) => id === 'e9z3pyfig').content =
      "engine.setBackground('" +
      state.backgroundImage +
      "');\nengine.setHeading('" +
      state.heading +
      "');\n\nif (player.get('lasIN2f') !== 'Inventory.json') {\n  " +
      state.playSoundText +
      '\n}\n';

    for (let i = 0; i < state.exits.length; i++) {
      const exitText = state.exits[i];
      const x = 1835 + i * 400;
      const y = 896 + i * 24;
      nodes.push(
        {
          id: random_id(9),
          type: 'choice_text',
          content: `Go ${exitText}.`,
          left: x + 'px',
          top: y + 'px',
          rel: null,
          voice: false,
        },
        {
          id: random_id(9),
          type: 'next_file',
          content: 'Caves_SecretCave1.json',
          left: x + 'px',
          top: y + 200 + 'px',
          voice: false,
        }
      );
      links.push(
        {
          from: 'ffbfqathh',
          to: nodes[nodes.length - 2].id,
        },
        {
          from: nodes[nodes.length - 2].id,
          to: nodes[nodes.length - 1].id,
        }
      );
    }

    links.push({
      from: rootNode.id,
      to: 'h4epzxxet',
    });

    handleSubmit(templateToSubmit);
  });

  const handleExitCheckboxClick = direction => ev => {
    if (ev.target.checked) {
      dispatch({ type: 'exits', value: [...state.exits, direction] });
    } else {
      dispatch({
        type: 'exits',
        value: state.exits.filter(e => e !== direction),
      });
    }
  };

  return (
    <div>
      <h3>New Basic OEESEG Room</h3>
      <div style={divRowStyle}>
        <label htmlFor="heading" style={labelStyle}>
          Heading
        </label>{' '}
        <br />
        <select
          id="heading"
          value={state.heading}
          onChange={ev => dispatch({ type: 'heading', value: ev.target.value })}
          style={{
            width: '80px',
          }}
        >
          <option value="n">n</option>
          <option value="e">e</option>
          <option value="s">s</option>
          <option value="w">w</option>
          <option value="ne">ne</option>
          <option value="nw">nw</option>
          <option value="se">se</option>
          <option value="sw">sw</option>
        </select>
      </div>
      <div style={divRowStyle}>
        <label htmlFor="backgroundImage" style={labelStyle}>
          Background Image
        </label>{' '}
        <br />
        <input
          id="backgroundImage"
          value={state.backgroundImage}
          onChange={ev =>
            dispatch({ type: 'backgroundImage', value: ev.target.value })
          }
          style={{
            width: '300px',
          }}
        />
      </div>
      <div style={divRowStyle}>
        <label htmlFor="title" style={labelStyle}>
          Title
        </label>{' '}
        <br />
        <input
          id="title"
          value={state.title}
          onChange={ev => dispatch({ type: 'title', value: ev.target.value })}
          style={{
            width: '300px',
          }}
        />
      </div>
      <div style={divRowStyle}>
        <label htmlFor="examineSurroundings" style={labelStyle}>
          Examine Surroundings Primary Text
        </label>{' '}
        <br />
        <textarea
          id="examineSurroundings"
          value={state.examineSurroundings}
          onChange={ev =>
            dispatch({ type: 'examineSurroundings', value: ev.target.value })
          }
          style={{
            ...textareaStyle,
            height: '140px',
          }}
        />
      </div>
      <div style={divRowStyle}>
        <label htmlFor="examineSurroundings2" style={labelStyle}>
          Examine Surroundings Succinct Text
        </label>{' '}
        <br />
        <textarea
          id="examineSurroundings2"
          value={state.examineSurroundings2}
          onChange={ev =>
            dispatch({ type: 'examineSurroundings2', value: ev.target.value })
          }
          style={{
            ...textareaStyle,
            height: '140px',
          }}
        />
      </div>
      <div style={divRowStyle}>
        <label htmlFor="playSoundText" style={labelStyle}>
          Play Sound Text
        </label>{' '}
        <br />
        <textarea
          id="playSoundText"
          value={state.playSoundText}
          onChange={ev =>
            dispatch({ type: 'playSoundText', value: ev.target.value })
          }
          style={textareaStyle}
        />
      </div>
      <div style={divRowStyle}>
        <label htmlFor="exits" style={labelStyle}>
          Exits
        </label>{' '}
        <br />
        <input
          type="checkbox"
          id="north"
          checked={state.exits.includes('NORTH')}
          onChange={handleExitCheckboxClick('NORTH')}
        />
        <label htmlFor="north">NORTH</label>
        <br />
        <input
          type="checkbox"
          id="east"
          checked={state.exits.includes('EAST')}
          onChange={handleExitCheckboxClick('EAST')}
        />
        <label htmlFor="east">EAST</label>
        <br />
        <input
          type="checkbox"
          id="south"
          checked={state.exits.includes('SOUTH')}
          onChange={handleExitCheckboxClick('SOUTH')}
        />
        <label htmlFor="south">SOUTH</label>
        <br />
        <input
          type="checkbox"
          id="west"
          checked={state.exits.includes('WEST')}
          onChange={handleExitCheckboxClick('WEST')}
        />
        <label htmlFor="west">WEST</label>
        <br />
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

export default BasicOEESEGRoom;

const template = {
  nodes: [
    {
      id: 'h4epzxxet',
      type: 'switch',
      content: 'switch',
      left: '0px',
      top: '0px',
      voice: false,
    },
    {
      id: 'osg8aepnn',
      type: 'switch_default',
      content: 'default',
      left: '556px',
      top: '91px',
      voice: false,
    },
    {
      id: 'e9z3pyfig',
      type: 'action',
      content:
        "engine.setBackground('Caves_CaveChute1');\nengine.setHeading('s');\n\nif (player.get('lasIN2f') !== 'Inventory.json') {\n  engine.playOneOfSound('step', [1, 2, 3]);\n}\n",
      left: '1096px',
      top: '74px',
      rel: null,
      voice: false,
    },
    {
      id: 'zinzr8q3z',
      type: 'choice_text',
      content: 'Examine surroundings.',
      left: '1055px',
      top: '747px',
      rel: null,
      voice: false,
    },
    {
      id: 'nwlun10mi',
      type: 'choice',
      content: '',
      left: '-44px',
      top: '900px',
      voice: false,
    },
    {
      id: 'lmrkynfi0',
      type: 'action',
      content:
        "player.set('itemsText', engine.getRoomItemsText());\r\nplayer.set('exitText', 'There are exits to the NORTH and SOUTH.');",
      left: '336px',
      top: '627px',
      rel: null,
      voice: false,
    },
    {
      id: 'oyol70w30',
      type: 'choice_conditional',
      content: 'engine.getRoomItems().length > 0',
      left: '-802px',
      top: '517px',
      rel: null,
      voice: false,
    },
    {
      id: 'pn6fn2skc',
      type: 'choice_text',
      content: 'Pick up items.',
      left: '-894px',
      top: '602px',
      rel: null,
      voice: false,
    },
    {
      id: 'p17r2e1ri',
      type: 'action',
      content:
        "player.set('PICKUP_NEXT_FILE_ID', player.get('curIN2f'));\r\nplayer.set('PICKUP_NEXT_NODE_ID', 'si1q1rpai');",
      left: '-971px',
      top: '704px',
      voice: false,
      rel: null,
    },
    {
      id: 'rh1627bf5',
      type: 'next_file',
      content: 'PickUp.json',
      left: '-874px',
      top: '829px',
      voice: false,
    },
    {
      id: 'a16zgg7gs',
      type: 'text',
      content:
        "The cave sharply drops off of a cliff here, however there is a smooth chute that seems to have been carved out of the stone.\n\n${player.get('exitText')}\n\n${player.get('itemsText')}",
      left: '-2px',
      top: '394px',
      rel: null,
      voice: false,
    },
    {
      id: 'ffbfqathh',
      type: 'choice',
      content: '',
      left: '1583px',
      top: '430px',
      voice: false,
    },
    {
      id: 'eace68zi5',
      type: 'text',
      content: 'Chute.',
      left: '1185px',
      top: '260px',
      rel: null,
      voice: false,
    },
    {
      id: 'n07ydpg93',
      type: 'next_file',
      content: 'Inventory.json',
      left: '1396px',
      top: '996px',
      voice: false,
    },
    {
      id: 'kted7oh6w',
      type: 'action',
      content:
        "player.set('INVENTORY_NEXT_NODE_ID', 'p1rd41fiq');\r\nplayer.set('INVENTORY_NEXT_FILE_ID', player.get(CURRENT_FILE_VAR));",
      left: '1300px',
      top: '870px',
      rel: null,
      voice: false,
    },
    {
      id: 'h34orx0wr',
      type: 'choice_text',
      content: 'Inventory.',
      left: '1411px',
      top: '768px',
      rel: null,
      voice: false,
    },
    {
      id: 'tkouu5dgg',
      type: 'text',
      content:
        "You are standing in a cave with a chute that leads down.\n\n${player.get('exitText')}\n\n${player.get('itemsText')}",
      left: '-373px',
      top: '513px',
      rel: null,
      voice: false,
    },
    {
      id: 'hd8xpplcy',
      type: 'action',
      content: "player.set('itemsText', engine.getRoomItemsText());",
      left: '-476px',
      top: '378px',
      rel: null,
      voice: false,
    },
    {
      id: 'zkynpketc',
      type: 'switch_conditional',
      content: 'false',
      left: '-426px',
      top: '226px',
      rel: null,
      voice: false,
    },
    {
      id: 'kok3agmlx',
      type: 'text',
      content:
        'COMMENT: Every node needs a parent or it will be auto-removed during compilation.',
      left: '-698px',
      top: '196px',
      rel: null,
      voice: false,
    },
    {
      id: 'qrl2f2cyc',
      type: 'choice_text',
      content: 'Back.',
      left: '342px',
      top: '1115px',
      rel: null,
      voice: false,
    },
  ],
  links: [
    {
      from: 'h4epzxxet',
      to: 'osg8aepnn',
    },
    {
      from: 'h4epzxxet',
      to: 'zkynpketc',
    },
    {
      from: 'osg8aepnn',
      to: 'e9z3pyfig',
    },
    {
      from: 'e9z3pyfig',
      to: 'eace68zi5',
    },
    {
      from: 'zinzr8q3z',
      to: 'lmrkynfi0',
    },
    {
      from: 'nwlun10mi',
      to: 'oyol70w30',
    },
    {
      from: 'nwlun10mi',
      to: 'qrl2f2cyc',
    },
    {
      from: 'lmrkynfi0',
      to: 'a16zgg7gs',
    },
    {
      from: 'oyol70w30',
      to: 'pn6fn2skc',
    },
    {
      from: 'pn6fn2skc',
      to: 'p17r2e1ri',
    },
    {
      from: 'p17r2e1ri',
      to: 'rh1627bf5',
    },
    {
      from: 'a16zgg7gs',
      to: 'nwlun10mi',
    },
    {
      from: 'ffbfqathh',
      to: 'zinzr8q3z',
    },
    {
      from: 'ffbfqathh',
      to: 'h34orx0wr',
    },
    {
      from: 'eace68zi5',
      to: 'ffbfqathh',
    },
    {
      from: 'kted7oh6w',
      to: 'n07ydpg93',
    },
    {
      from: 'h34orx0wr',
      to: 'kted7oh6w',
    },
    {
      from: 'tkouu5dgg',
      to: 'nwlun10mi',
    },
    {
      from: 'hd8xpplcy',
      to: 'tkouu5dgg',
    },
    {
      from: 'zkynpketc',
      to: 'hd8xpplcy',
    },
    {
      from: 'qrl2f2cyc',
      to: 'e9z3pyfig',
    },
  ],
};
