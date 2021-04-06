import Color from 'color';
import { PROVENANVE_VIEW_DEFINITIONS, VisualisationSettings } from '../components/contexts/VisualisationContext';
import {
  NodeVariant,
  NODE_VARIANTS,
  PROVJSONBundle, PROVJSONDocument, tbdIsProvVizShape,
} from './definition/document';
import { Relation, RELATIONS, RELATION_VARIANTS } from './definition/relation';
import { ATTRIBUTE_DEFINITIONS, PROVAttributeDefinition, PROVVIZ_ATTRIBUTE_DEFINITIONS } from './definition/attribute';
import queries from './queries';

const DEFAULT_NODE_SHAPE = {
  agent: 'house',
  activity: 'box',
  entity: 'oval',
};

const renderAttributeValue = (value: any) => (typeof value === 'object' ? value.$ : value);

const mapAttributestoDot = (
  id: string,
) => (attributes: [string, any][]) => (
  `"${id}_attributes" [shape="note" label="${attributes
    .map(([attributeID, value]) => `${attributeID} = ${renderAttributeValue(value)}`).join('\n')}"];`);

const mapNodeToDot = (variant: 'agent' | 'activity' | 'entity', settings: VisualisationSettings) => (
  [id, attributes]: [string, { [attributeKey: string]: any; }],
) => {
  const shapeString = queries.document.parseStringFromAttributeValue(attributes['provviz:shape']);
  const shape = (shapeString && tbdIsProvVizShape(shapeString))
    ? shapeString
    : DEFAULT_NODE_SHAPE[variant];
  const fillcolor = queries.document.parseStringFromAttributeValue(attributes['provviz:color']) || settings.palette[variant];
  const fontcolor = Color(fillcolor).isLight() ? '#000000' : '#FFFFFF';

  const filteredAttributes = Object.entries(attributes || {})
    .filter(([key]) => PROVVIZ_ATTRIBUTE_DEFINITIONS.find((a) => a.key === key) === undefined);

  return [
    `"${id}" [
      id="${id}"
      shape="${shape}"
      label="${id}"
      style="filled"
      fillcolor="${fillcolor}"
      fontcolor="${fontcolor}"
    ]`,
    (
      filteredAttributes.length > 0
      && !settings.hideAllNodeAttributes
      && !queries.document.parseBooleanFromAttributeValue(attributes['provviz:hideAttributes'])
    ) ? [
        mapAttributestoDot(id)(filteredAttributes),
        `"${id}" -> "${id}_attributes" [style="dotted" dir="none"]`,
      ] : [],
  ].flat().join('\n');
};

const mapDefinedAttributeToDot = (
  id: string, attributes: { [attributeKey: string]: any; },
) => ({ key, name }: PROVAttributeDefinition) => (
  `"${id}_midpoint" -> "${queries.document.parseStringFromAttributeValue(attributes[key])}" [label="${name}", id="${id}"];`
);

const mapRelationToDot = (relation: Relation, settings: VisualisationSettings) => (
  [id, attributes]: [string, { [attributeKey: string]: any; }],
) => {
  const { name, domainKey, rangeKey } = relation;
  const otherDefinedAttributes = ATTRIBUTE_DEFINITIONS
    .filter(({ domain, range, key }) => (
      domain.includes(name)
      && ![domainKey, rangeKey].includes(key)
      && NODE_VARIANTS.includes(range as NodeVariant)
      && attributes[key]
    ));

  const customAttributes = Object.entries(attributes || {})
    .filter(([key]) => (
      PROVVIZ_ATTRIBUTE_DEFINITIONS.find((a) => a.key === key) === undefined
      && ![domainKey, rangeKey].includes(key)
      && otherDefinedAttributes.find((a) => a.key === key) === undefined
    ));

  const showAttributes = (
    customAttributes.length > 0
    && !settings.hideAllNodeAttributes
    && !queries.document.parseBooleanFromAttributeValue(attributes['provviz:hideAttributes'])
  );

  if (otherDefinedAttributes.length > 0 || showAttributes) {
    return `
      "${id}_midpoint" [
        shape=point,
        id="${id}"];
      "${queries.document.parseStringFromAttributeValue(attributes[domainKey])}" -> "${id}_midpoint" [
        ${name === 'alternateOf' ? 'dir=back' : 'dir=none'},
        label="${name}",
        id="${id}"];
      "${id}_midpoint" -> "${queries.document.parseStringFromAttributeValue(attributes[rangeKey])}" [id="${id}"];
      ${otherDefinedAttributes.map(mapDefinedAttributeToDot(id, attributes))}
      ${showAttributes
    ? [
      mapAttributestoDot(id)(customAttributes),
      `"${id}_midpoint" -> "${id}_attributes" [style="dotted" dir="none"]`,
    ].join('\n') : ''}
    `;
  }

  return `"${queries.document.parseStringFromAttributeValue(attributes[domainKey])}" -> "${queries.document.parseStringFromAttributeValue(attributes[rangeKey])}" [
    label="${name}"
    ${name === 'alternateOf' ? ' dir="both"' : ''}
    id="${id}"]`;
};

