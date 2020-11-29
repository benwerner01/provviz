import { PROVJSONDocument } from './document';

const maybeUpdateIdentifier = (identifier: string) => (
  prevID: string,
  updatedID: string,
) => (identifier === prevID ? updatedID : identifier);

const updateIdentifiersInObject = (obj: { [key: string]: any }) => (
  prevID: string,
  updatedID: string,
): { [key: string]: any } => {
  // The keys we need to update
  const updatedKeys = Object.keys(obj).filter((key) => key === prevID);
  // The keys we don't need to update
  const nonUpdatedKeys = Object.keys(obj).filter((key) => key !== prevID);

  return updatedKeys.reduce((prevObj, key) => Object.assign(prevObj, {
    [updatedID]: typeof obj[key] === 'object'
      ? updateIdentifiersInObject(obj[key])(prevID, updatedID)
      : typeof obj[key] === 'string'
        ? maybeUpdateIdentifier(obj[key])(prevID, updatedID)
        : obj[key],
  }), nonUpdatedKeys.reduce((prevObj, key) => Object.assign(prevObj, {
    [key]: typeof obj[key] === 'object'
      ? updateIdentifiersInObject(obj[key])(prevID, updatedID)
      : typeof obj[key] === 'string'
        ? maybeUpdateIdentifier(obj[key])(prevID, updatedID)
        : obj[key],
  }), {}));
};

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

const mutations = {
  updateIdentifier: (document: PROVJSONDocument) => (
    prevID: string, updatedID: string,
  ): PROVJSONDocument => {
    const { prefix, ...remaining } = document;

    return ({
      prefix,
      ...updateIdentifiersInObject(remaining)(prevID, updatedID),
    });
  },
  prefix: {
    updateValue: (document: PROVJSONDocument) => (
      prefixName: string, updatedValue: string,
    ): PROVJSONDocument => ({
      ...document,
      prefix: {
        ...document.prefix,
        [prefixName]: updatedValue,
      },
    }),
    updateName: (document: PROVJSONDocument) => (
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
    },
  },
  agent: {
    create: (document: PROVJSONDocument) => (
      prefix: string, name: string,
    ): PROVJSONDocument => ({
      ...document,
      agent: {
        ...document.agent,
        [`${prefix}:${name}`]: {

        },
      },
    }),
  },
  activity: {
    create: (document: PROVJSONDocument) => (
      prefix: string, name: string,
    ): PROVJSONDocument => ({
      ...document,
      activity: {
        ...document.activity,
        [`${prefix}:${name}`]: {

        },
      },
    }),
  },
  entity: {
    create: (document: PROVJSONDocument) => (
      prefix: string, name: string,
    ): PROVJSONDocument => ({
      ...document,
      entity: {
        ...document.entity,
        [`${prefix}:${name}`]: {

        },
      },
    }),
  },
};

export default mutations;
