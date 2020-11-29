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
  domainKey: string;
  range: 'activity' | 'agent' | 'entity';
  rangeKey: string;
  timestamp?: boolean;
}

export const relations: Relation[] = [
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
      'prov:agent': string;
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