const mapBundleToDots = (
  bundle: PROVJSONBundle,
  settings: VisualisationSettings,
  hiddenNodes: string[],
  hiddenRelationships: string[],
): string => [
  ...(Object
    .entries((
      settings.view !== null
      && !PROVENANVE_VIEW_DEFINITIONS[settings.view].nodes.includes('agent')
    ) ? {} : bundle.agent || {})
    .filter(([id]) => !hiddenNodes.includes(id))
    .map(mapNodeToDot('agent', settings))),
  ...(Object
    .entries((
      settings.view !== null
      && !PROVENANVE_VIEW_DEFINITIONS[settings.view].nodes.includes('activity')
    ) ? {} : bundle.activity || {})
    .filter(([id]) => !hiddenNodes.includes(id))
    .map(mapNodeToDot('activity', settings))),
  ...(Object
    .entries((
      settings.view !== null
      && !PROVENANVE_VIEW_DEFINITIONS[settings.view].nodes.includes('entity')
    ) ? {} : bundle.entity || {})
    .filter(([id]) => !hiddenNodes.includes(id))
    .map(mapNodeToDot('entity', settings))),
  ...RELATIONS.map((relation) => Object
    .entries((
      settings.view !== null
      && !PROVENANVE_VIEW_DEFINITIONS[settings.view].relations.includes(relation.name)
    ) ? {} : bundle[relation.name] || {})
    .filter(([id, value]) => (
      !hiddenRelationships.includes(id)
      && !hiddenNodes.includes(value[relation.domainKey])
      && !hiddenNodes.includes(value[relation.rangeKey])))
    .map(mapRelationToDot(relation, settings))).flat(),
].join('\n');

const getAllHiddenNodes = (settings: VisualisationSettings, bundleID?: string) => ({
  agent, activity, entity, bundle,
}: PROVJSONDocument): string[] => [
  ...Object.entries({ ...agent, ...activity, ...entity })
    .filter(([id, attributes]) => (
      queries.document.parseBooleanFromAttributeValue(attributes['provviz:hide']) === true
      || settings.hiddenNamespaces.find((hidden) => {
        const prefix = queries.document.parsePrefixFromID(id) || 'default';
        return (
          hidden.prefix === prefix
          && (hidden.bundleID === bundleID || hidden.bundleID === undefined));
      }) !== undefined))
    .map(([id]) => id),
  ...Object.entries(bundle || {})
    .map(([id, nestedBundle]) => getAllHiddenNodes(settings, id)(nestedBundle))
    .flat(),
];

const getAllHiddenRelations = (
  settings: VisualisationSettings,
) => (document: PROVJSONDocument): string[] => [
  ...RELATION_VARIANTS.map((variant) => Object.entries(document[variant] || {})
    .filter(([_, attributes]) => (
      queries.document.parseBooleanFromAttributeValue(attributes['provviz:hide']) === true
    )).map(([id]) => id)).flat(),
  ...Object.values(document.bundle || {})
    .map(getAllHiddenRelations(settings))
    .flat(),
];

export const mapDocumentToDots = (
  document: PROVJSONDocument,
  settings: VisualisationSettings,
): string => {
  const hiddenNodes = getAllHiddenNodes(settings)(document);
  const hiddenRelationship = getAllHiddenRelations(settings)(document);
  return [
    'digraph  {',
    `rankdir="${settings.direction}";`,
    ...(Object
      .entries(document.bundle || {})
      .map(([bundleID, bundle]) => [
        `subgraph "cluster_${bundleID}" {`,
        `label="${bundleID}";`,
        mapBundleToDots(bundle, settings, hiddenNodes, hiddenRelationship),
        '}',
      ])).flat(),
    mapBundleToDots(document, settings, hiddenNodes, hiddenRelationship),
    '}',
  ].join('\n');
};
