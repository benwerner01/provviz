export type RelationName = 'wasGeneratedBy'
  | 'used'
  | 'wasInformedBy'
  | 'wasStartedBy'
  | 'wasEndedBy'
  | 'wasInvalidatedBy'
  | 'wasDerivedFrom'
  | 'wasAttributedTo'
  | 'wasAssociatedWith'
  | 'actedOnBehalfOf'
  | 'wasInfluencedBy'
  | 'specializationOf'
  | 'alternateOf'
  | 'hadMember'

export const RELATION_NAMES: RelationName[] = [
  'wasGeneratedBy',
  'used',
  'wasInformedBy',
  'wasStartedBy',
  'wasEndedBy',
  'wasInvalidatedBy',
  'wasDerivedFrom',
  'wasAttributedTo',
  'wasAssociatedWith',
  'actedOnBehalfOf',
  'wasInfluencedBy',
  'specializationOf',
  'alternateOf',
  'hadMember',
];

export type Relation = {
  name: RelationName;
  domain: 'activity' | 'agent' | 'entity';
  domainKey: string;
  range: 'activity' | 'agent' | 'entity';
  rangeKey: string;
  timestamp?: boolean;
}

export const RELATIONS: Relation[] = [
  {
    name: 'wasGeneratedBy', domain: 'entity', domainKey: 'prov:entity', range: 'activity', rangeKey: 'prov:activity',
  },
  {
    name: 'used', domain: 'activity', domainKey: 'prov:activity', range: 'entity', rangeKey: 'prov:entity',
  },
  {
    name: 'wasInformedBy', domain: 'activity', domainKey: 'prov:informed', range: 'activity', rangeKey: 'prov:informant',
  },
  {
    name: 'wasStartedBy', domain: 'activity', domainKey: 'prov:activity', range: 'entity', rangeKey: 'prov:trigger', timestamp: true,
  },
  {
    name: 'wasEndedBy', domain: 'activity', domainKey: 'prov:activity', range: 'entity', rangeKey: 'prov:trigger', timestamp: true,
  },
  {
    name: 'wasInvalidatedBy', domain: 'entity', domainKey: 'prov:entity', range: 'activity', rangeKey: 'prov:activity', timestamp: true,
  },
  {
    name: 'wasDerivedFrom', domain: 'entity', domainKey: 'prov:generatedEntity', range: 'entity', rangeKey: 'prov:usedEntity',
  },
  {
    name: 'wasAttributedTo', domain: 'entity', domainKey: 'prov:entity', range: 'agent', rangeKey: 'prov:agent',
  },
  {
    name: 'wasAssociatedWith', domain: 'activity', domainKey: 'prov:activity', range: 'agent', rangeKey: 'prov:agent',
  },
  {
    name: 'actedOnBehalfOf', domain: 'agent', domainKey: 'prov:delegate', range: 'agent', rangeKey: 'prov:responsible',
  },
  {
    name: 'wasInfluencedBy', domain: 'entity', domainKey: 'prov:influencer', range: 'agent', rangeKey: 'prov:influencee',
  },
  {
    name: 'specializationOf', domain: 'entity', domainKey: 'prov:specificEntity', range: 'entity', rangeKey: 'prov:generalEntity',
  },
  {
    name: 'alternateOf', domain: 'entity', domainKey: 'prov:alternate1', range: 'entity', rangeKey: 'prov:alternate2',
  },
  {
    name: 'hadMember', domain: 'entity', domainKey: 'prov:collection', range: 'entity', rangeKey: 'prov:entity',
  },
];

export type NodeVariant = 'activity' | 'agent' | 'entity' | 'bundle'

export const NODE_VARIANTS: NodeVariant[] = ['activity', 'agent', 'entity', 'bundle'];

export const tbdIsNodeVariant = (tbd: string): tbd is NodeVariant => (
  NODE_VARIANTS.includes(tbd as NodeVariant)
);

export type PROVAttributeRange = 'DateTime'

export type PROVAttributeDefinition = {
  name: string;
  key: string;
  domain: NodeVariant;
  range: PROVAttributeRange
}

