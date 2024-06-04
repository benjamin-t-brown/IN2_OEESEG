import { getMouseDiagramPosContext } from 'context';
import expose from '../expose';

export const getClassCheckForkTemplate = () => {
  const mouseCoords = getMouseDiagramPosContext();

  const x = mouseCoords.x * expose.get_state('board').getScale() - 600;
  const y = mouseCoords.y * expose.get_state('board').getScale() - 600;

  return {
    template: structuredClone(template),
    location: { left: -x, top: -y },
    replaceNodeIds: [],
  };
};

const template = {
  nodes: [
    {
      id: 'bcrxoetal',
      type: 'pass_fail',
      content: "engine.isClass('Cleric')",
      left: '0px',
      top: '0px',
      voice: false,
      rel: null,
    },
    {
      id: 'ddewgmaxn',
      type: 'pass_text',
      content: '',
      left: '0px',
      top: '110px',
      voice: false,
    },
    {
      id: 't6gw1yprc',
      type: 'fail_text',
      content: '',
      left: '136px',
      top: '113px',
      voice: false,
    },
    {
      id: 'ol4bufgmu',
      type: 'text',
      content: 'You are a cleric.',
      left: '-156px',
      top: '206px',
      voice: false,
      rel: null,
    },
    {
      id: 'p37f0bqau',
      type: 'text',
      content: 'You are not a cleric.',
      left: '141px',
      top: '205px',
      rel: null,
      voice: false,
    },
  ],
  links: [
    {
      from: 'bcrxoetal',
      to: 'ddewgmaxn',
    },
    {
      from: 'bcrxoetal',
      to: 't6gw1yprc',
    },
    {
      from: 'ddewgmaxn',
      to: 'ol4bufgmu',
    },
    {
      from: 't6gw1yprc',
      to: 'p37f0bqau',
    },
  ],
};
