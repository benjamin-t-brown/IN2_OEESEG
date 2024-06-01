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

    const ROOM_PRIMARY_SWITCH_NODE = 'ee4s4acfi';
    const ROOM_INIT_NODE = 'puefyqexe';
    const BASIC_ROOM_ARGS_NODE = 'etwo71fmw';
    const BASIC_ROOM_RET_SUB_ROOT_NODE = 'm1rg8itpw';
    const PRIMARY_DESCRIPTION_ACTION_NODE = 'xz70trakb';
    const PRIMARY_DESCRIPTION_NODE = 'g9aqn6gaa';
    const SUCCINCT_DESCRIPTION_NODE = 'ndy6qieya';
    const SUB_ROOT_EXAMINE_SURROUNDINGS_RETURN_NODE = 'fo0imirfg';

    nodes.find(({ id }) => id === ROOM_INIT_NODE).content =
      "engine.setBackground('" +
      state.backgroundImage +
      "');\nengine.setHeading('" +
      state.heading +
      "');\n\nif (player.get('lasIN2f') !== 'Inventory.json') {\n  " +
      state.playSoundText +
      '\n}\n';
    const basicRoomArgsNode = nodes.find(
      ({ id }) => id === BASIC_ROOM_ARGS_NODE
    );
    basicRoomArgsNode.content = `
  player.set('args.roomTitle', '${state.title}')
  player.set('args.nextNodeId', '${BASIC_ROOM_RET_SUB_ROOT_NODE}')
  player.set('args.nextFileId', player.get('curIN2f'))
  player.set('args.customExit1', false)
  player.set('args.northExit', ${
    state.exits.includes('NORTH') ? '"Caves_Cave1.json"' : 'false'
  })
  player.set('args.eastExit', ${
    state.exits.includes('EAST') ? '"Caves_Cave1.json"' : 'false'
  })
  player.set('args.southExit', ${
    state.exits.includes('SOUTH') ? '"Caves_Cave1.json"' : 'false'
  })
  player.set('args.westExit', ${
    state.exits.includes('WEST') ? '"Caves_Cave1.json"' : 'false'
  })
    `;

    nodes.find(({ id }) => id === PRIMARY_DESCRIPTION_NODE).content =
      state.examineSurroundings;
    nodes.find(({ id }) => id === SUCCINCT_DESCRIPTION_NODE).content =
      state.examineSurroundings2;
    nodes.find(({ id }) => id === PRIMARY_DESCRIPTION_ACTION_NODE).content =
      "player.set('itemsText', engine.getRoomItemsText());\nplayer.set('exitText', '" +
      exitListToString(state.exits) +
      "');";

    // root to top level switch node
    // links.push({
    //   from: rootNode.id,
    //   to: 'h4epzxxet',
    // });
    const location = {
      left: -600,
      top: 111,
    };
    handleSubmit(templateToSubmit, location, [
      ROOM_PRIMARY_SWITCH_NODE,
      BASIC_ROOM_RET_SUB_ROOT_NODE,
      SUB_ROOT_EXAMINE_SURROUNDINGS_RETURN_NODE,
    ]);
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
      id: 'ee4s4acfi',
      type: 'switch',
      content: 'switch',
      left: '0px',
      top: '0px',
      voice: false,
    },
    {
      id: 'ypueuxtun',
      type: 'switch_default',
      content: 'default',
      left: '556px',
      top: '91px',
      voice: false,
    },
    {
      id: 'puefyqexe',
      type: 'action',
      content:
        "engine.setBackground('Caves_Cave1');\nengine.setHeading('n');\n\nif (player.get('lasIN2f') !== 'Inventory.json') {\n  engine.playOneOfSound('step', [1, 2, 3]);\n}\n",
      left: '1104px',
      top: '17px',
      rel: null,
      voice: false,
    },
    {
      id: 'gcpidxufb',
      type: 'choice',
      content: '',
      left: '-44px',
      top: '900px',
      voice: false,
    },
    {
      id: 'xz70trakb',
      type: 'action',
      content:
        "player.set('itemsText', engine.getRoomItemsText());\nplayer.set('exitText', 'There are exits to the NORTH.');",
      left: '336px',
      top: '627px',
      rel: null,
      voice: false,
    },
    {
      id: 'bc4m43i1r',
      type: 'choice_conditional',
      content: 'engine.getRoomItems().length > 0',
      left: '-802px',
      top: '517px',
      rel: null,
      voice: false,
    },
    {
      id: 'okdqg5g5u',
      type: 'choice_text',
      content: 'Pick up items.',
      left: '-894px',
      top: '602px',
      rel: null,
      voice: false,
    },
    {
      id: 'xud3lcg3s',
      type: 'action',
      content:
        "player.set('PICKUP_NEXT_FILE_ID', player.get('curIN2f'));\r\nplayer.set('PICKUP_NEXT_NODE_ID', 'fo0imirfg');",
      left: '-970px',
      top: '704px',
      voice: false,
      rel: null,
    },
    {
      id: 'l3rkquuof',
      type: 'next_file',
      content: 'FUNC_PickUp.json',
      left: '-874px',
      top: '829px',
      voice: false,
    },
    {
      id: 'g9aqn6gaa',
      type: 'text',
      content:
        "<Primary Description>.\n\n${player.get('exitText')}\n\n${player.get('itemsText')}",
      left: '-2px',
      top: '394px',
      rel: null,
      voice: false,
    },
    {
      id: 'ndy6qieya',
      type: 'text',
      content:
        "<Succinct Description>.\n\n${player.get('exitText')}\n\n${player.get('itemsText')}",
      left: '-359px',
      top: '685px',
      rel: null,
      voice: false,
    },
    {
      id: 'gam26tnhh',
      type: 'action',
      content: "player.set('itemsText', engine.getRoomItemsText());",
      left: '-476px',
      top: '378px',
      rel: null,
      voice: false,
    },
    {
      id: 'xqmzbgt8u',
      type: 'choice_text',
      content: 'Back.',
      left: '342px',
      top: '1115px',
      rel: null,
      voice: false,
    },
    {
      id: 'fo0imirfg',
      type: 'sub_root',
      content: 'sub_root',
      left: '-817px',
      top: '892px',
      voice: false,
    },
    {
      id: 'etwo71fmw',
      type: 'action',
      content:
        "player.set('args.roomTitle', 'Title')\r\nplayer.set('args.nextNodeId', 'm1rg8itpw')\r\nplayer.set('args.nextFileId', player.get('curIN2f'))\r\nplayer.set('args.customExit1', false)\r\nplayer.set('args.northExit', 'Caves_Cave1.json')\r\nplayer.set('args.eastExit', false)\r\nplayer.set('args.southExit', false)\r\nplayer.set('args.westExit', false)",
      left: '1105px',
      top: '218px',
      voice: false,
      rel: null,
    },
    {
      id: 'm1rg8itpw',
      type: 'sub_root',
      content: 'output',
      left: '1273px',
      top: '694px',
      voice: false,
      rel: null,
    },
    {
      id: 'm9q4pc0yx',
      type: 'next_file',
      content: 'FUNC_BasicRoom.json',
      left: '1212px',
      top: '617px',
      voice: false,
    },
    {
      id: 'g6wgwtfwr',
      type: 'switch',
      content: 'switch',
      left: '1258px',
      top: '933px',
      voice: false,
    },
    {
      id: 'i0ip9882z',
      type: 'switch_default',
      content: 'default',
      left: '1833px',
      top: '897px',
      voice: false,
    },
    {
      id: 'u8u49dw54',
      type: 'switch_conditional',
      content: "$VAR_basicRoomOutput === 'examine-surroundings'",
      left: '890px',
      top: '1110px',
      voice: false,
      rel: null,
    },
    {
      id: 'lg1ncogp3',
      type: 'declaration',
      content: "VAR_basicRoomOutput = player.get('output.roomChoice')",
      left: '1068px',
      top: '784px',
      rel: null,
      voice: false,
    },
  ],
  links: [
    {
      from: 'ee4s4acfi',
      to: 'ypueuxtun',
    },
    {
      from: 'ypueuxtun',
      to: 'puefyqexe',
    },
    {
      from: 'puefyqexe',
      to: 'etwo71fmw',
    },
    {
      from: 'gcpidxufb',
      to: 'bc4m43i1r',
    },
    {
      from: 'gcpidxufb',
      to: 'xqmzbgt8u',
    },
    {
      from: 'xz70trakb',
      to: 'g9aqn6gaa',
    },
    {
      from: 'bc4m43i1r',
      to: 'okdqg5g5u',
    },
    {
      from: 'okdqg5g5u',
      to: 'xud3lcg3s',
    },
    {
      from: 'xud3lcg3s',
      to: 'l3rkquuof',
    },
    {
      from: 'g9aqn6gaa',
      to: 'gcpidxufb',
    },
    {
      from: 'ndy6qieya',
      to: 'gcpidxufb',
    },
    {
      from: 'gam26tnhh',
      to: 'ndy6qieya',
    },
    {
      from: 'xqmzbgt8u',
      to: 'puefyqexe',
    },
    {
      from: 'fo0imirfg',
      to: 'gam26tnhh',
    },
    {
      from: 'etwo71fmw',
      to: 'm9q4pc0yx',
    },
    {
      from: 'm1rg8itpw',
      to: 'lg1ncogp3',
    },
    {
      from: 'g6wgwtfwr',
      to: 'i0ip9882z',
    },
    {
      from: 'g6wgwtfwr',
      to: 'u8u49dw54',
    },
    {
      from: 'i0ip9882z',
      to: 'puefyqexe',
    },
    {
      from: 'u8u49dw54',
      to: 'xz70trakb',
    },
    {
      from: 'lg1ncogp3',
      to: 'g6wgwtfwr',
    },
  ],
};
