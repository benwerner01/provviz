import {
  PROVJSONBundle, PROVJSONDocument, RelationName, relations,
} from './document';

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
  namespace: {
    create: (document: PROVJSONDocument) => (
      prefixName: string, updatedValue: string,
    ): PROVJSONDocument => ({
      ...document,
      prefix: {
        ...document.prefix,
        [prefixName]: updatedValue,
      },
    }),
    delete: (document: PROVJSONDocument) => (
      prefix: string,
    ): PROVJSONDocument => {
      const { [prefix]: value, ...remainingNamespaces } = document.prefix;
      return ({
        ...document,
        prefix: remainingNamespaces,
      });
    },
    updateValue: (document: PROVJSONDocument) => (
      prefix: string, updatedValue: string,
    ): PROVJSONDocument => ({
      ...document,
      prefix: {
        ...document.prefix,
        [prefix]: updatedValue,
      },
    }),
    updatePrefix: (document: PROVJSONDocument) => (
      prevPrefix: string, updatedName: string,
    ): PROVJSONDocument => {
      const { [prevPrefix]: prevValue, ...updatedPrefix } = document.prefix;

      return ({
        ...updatePrefixesInObject(document)(prevPrefix, updatedName),
        prefix: {
          ...updatedPrefix,
          [updatedName]: prevValue,
        },
      });
    },
  },
  bundle: {
    create: (document: PROVJSONDocument) => (
      prefix: string, name: string,
    ): PROVJSONDocument => ({
      ...document,
      bundle: {
        ...document.bundle,
        [`${prefix}:${name}`]: {

        },
      },
    }),
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
  relation: {
    create: (document: PROVJSONDocument) => (
      relationName: RelationName, relationID: string, domainID: string, rangeID: string,
    ): PROVJSONDocument => {
      const { domainKey, rangeKey } = relations.find(({ name }) => name === relationName)!;
      return {
        ...document,
        [relationName]: {
          ...document[relationName],
          [relationID]: {
            [domainKey]: domainID,
            [rangeKey]: rangeID,
          },
        },
      };
    },
    delete: (bundle: PROVJSONBundle) => (
      relationName: RelationName, relationID: string,
    ): PROVJSONBundle => {
      const { [relationID]: value, ...remaining } = bundle[relationName] || {};
      return ({
        ...bundle,
        [relationName]: remaining,
        bundle: bundle.bundle
          ? Object.keys(bundle.bundle).reduce((prev, key) => ({
            ...prev,
            [key]: mutations.relation.delete(prev[key])(relationName, relationID),
          }), bundle.bundle)
          : bundle.bundle,
      });
    },
  },
};

export default mutations;
