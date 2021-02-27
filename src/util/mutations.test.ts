import { ATTRIBUTE_DEFINITIONS } from './document';
import mutations from './mutations';
import { testDocument1 } from './testDocuments';

// Document

test('mutations.document.create', () => {
  expect(mutations.document.create('agent', 'prefix1', 'Agent1')(testDocument1))
    .toEqual({
      ...testDocument1,
      agent: { ...testDocument1.agent, 'prefix1:Agent1': {} },
    });
});

// Namespace

test('mutations.namespace.create', () => {
  expect(mutations.namespace.create('testPrefix', 'testPrefixValue')(testDocument1))
    .toEqual({
      ...testDocument1,
      prefix: { ...testDocument1.prefix, testPrefix: 'testPrefixValue' },
    });
});

test('mutations.namespace.delete', () => {
  expect(mutations.namespace.delete('prefix1')(testDocument1))
    .toEqual({
      ...testDocument1,
      prefix: Object.keys(testDocument1.prefix || {}).reduce<{}>(
        (prevValue, key) => (key === 'prefix1'
          ? prevValue
          : { ...prevValue, [key]: testDocument1.prefix?.[key] }),
        {},
      ),
    });

  expect(mutations.namespace.delete('nestedPrefix1')(testDocument1))
    .toEqual({
      ...testDocument1,
      bundle: {
        ...testDocument1.bundle,
        'prefix1:Bundle': {
          ...testDocument1.bundle?.['prefix1:Bundle'],
          prefix: Object.keys(testDocument1.bundle?.['prefix1:Bundle'].prefix || {}).reduce<{}>(
            (prevValue, key) => (key === 'nestedPrefix1'
              ? prevValue
              : { ...prevValue, [key]: testDocument1.bundle?.['prefix1:Bundle'].prefix?.[key] }),
            {},
          ),
        },
      },
    });
});

test('mutations.namespace.updateValue', () => {
  expect(mutations.namespace.updateValue('prefix1', 'updatedPrefix1Value')(testDocument1))
    .toEqual({
      ...testDocument1,
      prefix: {
        ...testDocument1.prefix,
        prefix1: 'updatedPrefix1Value',
      },
    });

  expect(() => mutations.namespace.updateValue('fakePrefix', 'fakePrefixValue')(testDocument1))
    .toThrow('Could not update prefix value');
});

test('mutations.namespace.updatePrefix', () => {
  expect(mutations.namespace.updatePrefix('prefix2', 'updatedPrefix2')(testDocument1))
    .toEqual({
      ...testDocument1,
      prefix: Object.keys(testDocument1.prefix || {}).reduce<{}>(
        (prevValue, key) => (key === 'prefix2'
          ? prevValue
          : { ...prevValue, [key]: testDocument1.prefix?.[key] }),
        { updatedPrefix2: testDocument1.prefix?.prefix2 },
      ),
    });

  expect(() => mutations.namespace.updatePrefix('fakePrefix', 'fakeUpdatedPrefix')(testDocument1))
    .toThrow('Could not update prefix name');
});

// Node

test('mutations.node.move', () => {
  expect(mutations.node.move('root', 'prefix1:Bundle', 'agent', 'prefix1:Agent')(testDocument1))
    .toEqual({
      ...testDocument1,
      agent: Object.keys(testDocument1.agent || {}).reduce<{}>(
        (prevValue, key) => (key === 'prefix1:Agent'
          ? prevValue
          : { ...prevValue, [key]: testDocument1.agent?.[key] }),
        { },
      ),
      bundle: {
        ...testDocument1.bundle,
        'prefix1:Bundle': {
          ...testDocument1.bundle?.['prefix1:Bundle'],
          agent: {
            ...testDocument1.bundle?.['prefix1:Bundle'].agent,
            'prefix1:Agent': testDocument1.agent?.['prefix1:Agent'],
          },
        },
      },
    });

  expect(() => mutations.node.move('root', 'prefix1:Bundle', 'agent', 'fakeAgent')(testDocument1))
    .toThrow('Node with identifier fakeAgent not found');

  expect(() => mutations.node.move('root', 'fakeBundle', 'agent', 'prefix1:Agent')(testDocument1))
    .toThrow('Could not move node');
});

test('mutations.node.delete', () => {
  expect(mutations.node.delete('agent', 'prefix1:Agent')(testDocument1))
    .toEqual({
      ...testDocument1,
      agent: Object.keys(testDocument1.agent || {}).reduce<{}>(
        (prevValue, key) => (key === 'prefix1:Agent'
          ? prevValue
          : { ...prevValue, [key]: testDocument1.agent?.[key] }),
        { },
      ),
      wasAttributedTo: Object.entries(testDocument1.wasAttributedTo || {}).reduce<{}>(
        (prevValue, [key, value]) => (value['prov:agent'] === 'prefix1:Agent'
          ? prevValue
          : { ...prevValue, [key]: value }),
        { },
      ),
    });

  expect(() => mutations.node.delete('agent', 'fakeAgent')(testDocument1))
    .toThrow('Could not delete node');
});

