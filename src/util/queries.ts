import { PROVJSONBundle, PROVJSONDocument } from './document';

const queries = {
  prefix: {
    getAll: ({ prefix }: PROVJSONDocument) => Object.keys(prefix),
  },
  bundle: {
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
    wasGeneratedBy: ({ wasGeneratedBy, bundle }: PROVJSONBundle) => (
      entityID: string,
    ): string[] => [
      ...(wasGeneratedBy
        ? Object
          .entries(wasGeneratedBy)
          .filter(([_, value]) => value['prov:entity'] === entityID)
          .map(([_, value]) => value['prov:activity'])
        : []),
      ...(bundle ? queries.entity.wasGeneratedBy(bundle)(entityID) : []),
    ],
  },
};

export default queries;