export const ATTRIBUTE_DEFINITIONS: PROVAttributeDefinition[] = [
  {
    name: 'Started At Time',
    key: 'prov:startedAtTime',
    domain: 'activity',
    range: 'DateTime',
  },
  {
    name: 'Ended At Time',
    key: 'prov:endedAtTime',
    domain: 'activity',
    range: 'DateTime',
  },
];

type TypedLiteral = {
  '$': string;
  type: string;
  lang?: string;
}

type LiteralArray = (string | number | boolean | TypedLiteral)[]

export type AttributeValue = string
| number
| boolean
| TypedLiteral
| LiteralArray

type Entity = { [attributeKey: string]: AttributeValue; }

type Agent = Entity

type Activity = {
  'prov:startTime'?: string;
  'prov:endTime'?: string;
} & { [attributeKey: string]: AttributeValue; }

type Generation = {
  'prov:entity': string;
  'prov:activity': string;
  'prov:time'?: string
} & { [attributeKey: string]: AttributeValue; }

type Usage = Generation;

type Communication = {
  'prov:informant': string;
  'prov:informed': string;
} & { [attributeKey: string]: AttributeValue; }

type Start = {
  'prov:activity': string;
  'prov:time'?: string;
  'prov:trigger'?: string;
} & { [attributeKey: string]: AttributeValue; }

type End = Start

type Invalidation = {
  'prov:entity': string;
  'prov:time'?: string;
  'prov:activity'?: string;
} & { [attributeKey: string]: AttributeValue; }

type Derivation = {
  'prov:generatedEntity': string;
  'prov:usedEntity': string;
  'prov:activity'?: string;
  'prov:generation'?: string;
  'prov:usage'?: string;
} & { [attributeKey: string]: AttributeValue; }

type Attribution = {
  'prov:entity': string;
  'prov:agent': string;
} & { [attributeKey: string]: AttributeValue; }

type Association = {
  'prov:activity': string;
  'prov:agent'?: string;
  'prov:plan'?: string;
} & { [attributeKey: string]: AttributeValue; }

type Delegation = {
  'prov:delegate': string;
  'prov:responsible': string;
  'prov:activity'?: string;
  'prov:type'?: string;
} & { [attributeKey: string]: AttributeValue; }

type Influence = {
  'prov:influencer': string;
  'prov:influencee': string;
} & { [attributeKey: string]: AttributeValue; }

type Specialization = {
  'prov:generalEntity': string;
  'prov:specificEntity': string;
} & { [attributeKey: string]: AttributeValue; }

type Alternate = {
  'prov:alternate1': string;
  'prov:alternate2': string;
} & { [attributeKey: string]: AttributeValue; }

type Membership = {
  'prov:collection': string;
  'prov:entity': string;
} & { [attributeKey: string]: AttributeValue; }

export interface PROVJSONBundle {
  prefix?: { [prefixName: string]: string; }
  bundle?: { [bundleID: string]: PROVJSONBundle; }
  agent?: { [agentID: string]: { [attributeKey: string]: AttributeValue; } }
  actedOnBehalfOf?: { [relationID: string]: Delegation }
  wasInfluencedBy?: { [relationID: string]: Influence }
  activity?: { [acitivtyID: string]: Activity }
  wasInformedBy?: { [relationID: string]: Communication }
  used?: { [relationID: string]: Usage }
  wasAssociatedWith?: { [relationID: string]: Association }
  entity?: { [entityID: string]: Entity }
  wasGeneratedBy?: { [relationID: string]: Generation }
  wasStartedBy?: { [relationID: string]: Start }
  wasEndedBy?: { [relationID: string]: End }
  wasInvalidatedBy?: { [relationID: string]: Invalidation }
  wasDerivedFrom?: { [relationID: string]: Derivation }
  wasAttributedTo?: { [relationID: string]: Attribution }
  specializationOf?: { [relationID: string]: Specialization }
  alternateOf?: { [relationID: string]: Alternate }
  hadMember?: { [relationID: string]: Membership }
}

export const tbdIsPROVJSONBundle = (tbd: object): tbd is PROVJSONBundle => true;
