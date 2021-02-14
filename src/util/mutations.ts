import {
  NodeVariant,
  PROVJSONBundle,
  PROVAttributeDefinition,
  RelationName,
  RELATIONS,
  AttributeValue,
} from './document';
import queries from './queries';

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
  updateIdentifier: (document: PROVJSONBundle) => (
    prevID: string, updatedID: string,
  ): PROVJSONBundle => {
    const { prefix, ...remaining } = document;

    return ({
      prefix,
      ...updateIdentifiersInObject(remaining)(prevID, updatedID),
    });
  },
  namespace: {
    create: (
      prefixName: string, updatedValue: string,
    ) => (document: PROVJSONBundle): PROVJSONBundle => ({
      ...document,
      prefix: {
        ...document.prefix,
        [prefixName]: updatedValue,
      },
    }),
    delete: (prefix: string) => (document: PROVJSONBundle): PROVJSONBundle => {
      const { [prefix]: value, ...remainingNamespaces } = document.prefix || {};
      return ({ ...document, prefix: remainingNamespaces });
    },
    updateValue: (
      prefix: string, updatedValue: string,
    ) => (document: PROVJSONBundle): PROVJSONBundle => ({
      ...document,
      prefix: { ...document.prefix, [prefix]: updatedValue },
    }),
    updatePrefix: (
      prevPrefix: string, updatedName: string,
    ) => (document: PROVJSONBundle): PROVJSONBundle => {
      const { [prevPrefix]: prevValue, ...updatedPrefix } = document.prefix || {};

      return ({
        ...updatePrefixesInObject(document)(prevPrefix, updatedName),
        prefix: {
          ...updatedPrefix,
          [updatedName]: prevValue,
        },
      });
    },
  },
  node: {
    create: (
      variant: NodeVariant, prefix: string, name: string,
    ) => (document: PROVJSONBundle): PROVJSONBundle => ({
      ...document,
      [variant]: { ...document.bundle, [`${prefix}:${name}`]: { } },
    }),
    move: (
      oldBundleID: string, newBundleID: string, variant: NodeVariant, id: string,
    ) => (document: PROVJSONBundle): PROVJSONBundle => {
      const [_, value] = queries.bundle.getNode(id)(document);

      const removed = mutations.bundle.findByID(document)(oldBundleID)(
        mutations.bundle.removeNode(variant, id),
      );

      if (removed) {
        const added = mutations.bundle.findByID(removed)(newBundleID)(
          mutations.bundle.addNode(variant, id, value),
        );
        if (added) return { ...document, ...added };
      }

      throw new Error('');
    },
    delete: (
      variant: NodeVariant, id: string,
    ) => (document: PROVJSONBundle) => {
      const updatedBundle = mutations.bundle
        .find(
          (bundle) => Object.keys(bundle[variant] || {}).includes(id),
        )(mutations.bundle.removeNode(variant, id))(document);
      if (!updatedBundle) throw new Error('Could not delete');
      return ({ ...document, ...mutations.relation.deleteWithNode(id)(updatedBundle) });
    },
    createAttribute: (
      variant: NodeVariant, nodeID: string, name: string, value: AttributeValue,
    ) => (document: PROVJSONBundle) => {
      if (variant === 'bundle') throw new Error('Cannot create attribute for bundles');

      const updatedDocument = mutations.bundle
        .find(
          (bundle) => Object.keys(bundle[variant] || {}).includes(nodeID),
        )(
          (bundle) => ({
            ...bundle,
            [variant]: {
              ...bundle[variant],
              [nodeID]: { ...bundle[variant]![nodeID], [name]: value },
            },
          }),
        )(document);

      if (!updatedDocument) throw new Error(`Could not find node with id ${nodeID}`);

      return updatedDocument;
    },
    deleteAttribute: (
      variant: NodeVariant, nodeID: string, attributeName: string,
    ) => (document: PROVJSONBundle) => {
      if (variant === 'bundle') throw new Error('Cannot create attribute for bundles');

      const updatedDocument = mutations.bundle
        .find(
          (bundle) => Object.keys(bundle[variant] || {}).includes(nodeID),
        )(
          (bundle) => ({
            ...bundle,
            [variant]: {
              ...bundle[variant],
              [nodeID]: Object.entries(bundle[variant]![nodeID]).reduce(
                (prev, [name, value]) => (name === attributeName
                  ? prev
                  : ({ ...prev, [name]: value })),
                { },
              ),
            },
          }),
        )(document);

      if (!updatedDocument) throw new Error(`Could not find node with id ${nodeID}`);

      return updatedDocument;
    },
    setAttributeValue: (
      variant: NodeVariant, nodeID: string, attributeName: string, attributeValue: AttributeValue,
    ) => (document: PROVJSONBundle) => {
      if (variant === 'bundle') throw new Error('Cannot set attribute value of bundles');
      const updatedDocument = mutations.bundle
        .find(
          (bundle) => Object.keys(bundle[variant] || {}).includes(nodeID),
        )(
          (bundle) => ({
            ...bundle,
            [variant]: {
              ...bundle[variant],
              [nodeID]: Object.entries(bundle[variant]![nodeID]).reduce(
                (prev, [name]) => (name === attributeName
                  ? ({ ...prev, [name]: attributeValue })
                  : prev),
                { ...bundle[variant]![nodeID] },
              ),
            },
          }),
        )(document);

      if (!updatedDocument) throw new Error(`Could not find node with id ${nodeID}`);

      return updatedDocument;
    },
    setAttributeName: (
      variant: NodeVariant, nodeID: string, prevAttributeName: string, newAttributeName: string,
    ) => (document: PROVJSONBundle) => {
      if (variant === 'bundle') throw new Error('Cannot set attribute value of bundles');
      const updatedDocument = mutations.bundle
        .find(
          (bundle) => Object.keys(bundle[variant] || {}).includes(nodeID),
        )(
          (bundle) => ({
            ...bundle,
            [variant]: {
              ...bundle[variant],
              [nodeID]: Object.entries(bundle[variant]![nodeID]).reduce(
                (prev, [name, value]) => (name === prevAttributeName
                  ? ({ ...prev, [newAttributeName]: value })
                  : ({ ...prev, [name]: value })),
                {},
              ),
            },
          }),
        )(document);

      if (!updatedDocument) throw new Error(`Could not find node with id ${nodeID}`);

      return updatedDocument;
    },
  },
  relation: {
    create: (
      relationName: RelationName, relationID: string, domainID: string, rangeID: string,
    ) => (document: PROVJSONBundle): PROVJSONBundle => {
      const { domainKey, rangeKey } = RELATIONS.find(({ name }) => name === relationName)!;
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
    deleteWithNode: (nodeID: string) => (bundle: PROVJSONBundle): PROVJSONBundle => Object
      .entries(bundle)
      .reduce<PROVJSONBundle>((prevBundle, [bundleKey, entries]) => {
        const relation = RELATIONS.find(({ name }) => name === bundleKey);
        return relation
          ? ({
            ...prevBundle,
            [bundleKey]: Object.entries<{ [id: string]: string }>(entries)
              .reduce((prevValue, [key, value]) => ((
                value[relation.domainKey] === nodeID
                || value[relation.rangeKey] === nodeID
              )
                ? prevValue
                : { ...prevValue, [key]: value }), {}),
          })
          : (bundleKey === 'bundle'
            ? ({
              ...prevBundle,
              [bundleKey]: Object.entries<PROVJSONBundle>(entries)
                .reduce((prev, [bundleID, nestedBundle]) => ({
                  ...prev,
                  [bundleID]: mutations.relation.deleteWithNode(nodeID)(nestedBundle),
                }), {}),
            })
            : prevBundle);
      }, { ...bundle }),
    delete: (
      relationName: RelationName, relationID: string,
    ) => (bundle: PROVJSONBundle): PROVJSONBundle => {
      const { [relationID]: value, ...remaining } = bundle[relationName] || {};
      return ({
        ...bundle,
        [relationName]: remaining,
        bundle: bundle.bundle
          ? Object.keys(bundle.bundle).reduce((prev, key) => ({
            ...prev,
            [key]: mutations.relation.delete(relationName, relationID)(prev[key]),
          }), bundle.bundle)
          : bundle.bundle,
      });
    },
  },
  bundle: {
    find: (
      isMatchingBundle: (b: PROVJSONBundle) => boolean,
    ) => (
      callback: (b: PROVJSONBundle) => PROVJSONBundle,
    ) => (bundle: PROVJSONBundle): PROVJSONBundle | undefined => {
      if (isMatchingBundle(bundle)) return callback(bundle);

      const match = Object.entries(bundle.bundle || {}).find(([_, b]) => isMatchingBundle(b));

      if (match) {
        return {
          ...bundle,
          bundle: {
            ...bundle.bundle,
            [match[0]]: callback(match[1]),
          },
        };
      }

      // eslint-disable-next-line no-restricted-syntax
      for (const [id, nestedBundle] of Object.entries(bundle.bundle || {})) {
        const res = mutations.bundle.find(isMatchingBundle)(callback)(nestedBundle);

        if (res) {
          return {
            ...bundle,
            bundle: { ...bundle.bundle, [id]: res },
          };
        }
      }

      return undefined;
    },
    findByID: (bundle: PROVJSONBundle) => (bundleID: string) => (
      callback: (b: PROVJSONBundle) => PROVJSONBundle,
    ): PROVJSONBundle | undefined => {
      if (bundleID === 'root') return callback(bundle);

      const matchingNestedBundle = Object
        .entries(bundle.bundle || {})
        .find(([id]) => bundleID === id)?.[1];

      if (matchingNestedBundle) {
        return {
          ...bundle,
          bundle: {
            ...bundle.bundle,
            [bundleID]: callback(matchingNestedBundle),
          },
        };
      }

      // eslint-disable-next-line no-restricted-syntax
      for (const [id, nestedBundle] of Object.entries(bundle.bundle || {})) {
        const res = mutations.bundle.findByID(nestedBundle)(bundleID)(callback);

        if (res) {
          return {
            ...bundle,
            bundle: { ...bundle.bundle, [id]: res },
          };
        }
      }

      return undefined;
    },
    addNode: (
      variant: NodeVariant, id: string, value: any,
    ) => (bundle: PROVJSONBundle): PROVJSONBundle => ({
      ...bundle,
      [variant]: {
        ...bundle[variant],
        [id]: value,
      },
    }),
    removeNode: (
      variant: NodeVariant, id: string,
    ) => (bundle: PROVJSONBundle): PROVJSONBundle => ({
      ...bundle,
      [variant]: Object
        .entries(bundle[variant] || {})
        .reduce((prev, [key, value]) => (key === id
          ? prev
          : ({ ...prev, [key]: value })
        ), {}),
    }),
    setAttribute: (
      id: string, attribute: PROVAttributeDefinition, value: any,
    ) => (bundle: PROVJSONBundle): PROVJSONBundle => {
      const { domain, key } = attribute;

      return Object.keys(bundle[domain] || {}).includes(id)
        ? ({
          ...bundle,
          [domain]: {
            ...bundle[domain],
            [id]: {
              ...bundle[domain]?.[id],
              [key]: value,
            },
          },
        }) : ({
          ...bundle,
          bundle: bundle.bundle
            ? Object.keys(bundle.bundle).reduce((prev, bundleKey) => ({
              ...prev,
              [bundleKey]: mutations.bundle.setAttribute(id, attribute, value)(prev[bundleKey]),
            }), bundle.bundle)
            : bundle.bundle,
        });
    },
  },
};

export default mutations;
