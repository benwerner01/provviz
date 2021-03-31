import Color from 'color';
import { PROVENANVE_VIEW_DEFINITIONS, VisualisationSettings } from '../components/contexts/VisualisationContext';
import {
  PROVJSONBundle, PROVJSONDocument, tbdIsProvVizShape,
} from './definition/document';
import { RELATIONS } from './definition/relation';
import { PROVVIZ_ATTRIBUTE_DEFINITIONS } from './definition/attribute';
import queries from './queries';

const DEFAULT_NODE_SHAPE = {
  agent: 'house',
  activity: 'box',
  entity: 'oval',
};

const renderAttributeValue = (value: any) => (typeof value === 'object' ? value.$ : value);

const mapNodeToDot = (variant: 'agent' | 'activity' | 'entity', settings: VisualisationSettings) => (
  [id, attributes]: [string, { [attributeKey: string]: any; }],
) => {
  const shape = (attributes['provviz:shape'] && tbdIsProvVizShape(attributes['provviz:shape']))
    ? attributes['provviz:shape']
    : DEFAULT_NODE_SHAPE[variant];
  const fillcolor = attributes['provviz:color'] || settings.palette[variant];
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
      && !attributes['provviz:hideAttributes']
    ) ? [
        `"${id}_attributes" [shape="note" label="${filteredAttributes
          .map(([attributeID, value]) => `${attributeID} = ${renderAttributeValue(value)}`).join('\n')}"]`,
        `"${id}" -> "${id}_attributes" [style="dotted" dir="none"]`,
      ] : [],
  ].flat().join('\n');
};

const mapBundleToDots = (
  bundle: PROVJSONBundle, settings: VisualisationSettings, hiddenNodes: string[],
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
  ...RELATIONS.map(({ name, domainKey, rangeKey }) => Object
    .entries((
      settings.view !== null
      && !PROVENANVE_VIEW_DEFINITIONS[settings.view].relations.includes(name)
    ) ? {} : bundle[name] || {})
    .filter(([_, value]) => (
      !hiddenNodes.includes(value[domainKey])
      && !hiddenNodes.includes(value[rangeKey])))
    .map(([id, value]) => (
      `"${value[domainKey]}" -> "${value[rangeKey]}" [label="${name}"${name === 'alternateOf' ? ' dir="both"' : ''} id="${id}"]`
    ))).flat(),
].join('\n');

const getAllHiddenNodes = (settings: VisualisationSettings, bundleID?: string) => ({
  agent, activity, entity, bundle,
}: PROVJSONDocument): string[] => [
  ...Object.entries({ ...agent, ...activity, ...entity })
    .filter(([id, attributes]) => (
      attributes['provviz:hide'] === true
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

export const mapDocumentToDots = (
  document: PROVJSONDocument,
  settings: VisualisationSettings,
): string => {
  const hiddenNodes = getAllHiddenNodes(settings)(document);
  return [
    'digraph  {',
    'rankdir="BT";',
    ...(Object
      .entries(document.bundle || {})
      .map(([bundleID, bundle]) => [
        `subgraph "cluster_${bundleID}" {`,
        `label="${bundleID}";`,
        mapBundleToDots(bundle, settings, hiddenNodes),
        '}',
      ])).flat(),
    mapBundleToDots(document, settings, hiddenNodes),
    '}',
  ].join('\n');
};
