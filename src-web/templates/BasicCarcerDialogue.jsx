import React from 'react';
import css from 'css';
import { random_id } from 'utils';
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

const BasicCarcerDialogue = ({ rootNode, handleSubmit, handleCancelClick }) => {
  const [state, dispatch] = React.useReducer(
    (state, action) => {
      const newState = { ...state };
      newState[action.type] = action.value;
      return newState;
    },
    {
      characterName: 'AldebethBlackrose',
      characterNameLabel: 'Aldebeth Blackrose',
      portrait: 'port_AldebethBlackrose_0',
      decoration: 'default',
    }
  );

  const submit = (window.current_confirm = () => {
    const templateToSubmit = structuredClone(template);
    const nodes = templateToSubmit.nodes;
    const links = templateToSubmit.links;

    const SETUP_ACTION_NODE = 'qep62w3pl';
    const SPOKEN_TO_SWITCH_NODE = 'br5maxs12';
    const SPOKEN_TO_ACTION_NODE = 'pci9utt2e';

    const actionNode = nodes.find(({ id }) => id === SETUP_ACTION_NODE);
    actionNode.content = `
player.set('dialog.name', '${state.characterName}');
player.set('dialog.nameLabel', '${state.characterNameLabel}');
player.set('dialog.portrait', '${state.portrait}');
player.set('dialog.decoration', '${state.decoration}');
engine.setupDialog();
`;

    const spokenToSwitchNode = nodes.find(
      ({ id }) => id === SPOKEN_TO_SWITCH_NODE
    );
    spokenToSwitchNode.content = `player.once('${state.characterName}_spokenTo')`;

    const spokenToActionNode = nodes.find(
      ({ id }) => id === SPOKEN_TO_ACTION_NODE
    );
    spokenToActionNode.content = `engine.setHasSpokenTo(player.get('dialog.name'));`;

    const location = {
      left: -2470,
      top: 222,
    };
    handleSubmit(templateToSubmit, location, []);
  });

  return (
    <div>
      <h3>New Basic Carcer Dialogue</h3>
      <div style={divRowStyle}>
        <label htmlFor="characterName" style={labelStyle}>
          Character Name
        </label>{' '}
        <br />
        <input
          id="characterName"
          value={state.characterName}
          onChange={ev =>
            dispatch({ type: 'characterName', value: ev.target.value })
          }
          style={{
            width: '300px',
          }}
        />
      </div>
      <div style={divRowStyle}>
        <label htmlFor="characterNameLabel" style={labelStyle}>
          Character Name Label
        </label>{' '}
        <br />
        <input
          id="characterNameLabel"
          value={state.characterNameLabel}
          onChange={ev =>
            dispatch({ type: 'characterNameLabel', value: ev.target.value })
          }
          style={{
            width: '300px',
          }}
        />
      </div>
      <div style={divRowStyle}>
        <label htmlFor="portrait" style={labelStyle}>
          Portrait Sprite
        </label>{' '}
        <br />
        <input
          id="portrait"
          value={state.portrait}
          onChange={ev =>
            dispatch({ type: 'portrait', value: ev.target.value })
          }
          style={{
            width: '300px',
          }}
        />
      </div>
      <div style={divRowStyle}>
        <label htmlFor="decoration" style={labelStyle}>
          Decoration
        </label>{' '}
        <br />
        <input
          id="decoration"
          value={state.decoration}
          onChange={ev =>
            dispatch({ type: 'decoration', value: ev.target.value })
          }
          style={{
            width: '300px',
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

export default BasicCarcerDialogue;

const template = {
  nodes: [
    {
      id: 'h3wk2oo2h',
      type: 'declaration',
      content:
        "VAR_disposition = player.get('vars.disposition.' + player.get('dialog.name'))",
      left: '0px',
      top: '0px',
      rel: null,
      voice: false,
    },
    {
      id: 'hgpx8szei',
      type: 'switch',
      content: 'switch',
      left: '294px',
      top: '537px',
      voice: false,
    },
    {
      id: 'ise7r4t2z',
      type: 'switch_default',
      content: 'default',
      left: '914px',
      top: '801px',
      voice: false,
    },
    {
      id: 'qep62w3pl',
      type: 'action',
      content:
        "player.set('dialog.name', 'AldebethBlackrose');\r\nplayer.set('dialog.nameLabel', 'Aldebeth Blackrose');\r\nplayer.set('dialog.portrait', 'port_AldebethBlackrose_0');\r\nplayer.set('dialog.decoration', 'default');\r\n// calculate disposition\r\n// show dialog",
      left: '80px',
      top: '136px',
      rel: null,
      voice: false,
    },
    {
      id: 'zg1ngs803',
      type: 'switch_conditional',
      content: '$VAR_disposition > 75',
      left: '-45px',
      top: '707px',
      rel: null,
      voice: false,
    },
    {
      id: 'tgf0w65t5',
      type: 'switch_conditional',
      content: '$VAR_disposition > 30',
      left: '227px',
      top: '758px',
      rel: null,
      voice: false,
    },
    {
      id: 'pkxfhdwbf',
      type: 'switch_conditional',
      content: '$VAR_disposition > 90',
      left: '-350px',
      top: '656px',
      rel: null,
      voice: false,
    },
    {
      id: 'at6ernwz7',
      type: 'switch_conditional',
      content: '$VAR_disposition > 10',
      left: '572px',
      top: '796px',
      rel: null,
      voice: false,
    },
    {
      id: 'f6c4g5d9k',
      type: 'text',
      content:
        '"Welcome back.  Do you bring me good news?  It seems like you usually do."',
      left: '-384px',
      top: '769px',
      rel: null,
      voice: false,
    },
    {
      id: 'w4abc5bak',
      type: 'text',
      content: '"Hello again, comrade.  Did you wish to discus something?"',
      left: '-87px',
      top: '826px',
      rel: null,
      voice: false,
    },
    {
      id: 'wcg83zwqe',
      type: 'text',
      content:
        '"What is it?  Be quick, I have little time for idiosyncrasies."',
      left: '224px',
      top: '841px',
      rel: null,
      voice: false,
    },
    {
      id: 'kg3t4g0fb',
      type: 'text',
      content: 'You are met with a silent glare as you approach.',
      left: '533px',
      top: '872px',
      rel: null,
      voice: false,
    },
    {
      id: 'kgrdoqssn',
      type: 'text',
      content: 'This character refuses to speak with you.',
      left: '858px',
      top: '894px',
      rel: null,
      voice: false,
    },
    {
      id: 'chc50x0xr',
      type: 'next_file',
      content: 'exit',
      left: '911px',
      top: '1012px',
      voice: false,
    },
    {
      id: 'br5maxs12',
      type: 'switch_conditional',
      content: "player.once('AldebethBlackrose_spokenTo')",
      left: '-798px',
      top: '523px',
      rel: null,
      voice: false,
    },
    {
      id: 'pci9utt2e',
      type: 'action',
      content: "engine.setHasSpokenTo(player.get('dialog.name'));",
      left: '-825px',
      top: '599px',
      rel: null,
      voice: false,
    },
    {
      id: 'ooua45il6',
      type: 'choice',
      content: '',
      left: '430px',
      top: '1290px',
      voice: false,
    },
    {
      id: 'r7qyzkuqh',
      type: 'choice_text',
      content: '[Leave].',
      left: '954px',
      top: '1413px',
      voice: false,
      rel: null,
    },
    {
      id: 'og0r1k7ea',
      type: 'next_file',
      content: 'exit',
      left: '1037px',
      top: '1648px',
      voice: false,
    },
  ],
  links: [
    {
      from: 'h3wk2oo2h',
      to: 'qep62w3pl',
    },
    {
      from: 'hgpx8szei',
      to: 'ise7r4t2z',
    },
    {
      from: 'hgpx8szei',
      to: 'zg1ngs803',
    },
    {
      from: 'hgpx8szei',
      to: 'tgf0w65t5',
    },
    {
      from: 'hgpx8szei',
      to: 'pkxfhdwbf',
    },
    {
      from: 'hgpx8szei',
      to: 'at6ernwz7',
    },
    {
      from: 'hgpx8szei',
      to: 'br5maxs12',
    },
    {
      from: 'ise7r4t2z',
      to: 'kgrdoqssn',
    },
    {
      from: 'qep62w3pl',
      to: 'hgpx8szei',
    },
    {
      from: 'zg1ngs803',
      to: 'w4abc5bak',
    },
    {
      from: 'tgf0w65t5',
      to: 'wcg83zwqe',
    },
    {
      from: 'pkxfhdwbf',
      to: 'f6c4g5d9k',
    },
    {
      from: 'at6ernwz7',
      to: 'kg3t4g0fb',
    },
    {
      from: 'f6c4g5d9k',
      to: 'ooua45il6',
    },
    {
      from: 'w4abc5bak',
      to: 'ooua45il6',
    },
    {
      from: 'wcg83zwqe',
      to: 'ooua45il6',
    },
    {
      from: 'kg3t4g0fb',
      to: 'ooua45il6',
    },
    {
      from: 'kgrdoqssn',
      to: 'chc50x0xr',
    },
    {
      from: 'br5maxs12',
      to: 'pci9utt2e',
    },
    {
      from: 'ooua45il6',
      to: 'r7qyzkuqh',
    },
    {
      from: 'r7qyzkuqh',
      to: 'og0r1k7ea',
    },
  ],
};
