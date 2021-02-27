import { ATTRIBUTE_DEFINITIONS } from './document';
import queries from './queries';
import { testDocument1, date1 } from './testDocuments';

// Prefix

test('queries.prefix.getAll', () => {
  expect(queries.prefix.getAll(testDocument1))
    .toEqual(['prefix1', 'prefix2', 'nestedPrefix1', 'nestedPrefix2']);
});

// Document

test('queries.document.getNodeValue', () => {
  expect(queries.document.getNodeValue('prefix1:Agent')(testDocument1))
    .toEqual({
      agentKey: 'agentValue',
    });

  expect(queries.document.getNodeValue('nestedPrefix1:nestedAgent')(testDocument1))
    .toEqual({
      nestedAgent1Key: 'nestedAgent1Value',
    });

  expect(() => queries.document.getNodeValue('fakeAgent')(testDocument1))
    .toThrow('Node with identifier fakeAgent not found');
});

test('queries.document.getAttributeValue', () => {
  const startedAtTimeAttribute = ATTRIBUTE_DEFINITIONS.find(({ name }) => name === 'Started At Time')!;
  const endedAtTimeAttribute = ATTRIBUTE_DEFINITIONS.find(({ name }) => name === 'Ended At Time')!;
  expect(queries.document.getAttributeValue('activity', 'prefix1:Activity', startedAtTimeAttribute)(testDocument1))
    .toBe(date1);
  expect(queries.document.getAttributeValue('activity', 'prefix1:Activity', endedAtTimeAttribute)(testDocument1))
    .toBe(null);
});

test('queries.document.hasRelation', () => {
  expect(queries.document.hasRelation('_:id1')(testDocument1))
    .toBe(true);
  expect(queries.document.hasRelation('_:id-1')(testDocument1))
    .toBe(false);
});

test('queries.document.hasNode', () => {
  expect(queries.document.hasNode('prefix1:Agent')(testDocument1))
    .toBe(true);
  expect(queries.document.hasNode('nestedPrefix1:nestedAgent')(testDocument1))
    .toBe(true);
  expect(queries.document.hasNode('prefix1:Agent-1')(testDocument1))
    .toBe(false);
});

test('queries.document.hasActivity', () => {
  expect(queries.document.hasActivity('prefix1:Activity')(testDocument1))
    .toBe(true);
  expect(queries.document.hasActivity('nestedPrefix1:nestedActivity')(testDocument1))
    .toBe(true);
  expect(queries.document.hasActivity('prefix1:Activity-1')(testDocument1))
    .toBe(false);
});

test('queries.document.hasAgent', () => {
  expect(queries.document.hasAgent('prefix1:Agent')(testDocument1))
    .toBe(true);
  expect(queries.document.hasAgent('nestedPrefix1:nestedAgent')(testDocument1))
    .toBe(true);
  expect(queries.document.hasAgent('prefix1:Agent-1')(testDocument1))
    .toBe(false);
});

test('queries.document.hasEntity', () => {
  expect(queries.document.hasEntity('prefix1:Entity')(testDocument1))
    .toBe(true);
  expect(queries.document.hasEntity('nestedPrefix1:nestedEntity')(testDocument1))
    .toBe(true);
  expect(queries.document.hasEntity('prefix1:Entity-1')(testDocument1))
    .toBe(false);
});

test('queries.document.hasBundle', () => {
  expect(queries.document.hasBundle('prefix1:Bundle')(testDocument1))
    .toBe(true);
  expect(queries.document.hasBundle('prefix1:Bundle-1')(testDocument1))
    .toBe(false);
});

// Bundle

test('queries.bundle.getAll', () => {
  expect(queries.bundle.getAll(testDocument1))
    .toEqual(['prefix1:Bundle', 'prefix1:Bundle1']);
});

test('queries.bundle.generateName', () => {
  expect(queries.bundle.generateName('prefix1')(testDocument1))
    .toBe('Bundle2');
});

test('queries.bundle.getLocalNodeValue', () => {
  expect(queries.bundle.getLocalNodeValue('prefix1:Agent')(testDocument1))
    .toEqual({ agentKey: 'agentValue' });
});

// Node

test('queries.node.getAll', () => {
  expect(queries.node.getAll('agent')(testDocument1))
    .toEqual(['prefix1:Agent', 'nestedPrefix1:nestedAgent']);
});

test('queries.node.generateName', () => {
  expect(queries.node.generateName('agent', 'prefix1')(testDocument1))
    .toEqual('Agent1');
});

test('queries.node.getFullName', () => {
  expect(queries.node.getFullName('prefix1:Agent')(testDocument1))
    .toBe('prefix1ValueAgent');
});

test('queries.node.getVariant', () => {
  expect(queries.node.getVariant('prefix1:Agent')(testDocument1))
    .toBe('agent');
});

test('queries.node.getAttributes', () => {
  expect(queries.node.getAttributes('agent', 'prefix1:Agent')(testDocument1))
    .toEqual([['agentKey', 'agentValue']]);
  expect(queries.node.getAttributes('agent', 'nestedPrefix1:nestedAgent')(testDocument1))
    .toEqual([['nestedAgent1Key', 'nestedAgent1Value']]);
});

test('queries.node.getOutgoingRelations', () => {
  expect(queries.node.getOutgoingRelations('prefix1:Entity')(testDocument1))
    .toEqual([['_:id1', {
      'prov:agent': 'prefix1:Agent',
      'prov:entity': 'prefix1:Entity',
    }]]);
});

test('queries.node.getIncomingRelations', () => {
  expect(queries.node.getIncomingRelations('prefix1:Agent')(testDocument1))
    .toEqual([['_:id1', {
      'prov:agent': 'prefix1:Agent',
      'prov:entity': 'prefix1:Entity',
    }]]);
});

// Relation

test('queries.relation.generateID', () => {
  expect(queries.relation.generateID()(testDocument1))
    .toBe('_:id2');
});

test('queries.relation.getID', () => {
  expect(queries.relation.getID('wasAttributedTo', 'prefix1:Entity', 'prefix1:Agent')(testDocument1))
    .toBe('_:id1');
});

test('queries.relation.getRangeWithDomain', () => {
  expect(queries.relation.getRangeWithDomain('wasAttributedTo', 'prefix1:Entity')(testDocument1))
    .toEqual(['prefix1:Agent']);
});
