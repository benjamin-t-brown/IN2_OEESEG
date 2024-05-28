import { getNode } from 'board';
import DiagramNode from 'diagram-node';
import React, { createRef, useEffect, useReducer } from 'react';
const jsPlumb = window.jsPlumb;

export const getPlumb = () => {
  return window.plumb;
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
    if (!drawStuffTrip && drawStuff && plumbReady && diagram && file) {
      console.log('re-instance plumb');
      const plumb = getPlumb();
      plumb && plumb.reset();
      window.plumb = jsPlumb.getInstance({
        PaintStyle: { strokeWidth: 1 },
        Anchors: [['TopRight']],
        Container: diagram.current,
      });

      drawStuff = false;
      forceUpdate();
      setTimeout(() => {
        drawStuff = true;
        drawStuffTrip = true;
        forceUpdate();
      }, 1);

      setTimeout(() => {
        console.log('batch connect');

        window.plumb.setSuspendDrawing(true);
        window.plumb.batch(() => {
          for (const link of file.links ?? []) {
            connectLink(link);
          }
        });
        window.plumb.setSuspendDrawing(false, true);

        window.plumb.draggable(
          file?.nodes?.map(node => {
            return node.id;
          }) || [],
          {
            containment: true,
          }
        );
      }, 2);
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
