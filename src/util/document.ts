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

export const createAgent = (document: PROVJSONDocument) => (
  prefix: string, agentID: string,
): PROVJSONDocument => ({
  ...document,
  agent: {
    ...document.agent,
    [`${prefix}:${agentID}`]: {

    },
  },
});

export const createActivity = (document: PROVJSONDocument) => (
  prefix: string, activityID: string,
): PROVJSONDocument => ({
  ...document,
  activity: {
    ...document.activity,
    [`${prefix}:${activityID}`]: {

    },
  },
});

export const createEntity = (document: PROVJSONDocument) => (
  prefix: string, entityID: string,
): PROVJSONDocument => ({
  ...document,
  entity: {
    ...document.entity,
    [`${prefix}:${entityID}`]: {

    },
  },
});

const maybeUpdatePrefixNameInIdentifier = (identifier: string) => (
  prevPrefixName: string,
  updatedPrefixName: string,
) => (identifier.startsWith(`${prevPrefixName}:`)
  ? identifier.replace(`${prevPrefixName}:`, `${updatedPrefixName}:`)
  : identifier);

const updatePrefixesInObject = (obj: { [key: string]: any }) => (
  prevPrefixName: string,
  updatedPrefixName: string,
): { [key: string]: any } => {
  // The keys we need to update, because they include the updated prefix
  const updatedKeys = Object.keys(obj).filter((key) => key.startsWith(`${prevPrefixName}:`));
  // The keys we don't need to update, because they don't include the updated prefix
  const nonUpdatedKeys = Object.keys(obj).filter((key) => !updatedKeys.includes(key));

  return updatedKeys.reduce((prevObj, key) => Object.assign(prevObj, {
    [key.replace(`${prevPrefixName}:`, `${updatedPrefixName}:`)]: typeof obj[key] === 'object'
      ? updatePrefixesInObject(obj[key])(prevPrefixName, updatedPrefixName)
      : typeof obj[key] === 'string'
        ? maybeUpdatePrefixNameInIdentifier(obj[key])(prevPrefixName, updatedPrefixName)
        : obj[key],
  }), nonUpdatedKeys.reduce((prevObj, key) => Object.assign(prevObj, {
    [key]: typeof obj[key] === 'object'
      ? updatePrefixesInObject(obj[key])(prevPrefixName, updatedPrefixName)
      : typeof obj[key] === 'string'
        ? maybeUpdatePrefixNameInIdentifier(obj[key])(prevPrefixName, updatedPrefixName)
        : obj[key],
  }), {}));
};

export const updatePrefixName = (document: PROVJSONDocument) => (
  prevName: string, updatedName: string,
): PROVJSONDocument => {
  const { [prevName]: prevValue, ...updatedPrefix } = document.prefix;

  return ({
    ...updatePrefixesInObject(document)(prevName, updatedName),
    prefix: {
      ...updatedPrefix,
      [updatedName]: prevValue,
    },
  });
};

export const updatePrefixValue = (document: PROVJSONDocument) => (
  prefixName: string, updatedValue: string,
): PROVJSONDocument => ({
  ...document,
  prefix: {
    ...document.prefix,
    [prefixName]: updatedValue,
  },
});
