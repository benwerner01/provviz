import AJV from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new AJV({});
addFormats(ajv);

ajv.addVocabulary(['prov:startTime', 'prov:endTime']);

// JSON Schema adapted from https://www.w3.org/Submission/2013/SUBM-prov-json-20130424/schema
const schema = {
  $id: 'http://provenance.ecs.soton.ac.uk/prov-json/schema#',
  $schema: 'http://json-schema.org/draft-07/schema#',
  description: 'Schema for a PROV-JSON document',
  type: 'object',
  additionalProperties: false,
  properties: {
    prefix: { type: 'object', patternProperties: { '^[a-zA-Z0-9_\\-]+$': { type: 'string' } } },
    entity: { type: 'object', additionalProperties: { $ref: '#/definitions/entity' } },
    activity: { type: 'object', additionalProperties: { $ref: '#/definitions/activity' } },
    agent: { type: 'object', additionalProperties: { $ref: '#/definitions/agent' } },
    wasGeneratedBy: { type: 'object', additionalProperties: { $ref: '#/definitions/generation' } },
    used: { type: 'object', additionalProperties: { $ref: '#/definitions/usage' } },
    wasInformedBy: { type: 'object', additionalProperties: { $ref: '#/definitions/communication' } },
    wasStartedBy: { type: 'object', additionalProperties: { $ref: '#/definitions/start' } },
    wasEndedBy: { type: 'object', additionalProperties: { $ref: '#/definitions/end' } },
    wasInvalidatedBy: { type: 'object', additionalProperties: { $ref: '#/definitions/invalidation' } },
    wasDerivedFrom: { type: 'object', additionalProperties: { $ref: '#/definitions/derivation' } },
    wasAttributedTo: { type: 'object', additionalProperties: { $ref: '#/definitions/attribution' } },
    wasAssociatedWith: { type: 'object', additionalProperties: { $ref: '#/definitions/association' } },
    actedOnBehalfOf: { type: 'object', additionalProperties: { $ref: '#/definitions/delegation' } },
    wasInfluencedBy: { type: 'object', additionalProperties: { $ref: '#/definitions/influence' } },
    specializationOf: { type: 'object', additionalProperties: { $ref: '#/definitions/specialization' } },
    alternateOf: { type: 'object', additionalProperties: { $ref: '#/definitions/alternate' } },
    hadMember: { type: 'object', additionalProperties: { $ref: '#/definitions/membership' } },
    bundle: { type: 'object', additionalProperties: { $ref: '#/definitions/bundle' } },
  },
  definitions: {
    typedLiteral: {
      title: 'PROV-JSON Typed Literal', type: 'object', properties: { $: { type: 'string' }, type: { type: 'string' }, lang: { type: 'string' } }, required: ['$'], additionalProperties: false,
    },
    stringLiteral: { type: 'string' },
    numberLiteral: { type: 'number' },
    booleanLiteral: { type: 'boolean' },
    literalArray: { type: 'array', minItems: 1, items: { anyOf: [{ $ref: '#/definitions/stringLiteral' }, { $ref: '#/definitions/numberLiteral' }, { $ref: '#/definitions/booleanLiteral' }, { $ref: '#/definitions/typedLiteral' }] } },
    attributeValues: { anyOf: [{ $ref: '#/definitions/stringLiteral' }, { $ref: '#/definitions/numberLiteral' }, { $ref: '#/definitions/booleanLiteral' }, { $ref: '#/definitions/typedLiteral' }, { $ref: '#/definitions/literalArray' }] },
    entity: { type: 'object', title: 'entity', additionalProperties: { $ref: '#/definitions/attributeValues' } },
    agent: { $ref: '#/definitions/entity' },
    activity: {
      type: 'object',
      title: 'activity',
      'prov:startTime': { type: 'string', format: 'date-time' },
      'prov:endTime': { type: 'string', format: 'date-time' },
      additionalProperties: { $ref: '#/definitions/attributeValues' },
    },
    generation: {
      type: 'object',
      title: 'generation/usage',
      properties: {
        'prov:entity': { type: 'string' },
        'prov:activity': { type: 'string' },
        'prov:time': { type: 'string', format: 'date-time' },
      },
      required: ['prov:entity'],
      additionalProperties: { $ref: '#/definitions/attributeValues' },
    },
    usage: { $ref: '#/definitions/generation' },
    communication: {
      type: 'object', title: 'communication', properties: { 'prov:informant': { type: 'string' }, 'prov:informed': { type: 'string' } }, required: ['prov:informant', 'prov:informed'], additionalProperties: { $ref: '#/definitions/attributeValues' },
    },
    start: {
      type: 'object', title: 'start/end', properties: { 'prov:activity': { type: 'string' }, 'prov:time': { type: 'string', format: 'date-time' }, 'prov:trigger': { type: 'string' } }, required: ['prov:activity'], additionalProperties: { $ref: '#/definitions/attributeValues' },
    },
    end: { $ref: '#/definitions/start' },
    invalidation: {
      type: 'object', title: 'invalidation', properties: { 'prov:entity': { type: 'string' }, 'prov:time': { type: 'string', format: 'date-time' }, 'prov:activity': { type: 'string' } }, required: ['prov:entity'], additionalProperties: { $ref: '#/definitions/attributeValues' },
    },
    derivation: {
      type: 'object',
      title: 'derivation',
      properties: {
        'prov:generatedEntity': { type: 'string' }, 'prov:usedEntity': { type: 'string' }, 'prov:activity': { type: 'string' }, 'prov:generation': { type: 'string' }, 'prov:usage': { type: 'string' },
      },
      required: ['prov:generatedEntity', 'prov:usedEntity'],
      additionalProperties: { $ref: '#/definitions/attributeValues' },
    },
    attribution: {
      type: 'object', title: 'attribution', properties: { 'prov:entity': { type: 'string' }, 'prov:agent': { type: 'string' } }, required: ['prov:entity', 'prov:agent'], additionalProperties: { $ref: '#/definitions/attributeValues' },
    },
    association: {
      type: 'object', title: 'association', properties: { 'prov:activity': { type: 'string' }, 'prov:agent': { type: 'string' }, 'prov:plan': { type: 'string' } }, required: ['prov:activity'], additionalProperties: { $ref: '#/definitions/attributeValues' },
    },
    delegation: {
      type: 'object', title: 'delegation', properties: { 'prov:delegate': { type: 'string' }, 'prov:responsible': { type: 'string' }, 'prov:activity': { type: 'string' } }, required: ['prov:delegate', 'prov:responsible'], additionalProperties: { $ref: '#/definitions/attributeValues' },
    },
    influence: {
      type: 'object', title: '', properties: { 'prov:influencer': { type: 'string' }, 'prov:influencee': { type: 'string' } }, required: ['prov:influencer', 'prov:influencee'], additionalProperties: { $ref: '#/definitions/attributeValues' },
    },
    specialization: {
      type: 'object', title: 'specialization', properties: { 'prov:generalEntity': { type: 'string' }, 'prov:specificEntity': { type: 'string' } }, required: ['prov:generalEntity', 'prov:specificEntity'], additionalProperties: { $ref: '#/definitions/attributeValues' },
    },
    alternate: {
      type: 'object', title: 'alternate', properties: { 'prov:alternate1': { type: 'string' }, 'prov:alternate2': { type: 'string' } }, required: ['prov:alternate1', 'prov:alternate2'], additionalProperties: { $ref: '#/definitions/attributeValues' },
    },
    membership: {
      type: 'object', title: 'membership', properties: { 'prov:collection': { type: 'string' }, 'prov:entity': { type: 'string' } }, required: ['prov:collection', 'prov:entity'], additionalProperties: { $ref: '#/definitions/attributeValues' },
    },
    bundle: {
      type: 'object',
      title: 'bundle',
      properties: {
        prefix: { type: 'object', patternProperties: { '^[a-zA-Z0-9_\\-]+$': { type: 'string' } } }, entity: { type: 'object', additionalProperties: { $ref: '#/definitions/entity' } }, activity: { type: 'object', additionalProperties: { $ref: '#/definitions/activity' } }, agent: { type: 'object', additionalProperties: { $ref: '#/definitions/agent' } }, wasGeneratedBy: { type: 'object', additionalProperties: { $ref: '#/definitions/generation' } }, used: { type: 'object', additionalProperties: { $ref: '#/definitions/usage' } }, wasInformedBy: { type: 'object', additionalProperties: { $ref: '#/definitions/communication' } }, wasStartedBy: { type: 'object', additionalProperties: { $ref: '#/definitions/start' } }, wasEndedBy: { type: 'object', additionalProperties: { $ref: '#/definitions/end' } }, wasInvalidatedBy: { type: 'object', additionalProperties: { $ref: '#/definitions/invalidation' } }, wasDerivedFrom: { type: 'object', additionalProperties: { $ref: '#/definitions/derivation' } }, wasAttributedTo: { type: 'object', additionalProperties: { $ref: '#/definitions/attribution' } }, wasAssociatedWith: { type: 'object', additionalProperties: { $ref: '#/definitions/association' } }, actedOnBehalfOf: { type: 'object', additionalProperties: { $ref: '#/definitions/delegation' } }, wasInfluencedBy: { type: 'object', additionalProperties: { $ref: '#/definitions/influence' } }, specializationOf: { type: 'object', additionalProperties: { $ref: '#/definitions/specialization' } }, alternateOf: { type: 'object', additionalProperties: { $ref: '#/definitions/alternate' } }, hadMember: { type: 'object', additionalProperties: { $ref: '#/definitions/membership' } },
      },
    },
  },
};

const validate = ajv.compile(schema);

export const validatePROVJSONSchema = (document: object) => (validate(document)
  ? true
  : validate.errors!);
