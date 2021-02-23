import {
  NodeVariant,
  PROVJSONBundle,
  PROVAttributeDefinition,
  RelationName,
  RELATIONS,
  RELATION_NAMES,
  AttributeValue,
  PROVJSONDocument,
} from './document';

const queries = {
  prefix: {
    getAll: (document: PROVJSONDocument): string[] => [
      ...Object.keys(document.prefix || {}),
      ...Object.values(document.bundle || {})
        .map(({ prefix }) => Object.keys(prefix || {})).flat(),
    ],
  },
  document: {
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
    getAll: ({ bundle }: PROVJSONDocument): string[] => Object.keys(bundle || {}),
    getNodes: (bundleID: string) => (document: PROVJSONDocument) => {
      const bundle = Object.entries(document.bundle || {})
        .find(([id]) => id === bundleID)
        ?.[1];

      return bundle
        ? Object.keys({ ...bundle.agent, ...bundle.activity, ...bundle.entity })
        : undefined;
    },
    generateName: (
      prefix: string, index: number = 0,
    ) => (document: PROVJSONDocument): string => (
      queries.document.hasBundle(`${prefix}:Bundle${index > 0 ? ` ${index}` : ''}`)(document)
        ? queries.bundle.generateName(prefix, index + 1)(document)
        : `Bundle${index > 0 ? ` ${index}` : ''}`),
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
    getAll: (variant: NodeVariant) => (document: PROVJSONDocument): string[] => [
      ...Object.keys(document[variant] || {}),
      ...Object.values(document.bundle || {})
        .map((bundle) => Object.keys(bundle[variant] || {})).flat(),
    ],
    generateName: (
      variant: NodeVariant, prefix: string, index: number = 0,
    ) => (document: PROVJSONBundle): string => (
      queries.document.hasNode(`${prefix}:${variant.charAt(0).toUpperCase()}${variant.slice(1)}${index > 0 ? ` ${index}` : ''}`)(document)
        ? queries.node.generateName(variant, prefix, index + 1)(document)
        : `${variant.charAt(0).toUpperCase()}${variant.slice(1)}${index > 0 ? ` ${index}` : ''}`),
    getFullName: (identifier: string) => ({ prefix }: PROVJSONBundle) => (
      `${(prefix || {})[identifier.split(':')[0]]}${identifier.split(':')[1]}`
    ),
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
