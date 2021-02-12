import {
  NodeVariant,
  PROVJSONBundle,
  PROVAttributeDefinition,
  RelationName,
  RELATIONS,
  RELATION_NAMES,
} from './document';

const queries = {
  prefix: {
    getAll: ({ prefix }: PROVJSONBundle) => Object.keys(prefix || {}),
  },
  bundle: {
    getAll: ({ bundle }: PROVJSONBundle): string[] => [
      ...(bundle
        ? Object.keys(bundle).map((key) => [
          key,
          ...queries.bundle.getAll(bundle[key]),
        ]).flat()
        : []),
    ],
    generateName: (
      prefix: string, index: number = 0,
    ) => (document: PROVJSONBundle): string => (
      queries.bundle.hasBundle(`${prefix}:Bundle${index > 0 ? ` ${index}` : ''}`)(document)
        ? queries.bundle.generateName(prefix, index + 1)(document)
        : `Bundle${index > 0 ? ` ${index}` : ''}`),
    getNode: (identifier: string) => ({
      agent, activity, entity, bundle,
    }: PROVJSONBundle): [id: string, value: any] => {
      const localNode = Object
        .entries({
          ...agent, ...activity, ...entity, ...bundle,
        })
        .find(([id, _]) => id === identifier);

      if (localNode) return localNode;

      // The bundle containing the nested node
      const nestedNodeBundle = Object.values(bundle || {}).find(queries.bundle.hasNode(identifier));

      if (nestedNodeBundle) return queries.bundle.getNode(identifier)(nestedNodeBundle);

      throw new Error(`Node with identifier ${identifier} not found`);
    },
    getAttributeValue: (
      attribute: PROVAttributeDefinition, id: string,
    ) => (bundle: PROVJSONBundle): any | null => {
      const { domain, key } = attribute;
      if (domain !== 'bundle' && Object.keys(bundle[domain] || {}).includes(id)) {
        return bundle[domain]?.[id][key];
      }
      if (bundle.bundle) {
        // eslint-disable-next-line no-restricted-syntax
        for (const value of Object.values(bundle.bundle)) {
          const result = queries.bundle.getAttributeValue(attribute, id)(value);
          if (result !== null) return result;
        }
      }
      return null;
    },
    hasRelation: (identifier: string) => (bundle: PROVJSONBundle): boolean => {
      const nestedBundle = bundle.bundle;
      return ((
        RELATIONS.find(({ name }) => {
          const relation = bundle[name];
          return (
            (relation && Object.keys(relation).includes(identifier)));
        }) !== undefined)
      || (
        nestedBundle
          ? Object.values(nestedBundle)
            .find(queries.bundle.hasRelation(identifier)) !== undefined
          : false));
    },
    hasLocalNode: (identifier: string) => (bundle: PROVJSONBundle): boolean => (
      queries.bundle.hasLocalActivity(identifier)(bundle)
      || queries.bundle.hasLocalAgent(identifier)(bundle)
      || queries.bundle.hasLocalEntity(identifier)(bundle)
      || queries.bundle.hasLocalBundle(identifier)(bundle)),
    hasNode: (identifier: string) => (bundle: PROVJSONBundle): boolean => (
      queries.bundle.hasActivity(identifier)(bundle)
      || queries.bundle.hasAgent(identifier)(bundle)
      || queries.bundle.hasEntity(identifier)(bundle)
      || queries.bundle.hasBundle(identifier)(bundle)
      || (
        bundle.bundle !== undefined
        && Object.values(bundle.bundle).find(queries.bundle.hasNode(identifier)) !== undefined)
    ),
    hasLocalActivity: (identifier: string) => ({ activity }: PROVJSONBundle): boolean => (
      (activity !== undefined && Object.keys(activity).includes(identifier))),
    hasActivity: (identifier: string) => ({ activity, bundle }: PROVJSONBundle): boolean => (
      (activity !== undefined && Object.keys(activity).includes(identifier))
      || (
        bundle !== undefined
        && Object.values(bundle).find(queries.bundle.hasActivity(identifier)) !== undefined)),
    hasLocalAgent: (identifier: string) => ({ agent }: PROVJSONBundle): boolean => (
      (agent !== undefined && Object.keys(agent).includes(identifier))),
    hasAgent: (identifier: string) => ({ agent, bundle }: PROVJSONBundle): boolean => (
      (agent !== undefined && Object.keys(agent).includes(identifier))
      || (
        bundle !== undefined
        && Object.values(bundle).find(queries.bundle.hasAgent(identifier)) !== undefined)),
    hasLocalEntity: (identifier: string) => ({ entity }: PROVJSONBundle): boolean => (
      (entity !== undefined && Object.keys(entity).includes(identifier))),
    hasEntity: (identifier: string) => ({ entity, bundle }: PROVJSONBundle): boolean => (
      (entity !== undefined && Object.keys(entity).includes(identifier))
      || (
        bundle !== undefined
        && Object.values(bundle).find(queries.bundle.hasEntity(identifier)) !== undefined)),
    hasLocalBundle: (identifier: string) => ({ bundle }: PROVJSONBundle): boolean => (
      (bundle !== undefined && Object.keys(bundle).includes(identifier))),
    hasBundle: (identifier: string) => ({ bundle }: PROVJSONBundle): boolean => (
      (bundle !== undefined && Object.keys(bundle).includes(identifier))
      || (
        bundle !== undefined
        && Object.values(bundle).find(queries.bundle.hasBundle(identifier)) !== undefined)),
  },
  node: {
    getFullName: (identifier: string) => ({ prefix }: PROVJSONBundle) => (
      `${(prefix || {})[identifier.split(':')[0]]}${identifier.split(':')[1]}`
    ),
    getVariant: (identifier: string) => (document: PROVJSONBundle): NodeVariant => {
      if (queries.bundle.hasEntity(identifier)(document)) {
        return 'entity';
      } if (queries.bundle.hasActivity(identifier)(document)) {
        return 'activity';
      } if (queries.bundle.hasAgent(identifier)(document)) {
        return 'agent';
      } if (queries.bundle.hasBundle(identifier)(document)) {
        return 'bundle';
      }
      throw new Error(`Node with identifier ${identifier} not found`);
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
  agent: {
    getAll: ({ agent, bundle }: PROVJSONBundle): string[] => [
      ...(agent ? Object.keys(agent) : []),
      ...(bundle ? Object.values(bundle).map(queries.agent.getAll).flat() : []),
    ],
    generateName: (
      prefix: string, index: number = 0,
    ) => (document: PROVJSONBundle): string => (
      queries.bundle.hasNode(`${prefix}:Agent${index > 0 ? ` ${index}` : ''}`)(document)
        ? queries.agent.generateName(prefix, index + 1)(document)
        : `Agent${index > 0 ? ` ${index}` : ''}`),
  },
  activity: {
    getAll: ({ activity, bundle }: PROVJSONBundle): string[] => [
      ...(activity ? Object.keys(activity) : []),
      ...(bundle
        ? Object.values(bundle).map(queries.activity.getAll).flat()
        : []),
    ],
    generateName: (
      prefix: string, index: number = 0,
    ) => (document: PROVJSONBundle): string => (queries.bundle.hasNode(`${prefix}:Activity${index > 0 ? ` ${index}` : ''}`)(document)
      ? queries.activity.generateName(prefix, index + 1)(document)
      : `Activity${index > 0 ? ` ${index}` : ''}`),
  },
  entity: {
    getAll: (bundle: PROVJSONBundle): string[] => [
      ...queries.bundle.getAll(bundle),
      ...(bundle.entity ? Object.keys(bundle.entity) : []),
      ...(bundle.bundle
        ? Object
          .values(bundle.bundle)
          .map((nestedBundle) => queries.entity.getAll(nestedBundle)).flat()
        : []),
    ],
    generateName: (
      prefix: string, index: number = 0,
    ) => (document: PROVJSONBundle): string => (queries.bundle.hasNode(`${prefix}:Entity${index > 0 ? ` ${index}` : ''}`)(document)
      ? queries.entity.generateName(prefix, index + 1)(document)
      : `Entity${index > 0 ? ` ${index}` : ''}`),
  },
  relation: {
    generateID: (index: number = 1) => (bundle: PROVJSONBundle): string => {
      const id = `_:id${index}`;
      return queries.bundle.hasRelation(id)(bundle)
        ? queries.relation.generateID(index + 1)(bundle)
        : id;
    },
    getID: (
      relationName: RelationName, domainID: string, rangeID: string,
    ) => (bundle: PROVJSONBundle): string | null => {
      const entry = bundle[relationName];
      const relation = RELATIONS.find((r) => r.name === relationName)!;
      const nestedBundles = bundle.bundle;
      return ((
        entry
          ? Object.entries(entry)
            .find(([_, value]) => (
              value[relation.domainKey] === domainID
              && value[relation.rangeKey] === rangeID))?.[0]
          : null) || (
        nestedBundles
          ? Object.values(nestedBundles)
            .map(queries.relation.getID(relationName, domainID, rangeID))
            .find((id) => id !== null) || null
          : null
      ));
    },
    getRangeWithDomain: (
      relationName: RelationName, domainID: string,
    ) => (bundle: PROVJSONBundle): string[] => {
      const entry = bundle[relationName];
      const relation = RELATIONS.find((r) => r.name === relationName)!;
      const nestedBundles = bundle.bundle;
      return [
        ...(entry
          ? Object.entries(entry)
            .filter(([_, value]) => value[relation.domainKey] === domainID)
            .map(([_, value]) => value[relation.rangeKey])
          : []),
        ...nestedBundles
          ? Object.values(nestedBundles)
            .map(queries.relation.getRangeWithDomain(relationName, domainID))
            .flat()
          : [],
      ];
    },
  },
};

export default queries;
