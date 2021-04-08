import { PROVJSONDocument } from './definition/document';

export const date1 = (new Date()).toISOString();

export const testDocument1: PROVJSONDocument = {
  prefix: {
    default: 'defaultPrefixValue',
    prefix1: 'prefix1Value',
    prefix2: 'prefix2Value',
  },
  agent: {
    Agent: {},
    'prefix1:Agent': {
      agentKey: 'agentValue',
    },
  },
  activity: {
    'prefix1:Activity': {
      'prov:startTime': date1,
    },
  },
  entity: {
    'prefix1:Entity': {
      customAttributeKey: 'customAttributeValue',
    },
  },
  wasAttributedTo: {
    '_:id1': {
      'prov:agent': 'prefix1:Agent',
      'prov:entity': 'prefix1:Entity',
    },
  },
  bundle: {
    Bundle: {},
    'prefix1:Bundle': {
      prefix: {
        nestedPrefix1: 'nestedPrefix1Value',
        nestedPrefix2: 'nestedPrefix2Value',
      },
      agent: {
        'nestedPrefix1:nestedAgent': {
          nestedAgent1Key: 'nestedAgent1Value',
        },
      },
      activity: {
        'nestedPrefix1:nestedActivity': {
          'prov:startTime': date1,
        },
      },
      entity: {
        'nestedPrefix1:nestedEntity': { },
      },
    },
    'prefix1:Bundle1': {
    },
  },
};
