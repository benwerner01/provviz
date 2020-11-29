import {
  PROVJSONBundle, PROVJSONDocument, RelationName, relations,
} from './document';

const queries = {
  prefix: {
    getAll: ({ prefix }: PROVJSONDocument) => Object.keys(prefix),
  },
  bundle: {
    hasRelation: (bundle: PROVJSONBundle) => (
      identifier: string,
    ): boolean => {
      const nestedBundle = bundle.bundle;
      return ((
        relations.find(({ name }) => {
          const relation = bundle[name];
          return (
            (relation && Object.keys(relation).includes(identifier)));
        }) !== undefined)
      || (
        nestedBundle
          ? Object.keys(nestedBundle).find((key) => (
            queries.bundle.hasRelation(nestedBundle[key])(identifier)
          )) !== undefined
          : false));
    },
    hasActivity: ({ activity, bundle }: PROVJSONBundle) => (identifier: string): boolean => (
      (activity !== undefined && Object.keys(activity).includes(identifier))
      || (bundle !== undefined && Object.keys(bundle).find(((key) => (
        queries.bundle.hasActivity(bundle[key])(identifier)
      ))) !== undefined)),
    hasAgent: ({ agent, bundle }: PROVJSONBundle) => (identifier: string): boolean => (
      (agent !== undefined && Object.keys(agent).includes(identifier))
      || (bundle !== undefined && Object.keys(bundle).find(((key) => (
        queries.bundle.hasAgent(bundle[key])(identifier)
      ))) !== undefined)),
    hasEntity: ({ entity, bundle }: PROVJSONBundle) => (identifier: string): boolean => (
      (entity !== undefined && Object.keys(entity).includes(identifier))
      || (bundle !== undefined && Object.keys(bundle).find(((key) => (
        queries.bundle.hasEntity(bundle[key])(identifier)
      ))) !== undefined)),
  },
  node: {
    getFullName: ({ prefix }: PROVJSONDocument) => (identifier: string) => (
      `${prefix[identifier.split(':')[0]]}${identifier.split(':')[1]}`
    ),
  },
  agent: {
    getAll: ({ agent, bundle }: PROVJSONBundle): string[] => [
      ...(agent ? Object.keys(agent) : []),
      ...(bundle ? Object.keys(bundle).map((key) => queries.agent.getAll(bundle[key])).flat() : []),
    ],
    generateName: (document: PROVJSONDocument) => (
      prefix: string, index: number = 0,
    ): string => (queries.bundle.hasAgent(document)(`${prefix}:Agent${index > 0 ? ` ${index}` : ''}`)
      ? queries.agent.generateName(document)(prefix, index + 1)
      : `Agent${index > 0 ? ` ${index}` : ''}`),
  },
  activity: {
    getAll: ({ activity, bundle }: PROVJSONBundle): string[] => [
      ...(activity ? Object.keys(activity) : []),
      ...(bundle
        ? Object.keys(bundle).map((key) => queries.activity.getAll(bundle[key])).flat()
        : []),
    ],
    generateName: (document: PROVJSONDocument) => (
      prefix: string, index: number = 0,
    ): string => (queries.bundle.hasActivity(document)(`${prefix}:Activity${index > 0 ? ` ${index}` : ''}`)
      ? queries.activity.generateName(document)(prefix, index + 1)
      : `Activity${index > 0 ? ` ${index}` : ''}`),
  },
  entity: {
    getAll: ({ entity, bundle }: PROVJSONBundle): string[] => [
      ...(entity ? Object.keys(entity) : []),
      ...(bundle
        ? Object.keys(bundle).map((key) => queries.entity.getAll(bundle[key])).flat()
        : []),
    ],
    generateName: (document: PROVJSONDocument) => (
      prefix: string, index: number = 0,
    ): string => (queries.bundle.hasEntity(document)(`${prefix}:Entity${index > 0 ? ` ${index}` : ''}`)
      ? queries.entity.generateName(document)(prefix, index + 1)
      : `Entity${index > 0 ? ` ${index}` : ''}`),
  },
  relation: {
    generateID: (bundle: PROVJSONBundle, index: number = 1): string => {
      const id = `_:id${index}`;
      return queries.bundle.hasRelation(bundle)(id)
        ? queries.relation.generateID(bundle, index + 1)
        : id;
    },
    getID: (bundle: PROVJSONBundle) => (
      relationName: RelationName, domainID: string, rangeID: string,
    ): string | null => {
      const entry = bundle[relationName];
      const relation = relations.find((r) => r.name === relationName)!;
      const nestedBundles = bundle.bundle;
      return ((
        entry
          ? Object.entries(entry)
            .find(([_, value]) => (
              value[relation.domainKey] === domainID
              && value[relation.rangeKey] === rangeID))?.[0]
          : null) || (
        nestedBundles
          ? Object.values(nestedBundles).map((nestedBundle) => (
            queries.relation.getID(nestedBundle)(relationName, domainID, rangeID)
          )).find((id) => id !== null) || null
          : null
      ));
    },
    getRangeWithDomain: (bundle: PROVJSONBundle) => (
      relationName: RelationName, domainID: string,
    ): string[] => {
      const entry = bundle[relationName];
      const relation = relations.find((r) => r.name === relationName)!;
      const nestedBundles = bundle.bundle;
      return [
        ...(entry
          ? Object.entries(entry)
            .filter(([_, value]) => value[relation.domainKey] === domainID)
            .map(([_, value]) => value[relation.rangeKey])
          : []),
        ...nestedBundles
          ? Object.values(nestedBundles).map((nestedBundle) => (
            queries.relation.getRangeWithDomain(nestedBundle)(relationName, domainID)
          )).flat()
          : [],
      ];
    },
  },
};

export default queries;
