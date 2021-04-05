import { ReactNode } from 'react';
import { NodeVariant } from './document';
import { RelationVariant, RELATION_VARIANTS } from './relation';

export type PROVAttributeRange = 'DateTime' | 'Color' | 'Boolean' | 'Shape' | NodeVariant

export type PROVAttributeDefinition = {
  name: string;
  documentation?: ReactNode;
  url?: string;
  key: string;
  domain: (NodeVariant | RelationVariant)[];
  range: PROVAttributeRange;
  required?: boolean;
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
  {
    name: 'Agent',
    key: 'prov:agent',
    domain: ['wasAttributedTo', 'wasAssociatedWith'],
    range: 'agent',
    required: true,
  },
  {
    name: 'Entity',
    key: 'prov:entity',
    domain: ['wasGeneratedBy', 'used', 'wasInvalidatedBy', 'wasAttributedTo', 'hadMember'],
    range: 'entity',
    required: true,
  },
  {
    name: 'Activity',
    key: 'prov:activity',
    domain: ['wasGeneratedBy', 'used', 'wasStartedBy', 'wasEndedBy', 'wasInvalidatedBy', 'wasAssociatedWith', 'actedOnBehalfOf'],
    range: 'activity',
    required: true,
  },
  {
    name: 'Activity',
    key: 'prov:activity',
    domain: ['wasDerivedFrom'],
    range: 'activity',
  },
  {
    name: 'Time',
    key: 'prov:time',
    domain: ['wasGeneratedBy', 'used', 'wasStartedBy', 'wasInvalidatedBy'],
    range: 'DateTime',
  },
  {
    name: 'Informant',
    key: 'prov:informant',
    domain: ['wasInformedBy'],
    range: 'activity',
    required: true,
  },
  {
    name: 'Informed',
    key: 'prov:informed',
    domain: ['wasInformedBy'],
    range: 'activity',
    required: true,
  },
  {
    name: 'Trigger',
    key: 'prov:trigger',
    domain: ['wasStartedBy', 'wasEndedBy'],
    range: 'entity',
    required: true,
  },
  {
    name: 'Generated Entity',
    key: 'prov:generatedEntity',
    domain: ['wasDerivedFrom'],
    range: 'entity',
    required: true,
  },
  {
    name: 'Used Entity',
    key: 'prov:usedEntity',
    domain: ['wasDerivedFrom'],
    range: 'entity',
    required: true,
  },
  {
    name: 'Plan',
    key: 'prov:plan',
    domain: ['wasAssociatedWith'],
    range: 'entity',
  },
  {
    name: 'Delegate',
    key: 'prov:delegate',
    domain: ['actedOnBehalfOf'],
    range: 'agent',
    required: true,
  },
  {
    name: 'Responsible',
    key: 'prov:responsible',
    domain: ['actedOnBehalfOf'],
    range: 'agent',
    required: true,
  },
  {
    name: 'Influencer',
    key: 'prov:influencer',
    domain: ['wasInfluencedBy'],
    range: 'agent',
    required: true,
  },
  {
    name: 'Influencee',
    key: 'prov:influencee',
    domain: ['wasInfluencedBy'],
    range: 'agent',
    required: true,
  },
  {
    name: 'General Entity',
    key: 'prov:generalEntity',
    domain: ['specializationOf'],
    range: 'entity',
    required: true,
  },
  {
    name: 'Specific Entity',
    key: 'prov:specificEntity',
    domain: ['specializationOf'],
    range: 'entity',
    required: true,
  },
  {
    name: 'Alternate 1',
    key: 'prov:alternate1',
    domain: ['alternateOf'],
    range: 'entity',
    required: true,
  },
  {
    name: 'Alternate 2',
    key: 'prov:alternate2',
    domain: ['alternateOf'],
    range: 'entity',
    required: true,
  },
  {
    name: 'Collection',
    key: 'prov:collection',
    domain: ['hadMember'],
    range: 'entity',
    required: true,
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
    domain: ['activity', 'agent', 'entity', ...RELATION_VARIANTS],
    range: 'Boolean',
  },
  {
    name: 'Hide Attributes',
    key: 'provviz:hideAttributes',
    domain: ['activity', 'agent', 'entity', ...RELATION_VARIANTS],
    range: 'Boolean',
  },
];
