import React, { createRef } from 'react';

// `<div class="node-id">${node.id}${
//     node.rel
//       ? ` -> <span class="node-id-ref" onclick="center_on_active_node('${node.rel}')">` +
//         node.rel +
//         '</span>'
//       : ''
//   }</div>` +
//   `<div class="item-content" ${content_style}><span class="no-select">${node.content}</span></div>` +
//   `<div class="anchor-to" id="${node.id}_to"></div>` +
//   `<div class="anchor-from" id="${node.id}_from"></div>` +
//   (node.type === 'root' ||
//   node.type === 'pass_text' ||
//   node.type === 'fail_text'
//     ? ''
//     : `<div onclick="on_delete_click(${node.id})" class="item-delete" id="${
//         node.id
//       }_delete" style="${
//         node.type === 'choice' || node.type === 'switch' ? 'right:10' : ''
//       }"><span class="no-select">X</span></div>`) +

/**
 * @typedef {import('./board.jsx').BoardNode} BoardNode
 */
/**
 * @typedef {import('./board.jsx').CombinedConditionalChoiceSubNode} CombinedConditionalChoiceSubNode
 */

const DiagramNode = props => {
  /** @type {BoardNode} */
  const node = props.node;
  const style = {
    left: node.left || null,
    top: node.top || null,
    width: node.width || null,
    height: node.height || null,
  };
  const contentStyle = {};
  if (
    node.type === 'next_file' ||
    node.type === 'pass_fail' ||
    node.type === 'choice_conditional'
  ) {
    contentStyle.overflow = 'hidden';
    contentStyle.textOverflow = 'ellipsis';
  }
  const className = 'item item-' + node.type;

  const getPrefix = () => {
    if (node.combinedConditionalChoice?.prefixText) {
      return '[' + node.combinedConditionalChoice.prefixText + '] ';
    }
    return '';
  };

  return (
    <div
      id={node.id}
      className={`node ${className}`}
      style={style}
      onMouseDown={() => window.on_node_click(document.getElementById(node.id))}
      onMouseUp={() => window.on_node_unclick(document.getElementById(node.id))}
      onClick={() => window.on_node_click(document.getElementById(node.id))}
      onDoubleClick={() =>
        window.on_node_dblclick(document.getElementById(node.id))
      }
      onContextMenu={ev => {
        ev.preventDefault();
        ev.stopPropagation();
        window.on_node_rclick(document.getElementById(node.id));
      }}
      onMouseEnter={() =>
        window.on_node_mouseover(document.getElementById(node.id))
      }
      onMouseOut={() =>
        window.on_node_mouseout(document.getElementById(node.id))
      }
    >
      {node.type === 'combined_conditional_choice' ? (
        <div
          style={{
            position: 'absolute',
            top: -28,
            background: 'rgba(153, 0, 77, 0.5)',
            padding: '5px',
            borderBottomLeftRadius: '5px',
            borderBottomRightRadius: '5px',
            width: '80%',
            maxHeight: '18px',
            overflow: 'hidden',
          }}
        >
          {node.combinedConditionalChoice.conditionContent}
        </div>
      ) : null}
      <div className="node-id">
        {node.id}
        {node.rel ? (
          <>
            {' -> '}
            <span
              className="node-id-ref"
              onClick={() => window.center_on_active_node(node.rel)}
            >
              {node.rel}
            </span>
          </>
        ) : (
          ''
        )}
      </div>
      <div className="item-content" style={contentStyle}>
        <span className="no-select">
          {getPrefix()}
          {node.content}
        </span>
      </div>
      {node.type === 'combined_conditional_choice' &&
      node.combinedConditionalChoice?.doActionOnChoose ? (
        <div
          style={{
            position: 'absolute',
            // top: 58,
            marginTop: '10px',
            background: 'rgba(78, 136, 97, 0.5)',
            padding: '5px',
            borderBottomLeftRadius: '5px',
            borderBottomRightRadius: '5px',
            width: '80%',
            // maxHeight: 'px',
            overflow: 'hidden',
          }}
        >
          {node.combinedConditionalChoice.onChooseActionContent}
        </div>
      ) : null}
      <div className="anchor-to" id={node.id + '_to'}></div>
      <div className="anchor-from" id={node.id + '_from'}></div>
      {node.type === 'root' ||
      node.type === 'pass_text' ||
      node.type === 'fail_text' ? (
        ''
      ) : (
        <div
          onClick={() => window.on_delete_click(node.id)}
          className="item-delete"
          id={node.id + '_delete'}
          style={{
            right: node.type === 'choice' || node.type === 'switch' ? 10 : '',
          }}
        >
          <span className="no-select">X</span>
        </div>
      )}
    </div>
  );
};

export default DiagramNode;
