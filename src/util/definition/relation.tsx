import React, { ReactNode } from 'react';
import { NodeVariant } from './document';

export type RelationVariant = 'wasGeneratedBy'
| 'used'
| 'wasInformedBy'
| 'wasStartedBy'
| 'wasEndedBy'
| 'wasInvalidatedBy'
| 'wasDerivedFrom'
| 'wasAttributedTo'
| 'wasAssociatedWith'
| 'actedOnBehalfOf'
| 'wasInfluencedBy'
| 'specializationOf'
| 'alternateOf'
| 'hadMember'

export const RELATION_VARIANTS: RelationVariant[] = [
  'wasGeneratedBy',
  'used',
  'wasInformedBy',
  'wasStartedBy',
  'wasEndedBy',
  'wasInvalidatedBy',
  'wasDerivedFrom',
  'wasAttributedTo',
  'wasAssociatedWith',
  'actedOnBehalfOf',
  'wasInfluencedBy',
  'specializationOf',
  'alternateOf',
  'hadMember',
];

export const tbdIsRelationVariant = (
  tbd: string,
): tbd is RelationVariant => RELATION_VARIANTS.includes(tbd as RelationVariant);

export type Relation = {
name: RelationVariant;
documentation: ReactNode;
url: string;
domain: NodeVariant;
domainKey: string;
range: NodeVariant;
rangeKey: string;
}

