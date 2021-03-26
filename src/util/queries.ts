import {
  NodeVariant,
  PROVJSONBundle,
  AttributeValue,
  PROVJSONDocument,
} from './definition/document';
import {
  RelationName,
  RELATIONS,
  RELATION_NAMES,
} from './definition/relation';
import { PROVAttributeDefinition } from './definition/attribute';

const queries = {
  namespace: {
    getAll: (bundleID?: string) => (document: PROVJSONDocument): string[] => [
      ...Object.keys(document.prefix || {}),
      ...(bundleID ? Object.keys(document.bundle?.[bundleID].prefix || {}) : []),
    ].flat(),
    getDefaultPrefix: ({ prefix }: PROVJSONDocument): string => {
      if (!prefix) throw new Error('Cannot get default Prefix if prefix is undefined');
      if (prefix.default) return 'default';
      if (prefix.xsd) return 'xsd';
      throw new Error('Cannot get default Prefix');
    },
  },
  document: {
    parsePrefixFromID: (id: string) => {
      const idComponents = id.split(':');
      return idComponents.length > 1 ? idComponents[0] : 'default';
    },
    parseNameFromID: (id: string) => (id.split(':').length > 1 ? id.substring(id.indexOf(':') + 1) : id),
    isEmpty: (document: PROVJSONDocument): boolean => (
      queries.bundle.isEmpty(document)
      && Object.values(document.bundle || {})
        .find((bundle) => !queries.bundle.isEmpty(bundle)) === undefined
    ),
    getNodeValue: (identifier: string) => (document: PROVJSONDocument) => {
      const localNodeValue = queries.bundle.getLocalNodeValue(identifier)(document);

      if (localNodeValue) return localNodeValue;

      // eslint-disable-next-line no-restricted-syntax
      for (const nestedBundle of Object.values(document.bundle || {})) {
        const value = queries.bundle.getLocalNodeValue(identifier)(nestedBundle);
        if (value) return value;
      }

      throw new Error(`Node with identifier ${identifier} not found`);
    },
    getPrefixValue: (identifier: string) => (document: PROVJSONDocument) => {
      // If the identifer represents a node or bundle in the document locally...
      if (
        queries.bundle.hasLocalNode(identifier)(document)
        || queries.document.hasBundle(identifier)(document)) {
        // ...we can get the prefix value directly.
        return queries.bundle.getLocalPrefixValue(identifier)(document);
      }
      // Otherwise for each nested bundle...
      // eslint-disable-next-line no-restricted-syntax
      for (const nestedBundle of Object.values(document.bundle || {})) {
        // ...if it contains the node with the identifier...
        if (queries.bundle.hasLocalNode(identifier)(nestedBundle)) {
          // ...then the prefix is either defined in the bundle, or in the document.
          return (
            queries.bundle.getLocalPrefixValue(identifier)(nestedBundle)
            || queries.bundle.getLocalPrefixValue(identifier)(document)
          );
        }
      }

      throw new Error(`Node with identifier ${identifier} not found`);
    },
    getAttributeValue: (
      variant: NodeVariant, id: string, attribute: PROVAttributeDefinition,
    ) => (document: PROVJSONDocument): any | null => {
      const { domain, key } = attribute;
      if (Object.keys(document[variant] || {}).includes(id)) {
        return (document[variant]?.[id][key] || null);
      }
      if (document.bundle) {
        // eslint-disable-next-line no-restricted-syntax
        for (const value of Object.values(document.bundle)) {
          const result = queries.document.getAttributeValue(variant, id, attribute)(value);
          if (result) return result;
        }
      }
      return null;
    },
    hasRelation: (identifier: string) => (document: PROVJSONDocument): boolean => (
      queries.bundle.hasLocalRelation(identifier)(document)
      || Object.values(document.bundle || {})
        .find(queries.bundle.hasLocalRelation(identifier)) !== undefined
    ),
    hasNode: (identifier: string) => (document: PROVJSONDocument): boolean => (
      queries.bundle.hasLocalNode(identifier)(document)
      || Object.values(document.bundle || {})
        .find(queries.bundle.hasLocalNode(identifier)) !== undefined
    ),
    hasActivity: (identifier: string) => (document: PROVJSONDocument): boolean => (
      queries.bundle.hasLocalActivity(identifier)(document)
      || Object.values(document.bundle || {})
        .find(queries.bundle.hasLocalActivity(identifier)) !== undefined),
    hasAgent: (identifier: string) => (document: PROVJSONDocument): boolean => (
      queries.bundle.hasLocalAgent(identifier)(document)
          || Object.values(document.bundle || {})
            .find(queries.bundle.hasLocalAgent(identifier)) !== undefined),
    hasEntity: (identifier: string) => (document: PROVJSONDocument): boolean => (
      queries.bundle.hasLocalEntity(identifier)(document)
      || Object.values(document.bundle || {})
        .find(queries.bundle.hasLocalEntity(identifier)) !== undefined),
    hasBundle: (identifier: string) => ({ bundle }: PROVJSONDocument): boolean => (
      Object.keys(bundle || {}).includes(identifier)),
  },
  bundle: {
    isEmpty: ({ activity, agent, entity }: PROVJSONBundle): boolean => (
      Object.keys({ ...activity, ...agent, ...entity }).length === 0
    ),
    getAllInNamespace: (prefix: string) => (document: PROVJSONDocument): string[] => queries.bundle
      .getAll(document)
      .filter((id) => queries.document.parsePrefixFromID(id) === prefix),
    getAll: ({ bundle }: PROVJSONDocument): string[] => Object.keys(bundle || {}),
    getNodes: (bundleID: string, variant?: NodeVariant) => (document: PROVJSONDocument) => {
      const bundle = Object.entries(document.bundle || {})
        .find(([id]) => id === bundleID)
        ?.[1];

      return bundle
        ? Object.keys(variant
          ? bundle[variant] || {}
          : { ...bundle.agent, ...bundle.activity, ...bundle.entity })
        : undefined;
    },
    generateIdentifier: (
      defaultPrefix: string,
      index: number = 0,
    ) => (document: PROVJSONDocument): string => {
      const potentialID = `${defaultPrefix === 'default' ? '' : `${defaultPrefix}:`}Bundle${index > 0 ? index : ''}`;
      return (
        queries.document.hasBundle(potentialID)(document)
          ? queries.bundle.generateIdentifier(defaultPrefix, index + 1)(document)
          : potentialID);
    },
    getLocalPrefixValue: (identifier: string) => (bundle: PROVJSONBundle) => {
      const prefix = queries.document.parsePrefixFromID(identifier);

      // If the prefix is defined, let's attempt to get its value.
      // Otherwise, the prefix value is either the default namespace value or undefined
      return bundle.prefix?.[prefix || 'default'];
    },
    getLocalNodeValue: (identifier: string) => ({
      agent, activity, entity,
    }: PROVJSONBundle) => Object
      .entries({ ...agent, ...activity, ...entity })
      .find(([id, _]) => id === identifier)?.[1],
    hasLocalRelation: (identifier: string) => (bundle: PROVJSONBundle): boolean => (
      RELATIONS.find(({ name }) => (
        (Object.keys(bundle[name] || {}).includes(identifier)))) !== undefined),
    hasLocalNode: (identifier: string) => (bundle: PROVJSONBundle): boolean => (
      queries.bundle.hasLocalActivity(identifier)(bundle)
      || queries.bundle.hasLocalAgent(identifier)(bundle)
      || queries.bundle.hasLocalEntity(identifier)(bundle)),
    hasLocalActivity: (identifier: string) => ({ activity }: PROVJSONBundle): boolean => (
      Object.keys(activity || {}).includes(identifier)),
    hasLocalAgent: (identifier: string) => ({ agent }: PROVJSONBundle): boolean => (
      Object.keys(agent || {}).includes(identifier)),
    hasLocalEntity: (identifier: string) => ({ entity }: PROVJSONBundle): boolean => (
      Object.keys(entity || {}).includes(identifier)),
  },
  node: {
    getAllInNamespace: (
      variant: NodeVariant, prefix: string,
    ) => (document: PROVJSONDocument): string[] => queries.node
      .getAll(variant)(document)
      .filter((id) => queries.document.parsePrefixFromID(id) === prefix),
    getAll: (variant: NodeVariant) => (document: PROVJSONDocument): string[] => [
      ...Object.keys(document[variant] || {}),
      ...Object.values(document.bundle || {})
        .map((bundle) => Object.keys(bundle[variant] || {})).flat(),
    ],
    getBundleID: (identifier: string) => (document: PROVJSONDocument): string | undefined => {
      if (queries.bundle.hasLocalNode(identifier)(document)) return undefined;
      // eslint-disable-next-line no-restricted-syntax
      for (const [bundleID, nestedBundle] of Object.entries(document.bundle || {})) {
        // ...if it contains the node with the identifier...
        if (queries.bundle.hasLocalNode(identifier)(nestedBundle)) return bundleID;
      }
      throw new Error(`Node with identifier ${identifier} not found`);
    },
    generateIdentifier: (
      defaultPrefix: string, variant: NodeVariant, index: number = 0,
    ) => (document: PROVJSONDocument): string => {
      const potentialID = `${defaultPrefix === 'default' ? '' : `${defaultPrefix}:`}${variant.charAt(0).toUpperCase()}${variant.slice(1)}${index > 0 ? index : ''}`;
      return (
        queries.document.hasNode(potentialID)(document)
          ? queries.node.generateIdentifier(defaultPrefix, variant, index + 1)(document)
          : potentialID);
    },
    getFullName: (identifier: string) => (document: PROVJSONDocument) => {
      const prefixValue = queries.document.getPrefixValue(identifier)(document);
      return prefixValue
        ? `${prefixValue}${identifier.substring(identifier.indexOf(':') + 1)}`
        : identifier;
    },
    getVariant: (identifier: string) => (document: PROVJSONDocument): NodeVariant => {
      if (queries.document.hasEntity(identifier)(document)) {
        return 'entity';
      } if (queries.document.hasActivity(identifier)(document)) {
        return 'activity';
      } if (queries.document.hasAgent(identifier)(document)) {
        return 'agent';
      }
      throw new Error(`Node with identifier ${identifier} not found`);
    },
    getAttributeValue: (
      variant: NodeVariant, nodeID: string, attributeKey: string,
    ) => (document: PROVJSONDocument): AttributeValue | undefined => (
      queries.node
        .getAttributes(variant, nodeID)(document)
        ?.find(([key]) => key === attributeKey)
        ?.[1]
    ),
    getAttributes: (
      variant: NodeVariant, nodeID: string,
    ) => (document: PROVJSONDocument): [key: string, value: AttributeValue][] | undefined => {
      const entry = Object.entries<{ [attributeKey: string]: AttributeValue; }>(
        document[variant] || {},
      ).find(([id]) => id === nodeID);
      if (entry) return Object.entries(entry[1]);
      // eslint-disable-next-line no-restricted-syntax
      for (const nestedBundle of Object.values(document.bundle || {})) {
        const res = queries.node.getAttributes(variant, nodeID)(nestedBundle);
        if (res) return res;
      }
      return undefined;
    },
    getOutgoingRelations: (nodeID: string) => (document: PROVJSONBundle) => RELATION_NAMES
      .map((name) => Object.entries(document[name] || {})
        .filter(([_, relationValue]) => (
          relationValue[RELATIONS.find((r) => r.name === name)!.domainKey] === nodeID))).flat(),
    getIncomingRelations: (nodeID: string) => (document: PROVJSONBundle) => RELATION_NAMES
      .map((name) => Object.entries(document[name] || {})
        .filter(([_, relationValue]) => (
          relationValue[RELATIONS.find((r) => r.name === name)!.rangeKey] === nodeID))).flat(),
  },
  relation: {
    generateID: (index: number = 1) => (document: PROVJSONDocument): string => {
      const id = `_:id${index}`;
      return queries.document.hasRelation(id)(document)
        ? queries.relation.generateID(index + 1)(document)
        : id;
    },
    getID: (
      relationName: RelationName, domainID: string, rangeID: string,
    ) => (document: PROVJSONDocument): string | null => {
      const relation = RELATIONS.find((r) => r.name === relationName)!;
      return (
        Object.entries(document[relationName] || {})
          .find(([_, value]) => (
            value[relation.domainKey] === domainID
            && value[relation.rangeKey] === rangeID))
          ?.[0]
        || Object.values(document.bundle || {})
          .map(queries.relation.getID(relationName, domainID, rangeID))
          .find((id) => id !== null)
        || null
      );
    },
    getRangeWithDomain: (
      relationName: RelationName, domainID: string,
    ) => (document: PROVJSONDocument): string[] => {
      const relation = RELATIONS.find((r) => r.name === relationName)!;
      return [
        ...Object.entries(document[relationName] || {})
          .filter(([_, value]) => value[relation.domainKey] === domainID)
          .map(([_, value]) => value[relation.rangeKey]),
        ...Object.values(document.bundle || {})
          .map((bundle) => Object.entries(bundle[relationName] || {})
            .filter(([_, value]) => value[relation.domainKey] === domainID)
            .map(([_, value]) => value[relation.rangeKey]))
          .flat(),
      ];
    },
  },
};

export default queries;
