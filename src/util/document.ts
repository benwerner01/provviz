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

export type Relation = {
  name: RelationName;
  domain: 'activity' | 'agent' | 'entity';
  range: 'activity' | 'agent' | 'entity';
  timestamp?: boolean;
}

export const relations: Relation[] = [
  { name: 'wasGeneratedBy', domain: 'entity', range: 'activity' },
  { name: 'used', domain: 'activity', range: 'entity' },
  { name: 'wasInformedBy', domain: 'activity', range: 'activity' },
  {
    name: 'wasStartedBy', domain: 'activity', range: 'entity', timestamp: true,
  },
  {
    name: 'wasEndedBy', domain: 'activity', range: 'entity', timestamp: true,
  },
  {
    name: 'wasInvalidatedBy', domain: 'entity', range: 'activity', timestamp: true,
  },
  { name: 'wasDerivedFrom', domain: 'entity', range: 'entity' },
  { name: 'wasAttributedTo', domain: 'entity', range: 'agent' },
  { name: 'wasAssociatedWith', domain: 'activity', range: 'entity' },
  { name: 'actedOnBehalfOf', domain: 'agent', range: 'agent' },
  { name: 'wasInfluencedBy', domain: 'entity', range: 'agent' },
  { name: 'specializationOf', domain: 'entity', range: 'entity' },
  { name: 'alternateOf', domain: 'entity', range: 'entity' },
  { name: 'hadMember', domain: 'entity', range: 'entity' },
];

export interface PROVJSONBundle {
  bundle?: {
    [bundleID: string]: PROVJSONBundle;
  }
  agent?: {
    [agentID: string]: {

    }
  }
  actedOnBehalfOf?: {
    [relationID: string]: {
      'prov:delegate': string;
      'prov:responsible': string;
      'prov:activity': string;
      'prov:type': string;
    }
  }
  wasInfluencedBy?: {
    [relationID: string]: {
      'prov:influencer': string;
      'prov:influencee': string;
    }
  }
  activity?: {
    [acitivtyID: string]: {
      'prov:activity'?: string;
      'prov:plan'?: string;
    }
  }
  wasInformedBy?: {
    [relationID: string]: {
      'prov:informant': string;
      'prov:informed': string;
    }
  }
  used?: {
    [relationID: string]: {
      'prov:entity': string;
      'prov:activity': string;
      'ex:parameter': string;
      'prov:time': string;
    }
  }
  wasAssociatedWith?: {
    [relationID: string]: {
      'prov:activity': string;
      'prov:plan': string;
    }
  }
  entity?: {
    [entityID: string]: {

    }
  }
  wasGeneratedBy?: {
    [relationID: string]: {
      'prov:entity': string;
      'prov:activity': string;
      'prov:time'?: string;
      'ex:port'?: string;
    }
  }
  wasStartedBy?: {
    [relationID: string]: {
      'prov:activity': string;
      'prov:time': string;
      'prov:trigger': string;
    }
  }
  wasEndedBy?: {
    [relationID: string]: {
      'prov:activity': string;
      'prov:trigger': string;
    }
  }
  wasInvalidatedBy?: {
    [relationID: string]: {
      'prov:activity': string;
      'prov:time': string;
      'ex:circumstances': string;
      'prov:entity': string;
    }
  }
  wasDerivedFrom?: {
    [relationID: string]: {
      'prov:activity': string;
      'prov:generatedEntity': string;
      'prov:usage': string;
      'prov:generation': string;
      'prov:usedEntity': string;
    }
  }
  wasAttributedTo?: {
    [relationID: string]: {
      'prov:type': string;
      'prov:agent': string;
      'prov:entity': string;
    }
  }
  specializationOf?: {
    [relationID: string]: {
      'prov:generalEntity': string;
      'prov:specificEntity': string;
    }
  }
  alternateOf?: {
    [relationID: string]: {
      'prov:alternate1': string;
      'prov:alternate2': string;
    }
  }
  hadMember?: {
    [relationID: string]: {
      'prov:collection': string;
      'prov:entity': string[];
    }
  }
}

export interface PROVJSONDocument extends PROVJSONBundle {
  prefix: {
    [prefixName: string]: string;
  }
}

export const tbdIsPROVJSONDocument = (tbd: object): tbd is PROVJSONDocument => true;