test('mutations.node.createAttribute', () => {
  expect(mutations.node.createAttribute('agent', 'prefix1:Agent', 'agentKey1', 'agentValue1')(testDocument1))
    .toEqual({
      ...testDocument1,
      agent: {
        ...testDocument1.agent,
        'prefix1:Agent': {
          ...testDocument1.agent?.['prefix1:Agent'],
          agentKey1: 'agentValue1',
        },
      },
    });

  expect(mutations.node.createAttribute('agent', 'nestedPrefix1:nestedAgent', 'agentKey1', 'agentValue1')(testDocument1))
    .toEqual({
      ...testDocument1,
      bundle: {
        ...testDocument1.bundle,
        'prefix1:Bundle': {
          ...testDocument1.bundle?.['prefix1:Bundle'],
          agent: {
            ...testDocument1.bundle?.['prefix1:Bundle'].agent,
            'nestedPrefix1:nestedAgent': {
              ...testDocument1.bundle?.['prefix1:Bundle'].agent?.['nestedPrefix1:nestedAgent'],
              agentKey1: 'agentValue1',
            },
          },
        },
      },
    });
});

test('mutations.node.deleteAttribute', () => {
  expect(mutations.node.deleteAttribute('agent', 'prefix1:Agent', 'agentKey')(testDocument1))
    .toEqual({
      ...testDocument1,
      agent: {
        ...testDocument1.agent,
        'prefix1:Agent': {},
      },
    });

  expect(mutations.node.deleteAttribute('agent', 'nestedPrefix1:nestedAgent', 'nestedAgent1Key')(testDocument1))
    .toEqual({
      ...testDocument1,
      bundle: {
        ...testDocument1.bundle,
        'prefix1:Bundle': {
          ...testDocument1.bundle?.['prefix1:Bundle'],
          agent: {
            ...testDocument1.bundle?.['prefix1:Bundle'].agent,
            'nestedPrefix1:nestedAgent': {},
          },
        },
      },
    });
});

test('mutations.node.setAttributeValue', () => {
  expect(mutations.node.setAttributeValue('agent', 'prefix1:Agent', 'agentKey', 'updatedValue')(testDocument1))
    .toEqual({
      ...testDocument1,
      agent: {
        ...testDocument1.agent,
        'prefix1:Agent': {
          agentKey: 'updatedValue',
        },
      },
    });
});

test('mutations.node.setAttributeName', () => {
  expect(mutations.node.setAttributeName('agent', 'prefix1:Agent', 'agentKey', 'updatedAgentKey')(testDocument1))
    .toEqual({
      ...testDocument1,
      agent: {
        ...testDocument1.agent,
        'prefix1:Agent': {
          updatedAgentKey: 'agentValue',
        },
      },
    });
});

test('mutations.node.setAttribute', () => {
  const startedAtTimeAttribute = ATTRIBUTE_DEFINITIONS.find(({ name }) => name === 'Started At Time')!;
  const updatedDate = (new Date()).toISOString();
  expect(mutations.node.setAttribute('activity', 'prefix1:Activity', startedAtTimeAttribute, updatedDate)(testDocument1))
    .toEqual({
      ...testDocument1,
      activity: {
        ...testDocument1.activity,
        'prefix1:Activity': {
          'prov:startedAtTime': updatedDate,
        },
      },
    });
});

// Relation

test('mutations.relation.create', () => {
  expect(mutations.relation.create('wasAttributedTo', '_:id2', 'prefix1:Entity', 'prefix1:Agent')(testDocument1))
    .toEqual({
      ...testDocument1,
      wasAttributedTo: {
        ...testDocument1.wasAttributedTo,
        '_:id2': {
          'prov:agent': 'prefix1:Agent',
          'prov:entity': 'prefix1:Entity',
        },
      },
    });
});

test('mutations.relation.deleteWithNode', () => {
  expect(mutations.relation.deleteWithNode('prefix1:Entity')(testDocument1))
    .toEqual({
      ...testDocument1,
      wasAttributedTo: {},
    });
});

test('mutations.relation.delete', () => {
  expect(mutations.relation.delete('wasAttributedTo', '_:id1')(testDocument1))
    .toEqual({
      ...testDocument1,
      wasAttributedTo: {},
    });
});

// Bundle

test('mutations.bundle.delete', () => {
  expect(mutations.bundle.delete('prefix1:Bundle')(testDocument1))
    .toEqual({
      ...testDocument1,
      bundle: {
        'prefix1:Bundle1': {},
      },
    });
});

test('mutations.bundle.addNode', () => {
  expect(mutations.bundle.addNode('agent', 'testAgentID', {})(testDocument1))
    .toEqual({
      ...testDocument1,
      agent: {
        ...testDocument1.agent,
        testAgentID: {},
      },
    });
});

test('mutations.bundle.removeNode', () => {
  expect(mutations.bundle.removeNode('entity', 'prefix1:Entity')(testDocument1))
    .toEqual({
      ...testDocument1,
      entity: {},
    });
});
