import React, { ReactNode } from 'react';
import { validatePROVJSONSchema } from '../ajv';
import queries from '../queries';
import { RelationVariant, RELATIONS, RELATION_VARIANTS } from './relation';

export type NodeVariant = 'activity' | 'agent' | 'entity'

export const NODE_VARIANTS: NodeVariant[] = ['activity', 'agent', 'entity'];

export const tbdIsNodeVariant = (tbd: string): tbd is NodeVariant => (
  NODE_VARIANTS.includes(tbd as NodeVariant)
);

export type Variant = 'bundle' | NodeVariant | RelationVariant

export type ProvVizShape = 'box' | 'polygon' | 'ellipse' | 'oval' | 'circle'
  | 'egg' | 'triangle' | 'diamond' | 'trapezium' | 'parallelogram' | 'house'
  | 'pentagon' | 'hexagon' | 'septagon' | 'octagon' | 'invtriangle' | 'invtrapezium'
  | 'invhouse' | 'rectangle' | 'square' | 'star' | 'cylinder' | 'note' | 'tab'
  | 'folder' | 'box3d' | 'component' | 'cds'

export const PROVVIZ_SHAPES: ProvVizShape[] = [
  'box', 'polygon', 'ellipse', 'oval', 'circle', 'egg', 'triangle',
  'diamond', 'trapezium', 'parallelogram', 'house', 'pentagon', 'hexagon',
  'septagon', 'octagon', 'invtriangle', 'invtrapezium', 'invhouse', 'rectangle',
  'square', 'star', 'cylinder', 'note', 'tab', 'folder', 'box3d', 'component', 'cds',
];

export const tbdIsProvVizShape = (tbd: string): tbd is ProvVizShape => PROVVIZ_SHAPES
  .includes(tbd as ProvVizShape);

type TypedLiteral = {
  '$': string;
  type: string;
  lang?: string;
}

type LiteralArray = (string | number | boolean | TypedLiteral)[]

export type AttributeValue = string
| number
| boolean
| TypedLiteral
| LiteralArray

type Entity = { [attributeKey: string]: AttributeValue; }

type Agent = Entity

type Activity = {
  'prov:startTime'?: string;
  'prov:endTime'?: string;
} & { [attributeKey: string]: AttributeValue; }

type Generation = {
  'prov:entity': string;
  'prov:activity': string;
  'prov:time'?: string
} & { [attributeKey: string]: AttributeValue; }

type Usage = Generation;

type Communication = {
  'prov:informant': string;
  'prov:informed': string;
} & { [attributeKey: string]: AttributeValue; }

type Start = {
  'prov:activity': string;
  'prov:time'?: string;
  'prov:trigger'?: string;
} & { [attributeKey: string]: AttributeValue; }

type End = Start

type Invalidation = {
  'prov:entity': string;
  'prov:time'?: string;
  'prov:activity'?: string;
} & { [attributeKey: string]: AttributeValue; }

type Derivation = {
  'prov:generatedEntity': string;
  'prov:usedEntity': string;
  'prov:activity'?: string;
  'prov:generation'?: string;
  'prov:usage'?: string;
} & { [attributeKey: string]: AttributeValue; }

type Attribution = {
  'prov:entity': string;
  'prov:agent': string;
} & { [attributeKey: string]: AttributeValue; }

type Association = {
  'prov:activity': string;
  'prov:agent'?: string;
  'prov:plan'?: string;
} & { [attributeKey: string]: AttributeValue; }

type Delegation = {
  'prov:delegate': string;
  'prov:responsible': string;
  'prov:activity'?: string;
  'prov:type'?: string;
} & { [attributeKey: string]: AttributeValue; }

type Influence = {
  'prov:influencer': string;
  'prov:influencee': string;
} & { [attributeKey: string]: AttributeValue; }

type Specialization = {
  'prov:generalEntity': string;
  'prov:specificEntity': string;
} & { [attributeKey: string]: AttributeValue; }

type Alternate = {
  'prov:alternate1': string;
  'prov:alternate2': string;
} & { [attributeKey: string]: AttributeValue; }

type Membership = {
  'prov:collection': string;
  'prov:entity': string;
} & { [attributeKey: string]: AttributeValue; }

