import React from 'react';
import css from 'css';
import utils from '../utils';
import { getMouseDiagramPosContext } from 'context';
import expose from '../expose';

export const getPersonalityTestTemplate = () => {
  const mouseCoords = getMouseDiagramPosContext();

  const x = mouseCoords.x * expose.get_state('board').getScale() - 400;
  const y = mouseCoords.y * expose.get_state('board').getScale();

  const newTemplate = structuredClone(template);
  newTemplate.nodes.forEach(node => {
    if (node.combinedConditionalChoice) {
      node.combinedConditionalChoice.id = utils.random_id();
      node.combinedConditionalChoice.actionId = utils.random_id();
    }
  });
  return {
    template: newTemplate,
    location: { left: -x, top: -y },
    replaceNodeIds: [],
  };
};

const template = {
  nodes: [
    {
      id: 'gfmfkii97',
      type: 'choice',
      content: '',
      left: '0px',
      top: '0px',
      voice: false,
    },
    {
      id: 'lf0g9rtgl',
      type: 'combined_conditional_choice',
      content: "It wasn't on purpose.  I just wanted to help.",
      left: '-864px',
      top: '139px',
      combinedConditionalChoice: {
        id: 'gcnwtgigm',
        actionId: 'afxabdfih',
        conditionContent: 'true',
        prefixText: 'Aspect: Dryad',
        showTextOnFailedCondition: false,
        failedConditionText: 'Not available.',
        doActionOnChoose: true,
        onChooseActionContent: "engine.updateAspect('dryad', 1);",
      },
      rel: null,
      voice: false,
    },
    {
      id: 'ri4ddpt8l',
      type: 'combined_conditional_choice',
      content: 'It was just a prank, relax.',
      left: '-476px',
      top: '176px',
      combinedConditionalChoice: {
        id: 'o436qurmu',
        actionId: 'gyqg',
        conditionContent: 'true',
        prefixText: 'Aspect: Dragon',
        showTextOnFailedCondition: false,
        failedConditionText: 'Not available.',
        doActionOnChoose: true,
        onChooseActionContent: "engine.updateAspect('dragon', 1);",
      },
      rel: null,
      voice: false,
    },
    {
      id: 'f7pcrqsce',
      type: 'combined_conditional_choice',
      content: '...',
      left: '294px',
      top: '247px',
      combinedConditionalChoice: {
        id: 'o436qurmu',
        actionId: 'fdag2',
        conditionContent: 'true',
        prefixText: 'Aspect: Umbra',
        showTextOnFailedCondition: false,
        failedConditionText: 'Not available.',
        doActionOnChoose: true,
        onChooseActionContent: "engine.updateAspect('umbra', 1);",
      },
      rel: null,
      voice: false,
    },
    {
      id: 'p8gg7x5fe',
      type: 'combined_conditional_choice',
      content: 'Just trying to get your attention, milady.',
      left: '-84px',
      top: '205px',
      combinedConditionalChoice: {
        id: 'o436qurmu',
        actionId: 'jjajkaka',
        conditionContent: 'true',
        prefixText: 'Aspect: Golem',
        showTextOnFailedCondition: false,
        failedConditionText: 'Not available.',
        doActionOnChoose: true,
        onChooseActionContent: "engine.updateAspect('golem', 1);",
      },
      rel: null,
      voice: false,
    },
    {
      id: 'pe9pxc01r',
      type: 'text',
      content: '"So you are simply incompetent.  That is good to know."',
      left: '-841px',
      top: '281px',
      rel: null,
      voice: false,
    },
    {
      id: 'ihsw51a9u',
      type: 'text',
      content: '"I see.  It is lucky for you that nothing worse happened."',
      left: '-447px',
      top: '301px',
      rel: null,
      voice: false,
    },
    {
      id: 'gwhruwfh1',
      type: 'text',
      content: '"Well you have it now, I suppose."',
      left: '-81px',
      top: '319px',
      rel: null,
      voice: false,
    },
    {
      id: 'u1f8q830u',
      type: 'text',
      content: '"Your silence is quite telling."',
      left: '278px',
      top: '343px',
      rel: null,
      voice: false,
    },
    {
      id: 'snnc5osg3',
      type: 'combined_conditional_choice',
      content: 'Perhaps, perhaps not.  What is it to you?',
      left: '645px',
      top: '252px',
      combinedConditionalChoice: {
        id: 'o436qurmu',
        actionId: 'a8236h',
        conditionContent: 'true',
        prefixText: 'Aspect: Fae',
        showTextOnFailedCondition: false,
        failedConditionText: 'Not available.',
        doActionOnChoose: true,
        onChooseActionContent: "engine.updateAspect('fae', 1);",
      },
      rel: null,
      voice: false,
    },
    {
      id: 'c85hk00r3',
      type: 'text',
      content:
        '"Oh please.  Clearly you are here *because* of that incident, and it is baffling that you thought you could be vague about it."',
      left: '652px',
      top: '390px',
      rel: null,
      voice: false,
    },
  ],
  links: [
    {
      from: 'gfmfkii97',
      to: 'lf0g9rtgl',
    },
    {
      from: 'gfmfkii97',
      to: 'ri4ddpt8l',
    },
    {
      from: 'gfmfkii97',
      to: 'f7pcrqsce',
    },
    {
      from: 'gfmfkii97',
      to: 'p8gg7x5fe',
    },
    {
      from: 'gfmfkii97',
      to: 'snnc5osg3',
    },
    {
      from: 'lf0g9rtgl',
      to: 'pe9pxc01r',
    },
    {
      from: 'ri4ddpt8l',
      to: 'ihsw51a9u',
    },
    {
      from: 'f7pcrqsce',
      to: 'u1f8q830u',
    },
    {
      from: 'p8gg7x5fe',
      to: 'gwhruwfh1',
    },
    {
      from: 'snnc5osg3',
      to: 'c85hk00r3',
    },
  ],
};
