import { PROVJSONBundle, PROVJSONDocument, relations } from './document';

const queries = {
  prefix: {
    getAll: ({ prefix }: PROVJSONDocument) => Object.keys(prefix),
  },
  bundle: {
    hasRelation: (bundle: PROVJSONBundle) => (
      identifier: string,
    ): boolean => ((
      relations.find(({ name }) => {
        const relation = bundle[name];
        return (
          (relation && Object.keys(relation).includes(identifier)));
      }) !== undefined)
      || (bundle.bundle
        ? queries.bundle.hasRelation(bundle.bundle)(identifier)
        : false)),
    hasActivity: ({ activity, bundle }: PROVJSONBundle) => (identifier: string): boolean => (
      (activity !== undefined && Object.keys(activity).includes(identifier))
      || (bundle !== undefined && queries.bundle.hasActivity(bundle)(identifier))
    ),
    hasAgent: ({ agent, bundle }: PROVJSONBundle) => (identifier: string): boolean => (
      (agent !== undefined && Object.keys(agent).includes(identifier))
      || (bundle !== undefined && queries.bundle.hasAgent(bundle)(identifier))
    ),
    hasEntity: ({ entity, bundle }: PROVJSONBundle) => (identifier: string): boolean => (
      (entity !== undefined && Object.keys(entity).includes(identifier))
      || (bundle !== undefined && queries.bundle.hasEntity(bundle)(identifier))
    ),
  },
  node: {
    getFullName: ({ prefix }: PROVJSONDocument) => (identifier: string) => (
      `${prefix[identifier.split(':')[0]]}${identifier.split(':')[1]}`
    ),
  },
  agent: {
    getAll: ({ agent, bundle }: PROVJSONBundle): string[] => [
      ...(agent ? Object.keys(agent) : []),
      ...(bundle ? queries.agent.getAll(bundle) : []),
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
      ...(bundle ? queries.activity.getAll(bundle) : []),
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
      ...(bundle ? queries.entity.getAll(bundle) : []),
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
    wasGeneratedBy: {
      getID: ({ wasGeneratedBy, bundle }: PROVJSONBundle) => (
        entityID: string, activityID: string,
      ): string | null => ((
        wasGeneratedBy
          ? Object
            .entries(wasGeneratedBy)
            .find(([_, value]) => value['prov:entity'] === entityID && value['prov:activity'] === activityID)
            ?.[0]
          : undefined
      ) || (
        bundle
          ? queries.relation.wasGeneratedBy.getID(bundle)(entityID, activityID)
          : null)),
      getRangeWithDomain: ({ wasGeneratedBy, bundle }: PROVJSONBundle) => (
        entityID: string,
      ): string[] => [
        ...(wasGeneratedBy
          ? Object
            .entries(wasGeneratedBy)
            .filter(([_, value]) => value['prov:entity'] === entityID)
            .map(([_, value]) => value['prov:activity'])
          : []),
        ...(bundle ? queries.relation.wasGeneratedBy.getRangeWithDomain(bundle)(entityID) : []),
      ],
    },
  },
};

export default queries;
