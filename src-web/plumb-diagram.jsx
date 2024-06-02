import { getNode } from 'board';
import DiagramNode from 'diagram-node';
import React, { createRef, useEffect, useReducer } from 'react';
// const jsPlumb = window.jsPlumb;
import * as jsPlumb from '@jsplumb/browser-ui';
import '@jsplumb/browser-ui/css/jsplumbtoolkit.css';
import expose from './expose';
import utils from './utils';

export const getPlumb = () => {
  return window.plumb;
};

const verifyAndFixDiagram = file => {
  file.links = file.links.filter(link => {
    if (!link.to && !link.from) {
      return false;
    }
    return (
      file.nodes.find(node => node.id === link.to) &&
      file.nodes.find(node => node.id === link.from)
    );
  });
  return file;
};

let lastFile = null;
let drawStuff = true;
let drawStuffTrip = false;

const PlumbDiagram = ({
  file,
  classes,
  renderAtOffset,
  loadLocation,
  connectLink,
  onConnRClick,
  zoom,
}) => {
  const diagram = createRef();
  const [plumbReady, setPlumbReady] = React.useState(false);
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  //   const [currentFile, setCurrentFile] = React.useState(file);

  useEffect(() => {
    if (diagram.current && !plumbReady) {
      jsPlumb.ready(() => {
        console.log('plumb ready');
        setPlumbReady(true);
      });
    }
  }, [diagram, plumbReady]);

  useEffect(() => {
    if (!drawStuffTrip && drawStuff && plumbReady && diagram.current && file) {
      console.log('re-instance plumb');
      const plumb = getPlumb();
      if (plumb) {
        for (const node of file.nodes) {
          window.plumb.unmanage(document.getElementById(node.id), false);
        }
        plumb.destroy();
      }
      window.plumb = jsPlumb.newInstance({
        container: diagram.current,
        connectionsDetachable: false,
        dragOptions: {
          containment: 'parentEnclosed',
        },
      });

      window.plumb.bind('connection:contextmenu', (...args) => {
        onConnRClick(...args);
      });
      window.plumb.bind('connection:click', (...args) => {
        const conn = args[0];
        const board = expose.get_state('board');
        console.log('click conn');
        if (!board.didPan) {
          if (utils.is_ctrl()) {
            board.centerOnNode(conn.sourceId);
          } else {
            board.centerOnNode(conn.targetId);
          }
        }
        // onConnRClick(...args);
      });

      for (const node of file.nodes) {
        window.plumb.manage(document.getElementById(node.id), node.id);
      }

      window.plumb.setSuspendDrawing(true);
      verifyAndFixDiagram(file);
      window.plumb.batch(() => {
        for (const link of file.links ?? []) {
          connectLink(link);
        }
      });
      window.plumb.setSuspendDrawing(false, true);
      getPlumb().setZoom(zoom);

      if (file !== lastFile) {
        lastFile = file;
        loadLocation();
      }
    }
    if (drawStuffTrip) {
      drawStuffTrip = false;
    }
  });

  console.log('render plumb diagram');

  return (
    <div id="diagram" ref={diagram} className={'no-drag ' + classes.diagram}>
      {!drawStuff
        ? null
        : file?.nodes.map(node => {
            return <DiagramNode key={node.id} node={node} />;
          })}
    </div>
  );
};

export default PlumbDiagram;