export interface PROVJSONBundle {
  prefix?: { [prefixName: string]: string; }
  agent?: { [agentID: string]: { [attributeKey: string]: AttributeValue; } }
  actedOnBehalfOf?: { [relationID: string]: Delegation }
  wasInfluencedBy?: { [relationID: string]: Influence }
  activity?: { [acitivtyID: string]: Activity }
  wasInformedBy?: { [relationID: string]: Communication }
  used?: { [relationID: string]: Usage }
  wasAssociatedWith?: { [relationID: string]: Association }
  entity?: { [entityID: string]: Entity }
  wasGeneratedBy?: { [relationID: string]: Generation }
  wasStartedBy?: { [relationID: string]: Start }
  wasEndedBy?: { [relationID: string]: End }
  wasInvalidatedBy?: { [relationID: string]: Invalidation }
  wasDerivedFrom?: { [relationID: string]: Derivation }
  wasAttributedTo?: { [relationID: string]: Attribution }
  specializationOf?: { [relationID: string]: Specialization }
  alternateOf?: { [relationID: string]: Alternate }
  hadMember?: { [relationID: string]: Membership }
}

export interface PROVJSONDocument extends PROVJSONBundle {
  bundle?: { [bundleID: string]: PROVJSONBundle; }
}

export const validateDocument = (document: PROVJSONDocument): ReactNode[] => {
  const schemaValidation = validatePROVJSONSchema(document);
  const globalPrefixes = queries.namespace.getAll()(document);

  if (schemaValidation === true) {
    return [
      // For each node variant...
      (['agent', 'entity', 'activity'] as NodeVariant[]).map((variant) => {
        const nodes = queries.node.getAll(variant)(document);
        const capitalisedVariant = `${variant.charAt(0).toUpperCase()}${variant.slice(1)}`;
        return [
          ...Object.entries(document[variant] || {})
            .map(([id, attributes]) => {
              const prefix = queries.document.parsePrefixFromID(id);
              // ...check if a matching global namespace declaration exists...
              return [
                // ...for its attributes
                ...Object.keys(attributes).map((attributeKey) => {
                  const attributePrefix = queries.document.parsePrefixFromID(attributeKey);
                  return globalPrefixes.includes(attributePrefix)
                    ? []
                    : (
                      <>
                        <i>{capitalisedVariant}</i>
                        {' with identifier '}
                        <strong>{`"${id}"`}</strong>
                        {' has attribute with key '}
                        <strong>{`"${attributeKey}"`}</strong>
                        {' that references global namespace declaration '}
                        <strong>{`"${attributePrefix}"`}</strong>
                        {' that is not defined'}
                      </>
                    );
                }),
                // ...for its identifier
                globalPrefixes.includes(prefix)
                  ? []
                  : (
                    <>
                      <i>{capitalisedVariant}</i>
                      {' with identifier '}
                      <strong>{`"${id}"`}</strong>
                      {' references global namespace declaration '}
                      <strong>{`"${prefix}"`}</strong>
                      {' that is not defined'}
                    </>
                  ),
              ];
            }).flat(),
          // For each bundle...
          ...Object.entries(document.bundle || {})
            .map(([bundleID, bundle]) => {
              const bundlePrefixes = queries.namespace.getAll(bundleID)(document);
              const availablePrefixes = [...globalPrefixes, ...bundlePrefixes];
              return [
                // For each instance of the variant in the bundle...
                ...Object.entries(bundle[variant] || {})
                  .map(([id, attributes]) => {
                    const prefix = queries.document.parsePrefixFromID(id);
                    // ...check if a matching namespace declaration exists...
                    return [
                    // ...for its attributes...
                      ...Object.keys(attributes).map((attributeKey) => {
                        const attributePrefix = queries.document.parsePrefixFromID(attributeKey);
                        return availablePrefixes.includes(attributePrefix)
                          ? []
                          : (
                            <>
                              <i>{capitalisedVariant}</i>
                              {' with identifier '}
                              <strong>{`"${id}"`}</strong>
                              {' in the '}
                              <i>Bundle</i>
                              {' with identifier '}
                              <strong>{`"${bundleID}"`}</strong>
                              {' has attribute with key '}
                              <strong>{`"${attributeKey}"`}</strong>
                              {' references namespace declaration '}
                              <strong>{`"${attributePrefix}"`}</strong>
                              {' that is not defined in the bundle or globally'}
                            </>
                          );
                      }),
                      // ...and its identifier
                      availablePrefixes.includes(prefix)
                        ? []
                        : (
                          <>
                            <i>{capitalisedVariant}</i>
                            {' with identifier '}
                            <strong>{`"${id}"`}</strong>
                            {' in the '}
                            <i>Bundle</i>
                            {' with identifier '}
                            <strong>{`"${bundleID}"`}</strong>
                            {' references namespace declaration '}
                            <strong>{`"${prefix}"`}</strong>
                            {' that is not defined in the bundle or globally'}
                          </>
                        ),
                    ];
                  }).flat(),
              ].flat();
            }),
          // For each relationship...
          ...RELATIONS.map(({
            name, domain, domainKey, range, rangeKey,
          }) => [
          // ...if the domain or range match the variant check that these are defined
            (
              domain === variant
            || range === variant
            ) ? [
                ...Object.entries(document[name] || {})
                  .map(([id, value]) => [
                    (domain === variant && !nodes.includes(value[domainKey]))
                      ? (
                        <>
                          <i>{name}</i>
                          {' relation with ID '}
                          <strong>{`"${id}"`}</strong>
                          {' references undefined '}
                          <i>{variant}</i>
                          {' '}
                          <strong>{`"${value[domainKey]}"`}</strong>
                        </>
                      )
                      : [],
                    (range === variant && !nodes.includes(value[rangeKey]))
                      ? (
                        <>
                          <i>{name}</i>
                          {' relation with ID '}
                          <strong>{`"${id}"`}</strong>
                          {' references undefined '}
                          <i>{variant}</i>
                          {' '}
                          <strong>{`"${value[rangeKey]}"`}</strong>
                        </>
                      )
                      : [],
                  ].flat()).flat(),
                ...Object.entries(document.bundle || {})
                  .map(([bundleID, bundle]) => Object.entries(bundle[name] || {})
                    .map(([id, value]) => [
                      (domain === variant && !nodes.includes(value[domainKey]))
                        ? (
                          <>
                            {'Bundle '}
                            <strong>{`"${bundleID}"`}</strong>
                            {': '}
                            <i>{name}</i>
                            {' relation with ID '}
                            <strong>{`${id}`}</strong>
                            {' references undefined '}
                            <i>{variant}</i>
                            {' '}
                            <strong>{`"${value[domainKey]}"`}</strong>
                          </>
                        )
                        : [],
                      (range === variant && !nodes.includes(value[rangeKey]))
                        ? (
                          <>
                            {'Bundle '}
                            <strong>{`"${bundleID}"`}</strong>
                            {': '}
                            <i>{name}</i>
                            {' relation with ID '}
                            <strong>{`"${id}"`}</strong>
                            {' references undefined '}
                            <i>{variant}</i>
                            {' '}
                            <strong>{`"${value[rangeKey]}"`}</strong>
                          </>
                        )
                        : [],
                    ].flat())).flat(),
              ].flat() : [],
          ]).flat(),
        ].flat();
      }).flat(),
      // For each relationship variant...
      RELATION_VARIANTS.map((variant) => {
        const capitalisedVariant = `${variant.charAt(0).toUpperCase()}${variant.slice(1)}`;

        return [
          // ...check if a matching namespace declaration exists for its attributes
          ...Object.entries(document[variant] || {})
            .map(([id, attributes]) => [
              ...Object.keys(attributes).map((attributeKey) => {
                const attributePrefix = queries.document.parsePrefixFromID(attributeKey);
                return globalPrefixes.includes(attributePrefix)
                  ? []
                  : (
                    <>
                      <i>{capitalisedVariant}</i>
                      {' relationship with identifier '}
                      <strong>{`"${id}"`}</strong>
                      {' has attribute with key '}
                      <strong>{`"${attributeKey}"`}</strong>
                      {' that references global namespace declaration '}
                      <strong>{`"${attributePrefix}"`}</strong>
                      {' that is not defined'}
                    </>
                  );
              }),
            ]).flat(),
          ...Object.entries(document.bundle || {})
            .map(([bundleID, bundle]) => {
              const bundlePrefixes = queries.namespace.getAll(bundleID)(document);
              const availablePrefixes = [...globalPrefixes, ...bundlePrefixes];
              return [
                ...Object.values(bundle[variant] || {})
                  .map((attributes) => Object.keys(attributes).map((attributeKey) => {
                    const attributePrefix = queries.document.parsePrefixFromID(attributeKey);
                    return availablePrefixes.includes(attributePrefix)
                      ? []
                      : (
                        <>
                          <i>{capitalisedVariant}</i>
                          {' relationship '}
                          {' in the '}
                          <i>Bundle</i>
                          {' with identifier '}
                          <strong>{`"${bundleID}"`}</strong>
                          {' has attribute with key '}
                          <strong>{`"${attributeKey}"`}</strong>
                          {' references namespace declaration '}
                          <strong>{`"${attributePrefix}"`}</strong>
                          {' that is not defined in the bundle or globally'}
                        </>
                      );
                  })).flat(),
              ];
            }).flat(),
        ].flat();
      }).flat(),
    ].flat();
  }

  return schemaValidation.map(({ dataPath, message }) => (
    <>
      <strong>{`${dataPath}: `}</strong>
      {message}
    </>
  ));
};
