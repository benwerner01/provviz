import React, { ReactNode } from 'react';
import { NodeVariant } from './document';

export type PROVAttributeRange = 'DateTime' | 'Color' | 'Boolean' | 'Shape'

export type PROVAttributeDefinition = {
  name: string;
  documentation?: ReactNode;
  url?: string;
  key: string;
  domain: NodeVariant[];
  range: PROVAttributeRange
}

export const ATTRIBUTE_DEFINITIONS: PROVAttributeDefinition[] = [
  {
    name: 'Started At Time',
    key: 'prov:startTime',
    documentation: 'Start is when an activity is deemed to have been started by an entity, known as trigger. The activity did not exist before its start. Any usage, generation, or invalidation involving an activity follows the activity\'s start. A start may refer to a trigger entity that set off the activity, or to an activity, known as starter, that generated the trigger.',
    url: 'https://www.w3.org/TR/prov-o/#startedAtTime',
    domain: ['activity'],
    range: 'DateTime',
  },
  {
    name: 'Ended At Time',
    key: 'prov:endTime',
    documentation: 'End is when an activity is deemed to have been ended by an entity, known as trigger. The activity no longer exists after its end. Any usage, generation, or invalidation involving an activity precedes the activity\'s end. An end may refer to a trigger entity that terminated the activity, or to an activity, known as ender that generated the trigger.',
    url: 'https://www.w3.org/TR/prov-o/#endedAtTime',
    domain: ['activity'],
    range: 'DateTime',
  },
];

export const PROVVIZ_ATTRIBUTE_DEFINITIONS: PROVAttributeDefinition[] = [
  {
    name: 'Override Color',
    key: 'provviz:color',
    domain: ['activity', 'agent', 'entity'],
    range: 'Color',
  },
  {
    name: 'Override Shape',
    key: 'provviz:shape',
    domain: ['activity', 'agent', 'entity'],
    range: 'Shape',
  },
  {
    name: 'Hide',
    key: 'provviz:hide',
    domain: ['activity', 'agent', 'entity'],
    range: 'Boolean',
  },
  {
    name: 'Hide Attributes',
    key: 'provviz:hideAttributes',
    domain: ['activity', 'agent', 'entity'],
    range: 'Boolean',
  },
];