export const RELATIONS: Relation[] = [
  {
    name: 'wasGeneratedBy',
    documentation: (
      <>
        <strong><i>Generation</i></strong>
        {' is the completion of production of a new entity by an activity. This entity did not exist before generation and becomes available for usage after this generation.'}
      </>
    ),
    url: 'https://www.w3.org/ns/prov#wasGeneratedBy',
    domain: 'entity',
    domainKey: 'prov:entity',
    range: 'activity',
    rangeKey: 'prov:activity',
  },
  {
    name: 'used',
    documentation: (
      <>
        <strong><i>Usage</i></strong>
        {' is the beginning of utilizing an entity by an activity. Before usage, the activity had not begun to utilize this entity and could not have been affected by the entity.'}
      </>
    ),
    url: 'https://www.w3.org/ns/prov#used',
    domain: 'activity',
    domainKey: 'prov:activity',
    range: 'entity',
    rangeKey: 'prov:entity',
  },
  {
    name: 'wasInformedBy',
    documentation: (
      <>
        <strong><i>Communication</i></strong>
        {' is the exchange of some unspecified entity by two activities, one activity using some entity generated by the other.'}
      </>
    ),
    url: 'https://www.w3.org/ns/prov#wasInformedBy',
    domain: 'activity',
    domainKey: 'prov:informed',
    range: 'activity',
    rangeKey: 'prov:informant',
  },
  {
    name: 'wasStartedBy',
    documentation: (
      <>
        <strong><i>Start</i></strong>
        {' is when an activity is deemed to have been started by an entity, known as '}
        <strong><i>trigger</i></strong>
        {'. The activity did not exist before its start. Any usage, generation, or invalidation involving an activity follows the activity\'s start. A start may refer to a trigger entity that set off the activity, or to an activity, known as '}
        <strong><i>starter</i></strong>
        , that generated the trigger.
      </>
    ),
    url: 'https://www.w3.org/ns/prov#wasStartedBy',
    domain: 'activity',
    domainKey: 'prov:activity',
    range: 'entity',
    rangeKey: 'prov:trigger',
  },
  {
    name: 'wasEndedBy',
    documentation: (
      <>
        <strong><i>End</i></strong>
        {' is when an activity is deemed to have been ended by an entity, known as '}
        <strong><i>trigger</i></strong>
        {'. The activity no longer exists after its end. Any usage, generation, or invalidation involving an activity precedes the activity\'s end. An end may refer to a trigger entity that terminated the activity, or to an activity, known as '}
        <strong><i>ender</i></strong>
        , that generated the trigger.
      </>
    ),
    url: 'https://www.w3.org/ns/prov#wasEndedBy',
    domain: 'activity',
    domainKey: 'prov:activity',
    range: 'entity',
    rangeKey: 'prov:trigger',
  },
  {
    name: 'wasInvalidatedBy',
    documentation: (
      <>
        <strong><i>Invalidation</i></strong>
        {' is the start of the destruction, cessation, or expiry of an existing entity by an activity. The entity is no longer available for use (or further invalidation) after invalidation. Any generation or usage of an entity precedes its invalidation.'}
      </>
    ),
    url: 'https://www.w3.org/ns/prov#wasInvalidatedBy',
    domain: 'entity',
    domainKey: 'prov:entity',
    range: 'activity',
    rangeKey: 'prov:activity',
  },
  {
    name: 'wasDerivedFrom',
    documentation: (
      <>
        {'A '}
        <strong><i>derivation</i></strong>
        {' is a transformation of an entity into another, an update of an entity resulting in a new one, or the construction of a new entity based on a pre-existing entity.'}
      </>
    ),
    url: 'https://www.w3.org/ns/prov#wasDerivedFrom',
    domain: 'entity',
    domainKey: 'prov:generatedEntity',
    range: 'entity',
    rangeKey: 'prov:usedEntity',
  },
  {
    name: 'wasAttributedTo',
    documentation: (
      <>
        <strong><i>Attribution</i></strong>
        {' is the ascribing of an entity to an agent.'}
      </>
    ),
    url: 'https://www.w3.org/ns/prov#wasAttributedTo',
    domain: 'entity',
    domainKey: 'prov:entity',
    range: 'agent',
    rangeKey: 'prov:agent',
  },
  {
    name: 'wasAssociatedWith',
    documentation: (
      <>
        {'An activity '}
        <strong><i>association</i></strong>
        {' is an assignment of responsibility to an agent for an activity, indicating that the agent had a role in the activity. It further allows for a plan to be specified, which is the plan intended by the agent to achieve some goals in the context of this activity.'}
      </>
    ),
    url: 'https://www.w3.org/ns/prov#wasAssociatedWith',
    domain: 'activity',
    domainKey: 'prov:activity',
    range: 'agent',
    rangeKey: 'prov:agent',
  },
  {
    name: 'actedOnBehalfOf',
    documentation: (
      <>
        <strong><i>Delegation</i></strong>
        {' is the assignment of authority and responsibility to an agent (by itself or by another agent) to carry out a specific activity as a delegate or representative, while the agent it acts on behalf of retains some responsibility for the outcome of the delegated work.'}
      </>
    ),
    url: 'https://www.w3.org/ns/prov#actedOnBehalfOf',
    domain: 'agent',
    domainKey: 'prov:delegate',
    range: 'agent',
    rangeKey: 'prov:responsible',
  },
  {
    name: 'wasInfluencedBy',
    documentation: (
      <>
        <strong><i>Influence</i></strong>
        {' is the capacity of an entity, activity, or agent to have an effect on the character, development, or behavior of another by means of usage, start, end, generation, invalidation, communication, derivation, attribution, association, or delegation.'}
      </>
    ),
    url: 'https://www.w3.org/ns/prov#wasInfluencedBy',
    domain: 'entity',
    domainKey: 'prov:influencer',
    range: 'agent',
    rangeKey: 'prov:influencee',
  },
  {
    name: 'specializationOf',
    documentation: (
      <>
        {'An entity that is a '}
        <strong><i>specialization</i></strong>
        {' of another shares all aspects of the latter, and additionally presents more specific aspects of the same thing as the latter. In particular, the lifetime of the entity being specialized contains that of any specialization.'}
      </>
    ),
    url: 'https://www.w3.org/ns/prov#specializationOf',
    domain: 'entity',
    domainKey: 'prov:specificEntity',
    range: 'entity',
    rangeKey: 'prov:generalEntity',
  },
  {
    name: 'alternateOf',
    documentation: (
      <>
        {'Two '}
        <strong><i>alternate</i></strong>
        {' entities present aspects of the same thing. These aspects may be the same or different, and the alternate entities may or may not overlap in time.'}
      </>
    ),
    url: 'https://www.w3.org/ns/prov#alternateOf',
    domain: 'entity',
    domainKey: 'prov:alternate1',
    range: 'entity',
    rangeKey: 'prov:alternate2',
  },
  {
    name: 'hadMember',
    documentation: (
      <>
        <strong><i>Membership</i></strong>
        {' is the belonging of an entity to a collection.'}
      </>
    ),
    url: 'https://www.w3.org/ns/prov#hadMember',
    domain: 'entity',
    domainKey: 'prov:collection',
    range: 'entity',
    rangeKey: 'prov:entity',
  },
];
