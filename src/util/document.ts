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
      'prov:time': string;
      'ex:port': string;
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
