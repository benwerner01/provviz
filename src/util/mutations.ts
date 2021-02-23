import {
  Variant,
  NodeVariant,
  PROVJSONBundle,
  PROVAttributeDefinition,
  RelationName,
  RELATIONS,
  AttributeValue,
  PROVJSONDocument,
} from './document';
import queries from './queries';

const maybeUpdateIdentifier = (
  prevID: string,
  updatedID: string,
) => (identifier: string) => (identifier === prevID ? updatedID : identifier);

const updateIdentifiersInObject = (
  prevID: string,
  updatedID: string,
) => (obj: { [key: string]: any }): { [key: string]: any } => {
  // The keys we need to update
  const updatedKeys = Object.keys(obj).filter((key) => key === prevID);
  // The keys we don't need to update
  const nonUpdatedKeys = Object.keys(obj).filter((key) => key !== prevID);

  return updatedKeys.reduce((prevObj, key) => Object.assign(prevObj, {
    [updatedID]: typeof obj[key] === 'object'
      ? updateIdentifiersInObject(prevID, updatedID)(obj[key])
      : typeof obj[key] === 'string'
        ? maybeUpdateIdentifier(prevID, updatedID)(obj[key])
        : obj[key],
  }), nonUpdatedKeys.reduce((prevObj, key) => Object.assign(prevObj, {
    [key]: typeof obj[key] === 'object'
      ? updateIdentifiersInObject(prevID, updatedID)(obj[key])
      : typeof obj[key] === 'string'
        ? maybeUpdateIdentifier(prevID, updatedID)(obj[key])
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
  updateIdentifier: (
    prevID: string, updatedID: string,
  ) => (
    document: PROVJSONDocument,
  ): PROVJSONDocument => updateIdentifiersInObject(prevID, updatedID)(document),
  document: {
    create: (
      variant: Variant, prefix: string, name: string,
    ) => (document: PROVJSONDocument): PROVJSONDocument => ({
      ...document,
      [variant]: { ...document[variant], [`${prefix}:${name}`]: { } },
    }),
  },
  namespace: {
    create: (
      prefixName: string, updatedValue: string,
    ) => (document: PROVJSONDocument): PROVJSONDocument => ({
      ...document,
      prefix: { ...document.prefix, [prefixName]: updatedValue },
    }),
    delete: (prefixName: string) => (document: PROVJSONDocument): PROVJSONDocument => {
      const updatedDocument = mutations.bundle.find(
        ({ prefix }) => Object.keys(prefix || {}).includes(prefixName),
      )(
        (b) => {
          const { [prefixName]: value, ...remainingNamespaces } = b.prefix || {};
          return ({ ...b, prefix: remainingNamespaces });
        },
      )(document);

      if (!updatedDocument) throw new Error('Could not delete prefix');

      return updatedDocument;
    },
    updateValue: (
      prefixName: string, updatedValue: string,
    ) => (document: PROVJSONDocument): PROVJSONDocument => {
      const updatedDocument = mutations.bundle.find(
        ({ prefix }) => Object.keys(prefix || {}).includes(prefixName),
      )(
        (b) => ({
          ...b,
          prefix: { ...document.prefix, [prefixName]: updatedValue },
        }),
      )(document);

      if (!updatedDocument) throw new Error('Could not update prefix value');

      return updatedDocument;
    },
    updatePrefix: (
      prevPrefixName: string, updatedPrefixName: string,
    ) => (document: PROVJSONDocument): PROVJSONDocument => {
      const updatedDocument = mutations.bundle.find(
        ({ prefix }) => Object.keys(prefix || {}).includes(prevPrefixName),
      )(
        (b) => {
          const { [prevPrefixName]: prevValue, ...updatedPrefix } = b.prefix || {};

          return ({
            ...b,
            prefix: {
              ...updatedPrefix,
              [updatedPrefixName]: prevValue,
            },
          });
        },
      )(document);

      if (!updatedDocument) throw new Error('Could not update prefix name');

      return updatePrefixesInObject(updatedDocument)(prevPrefixName, updatedPrefixName);
    },
  },
  node: {
    move: (
      oldBundleID: string, newBundleID: string, variant: NodeVariant, id: string,
    ) => (document: PROVJSONDocument): PROVJSONDocument => {
      const value = queries.document.getNodeValue(id)(document);

      const removed = mutations.bundle.findByID(document)(oldBundleID)(
        mutations.bundle.removeNode(variant, id),
      );

      if (removed) {
        const added = mutations.bundle.findByID(removed)(newBundleID)(
          mutations.bundle.addNode(variant, id, value),
        );
        if (added) return { ...document, ...added };
      }

      throw new Error('Could not move node');
    },
    delete: (
      variant: NodeVariant, id: string,
    ) => (document: PROVJSONDocument): PROVJSONDocument => {
      const updatedBundle = mutations.bundle
        .find(
          (bundle) => Object.keys(bundle[variant] || {}).includes(id),
        )(mutations.bundle.removeNode(variant, id))(document);
      if (!updatedBundle) throw new Error('Could not delete node');
      return ({ ...document, ...mutations.relation.deleteWithNode(id)(updatedBundle) });
    },
    createAttribute: (
      variant: NodeVariant, nodeID: string, name: string, value: AttributeValue,
    ) => (document: PROVJSONDocument): PROVJSONDocument => {
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
    ) => (document: PROVJSONDocument): PROVJSONDocument => {
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
    ) => (document: PROVJSONDocument): PROVJSONDocument => {
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
    ) => (document: PROVJSONDocument): PROVJSONDocument => {
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
    setAttribute: (
      variant: NodeVariant, id: string, attribute: PROVAttributeDefinition, value: any,
    ) => (document: PROVJSONDocument): PROVJSONDocument => {
      const { key } = attribute;

      const updatedDocument = mutations.bundle.find(
        (b) => Object.keys(b[variant] || {}).includes(id),
      )((bundle) => ({
        ...bundle,
        [variant]: {
          ...bundle[variant],
          [id]: {
            ...bundle[variant]?.[id],
            [key]: value,
          },
        },
      }))(document);

      if (!updatedDocument) throw new Error('Could not update node attribute');

      return updatedDocument;
    },
  },
  relation: {
    create: (
      relationName: RelationName, relationID: string, domainID: string, rangeID: string,
    ) => (document: PROVJSONDocument): PROVJSONDocument => {
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
    deleteWithNode: (nodeID: string) => (bundle: PROVJSONDocument): PROVJSONDocument => Object
      .entries(bundle)
      .reduce<PROVJSONDocument>((prevBundle, [bundleKey, entries]) => {
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
    ) => (document: PROVJSONDocument): PROVJSONDocument => {
      const updatedDocument = mutations.bundle
        .find(
          (bundle) => Object.keys(bundle[relationName] || {}).includes(relationID),
        )((bundle) => {
          const { [relationID]: value, ...remaining } = bundle[relationName] || {};
          return ({ ...bundle, [relationName]: remaining });
        })(document);
      if (!updatedDocument) throw new Error('Could not delete relation');
      return updatedDocument;
    },
  },
  bundle: {
    find: (
      isMatch: (b: PROVJSONBundle) => boolean,
    ) => (
      callback: (b: PROVJSONBundle) => PROVJSONBundle,
    ) => (document: PROVJSONDocument): PROVJSONDocument | undefined => {
      if (isMatch(document)) return { ...document, ...callback(document) };

      const match = Object.entries(document.bundle || {}).find(([_, b]) => isMatch(b));

      return match
        ? ({
          ...document,
          bundle: {
            ...document.bundle,
            [match[0]]: callback(match[1]),
          },
        })
        : undefined;
    },
    findByID: (document: PROVJSONDocument) => (bundleID: string) => (
      callback: (b: PROVJSONBundle) => PROVJSONBundle,
    ): PROVJSONDocument | undefined => {
      if (bundleID === 'root') return { ...document, ...callback(document) };

      const matchingNestedBundle = Object
        .entries(document.bundle || {})
        .find(([id]) => bundleID === id)?.[1];

      if (matchingNestedBundle) {
        return {
          ...document,
          bundle: {
            ...document.bundle,
            [bundleID]: callback(matchingNestedBundle),
          },
        };
      }

      return undefined;
    },
    delete: (id: string) => (document: PROVJSONDocument): PROVJSONDocument => ({
      ...document,
      bundle: Object
        .entries(document.bundle || {})
        .reduce((prev, [key, value]) => (key === id
          ? prev
          : ({ ...prev, [key]: value })
        ), {}),
    }),
    addNode: (
      variant: NodeVariant, id: string, value: { [attributeKey: string]: AttributeValue; },
    ) => (bundle: PROVJSONDocument): PROVJSONDocument => ({
      ...bundle,
      [variant]: {
        ...bundle[variant],
        [id]: value,
      },
    }),
    removeNode: (
      variant: NodeVariant, id: string,
    ) => (bundle: PROVJSONDocument): PROVJSONDocument => ({
      ...bundle,
      [variant]: Object
        .entries(bundle[variant] || {})
        .reduce((prev, [key, value]) => (key === id
          ? prev
          : ({ ...prev, [key]: value })
        ), {}),
    }),
  },
};

export default mutations;
