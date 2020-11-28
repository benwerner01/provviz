import { PROVJSONBundle, PROVJSONDocument } from './document';

export const palette = {
  entity: {
    light: '#fcfba9',
    main: '#fffc87',
    dark: '#e3e15d',
  },
  activity: {
    light: '#bbc8fc',
    main: '#9fb1fc',
    dark: '#7a8bcc',
  },
  agent: {
    light: '#ffdfa1',
    main: '#fed37f',
    dark: '#d6ae5c',
  },
};

const mapBundleToDots = (json: PROVJSONBundle): string => [
  ...(Object.entries(json.bundle || {}).map(([bundleID, value]) => [
    `subgraph "cluster_${bundleID}" {`,
    `label="${bundleID}";`,
    mapBundleToDots(value),
    '}',
  ])).flat(),
  ...(Object.entries(json.agent || {}).map(([agentID, _], i) => (
    `"${agentID}" [shape="house" label="${agentID}" style="filled" fillcolor="${palette.agent.main}"]`
  ))),
  ...Object.entries(json.actedOnBehalfOf || {}).map(([_, value]) => (
    `"${value['prov:delegate']}" -> "${value['prov:responsible']}" [label="actedOnBehalfOf"]`
  )),
  ...Object.entries(json.wasInfluencedBy || {}).map(([_, value]) => (
    `"${value['prov:influencer']}" -> "${value['prov:influencee']}" [label="wasInfluencedBy"]`
  )),
  ...(Object.entries(json.activity || {}).map(([acitivtyID, _], i) => (
    `"${acitivtyID}" [shape="box" label="${acitivtyID}" style="filled" fillcolor="${palette.activity.main}"]`
  ))),
  ...Object.entries(json.used || {}).map(([_, value]) => (
    `"${value['prov:activity']}" -> "${value['prov:entity']}" [label="used"]`
  )),
  ...Object.entries(json.wasInformedBy || {}).map(([_, value]) => (
    `"${value['prov:informed']}" -> "${value['prov:informant']}" [label="wasInformedBy"]`
  )),
  ...Object.entries(json.wasAssociatedWith || {}).map(([_, value]) => (
    `"${value['prov:activity']}" -> "${value['prov:plan']}" [label="wasAssociatedWith"]`
  )),
  ...(Object.entries(json.entity || {}).map(([entityID, _]) => (
    `"${entityID}" [shape="oval" label="${entityID}" style="filled" fillcolor="${palette.entity.main}"]`
  ))),
  ...Object.entries(json.wasGeneratedBy || {}).map(([_, value]) => (
    `"${value['prov:entity']}" -> "${value['prov:activity']}" [label="wasGeneratedBy"]`
  )),
  ...Object.entries(json.wasStartedBy || {}).map(([_, value]) => (
    `"${value['prov:activity']}" -> "${value['prov:trigger']}" [label="wasStartedBy"]`
  )),
  ...Object.entries(json.wasEndedBy || {}).map(([_, value]) => (
    `"${value['prov:activity']}" -> "${value['prov:trigger']}" [label="wasEndedBy"]`
  )),
  ...Object.entries(json.wasInvalidatedBy || {}).map(([_, value]) => (
    `"${value['prov:entity']}" -> "${value['prov:activity']}" [label="wasInvalidatedBy"]`
  )),
  ...Object.entries(json.wasDerivedFrom || {}).map(([_, value]) => (
    `"${value['prov:generatedEntity']}" -> "${value['prov:usedEntity']}" [label="wasDerivedFrom"]`
  )),
  ...Object.entries(json.wasAttributedTo || {}).map(([_, value]) => (
    `"${value['prov:entity']}" -> "${value['prov:agent']}" [label="wasAttributedTo"]`
  )),
  ...Object.entries(json.specializationOf || {}).map(([_, value]) => (
    `"${value['prov:specificEntity']}" -> "${value['prov:generalEntity']}" [label="wasAttributedTo"]`
  )),
  ...Object.entries(json.alternateOf || {}).map(([_, value]) => (
    `"${value['prov:alternate1']}" -> "${value['prov:alternate2']}" [label="alternateOf" dir="both"]`
  )),
  ...Object.entries(json.hadMember || {}).map(([_, value]) => (
    value['prov:entity'].map((entityID) => (
      `"${value['prov:collection']}" -> "${entityID}" [label="hadMember"]`
    ))
  )).flat(),
].join('\n');

export const mapDocumentToDots = (json: PROVJSONDocument): string => [
  'digraph  {', mapBundleToDots(json), '}',
].join('\n');
