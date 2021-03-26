import { createMuiTheme } from '@material-ui/core/styles';
import React, { Dispatch, SetStateAction } from 'react';
import { RelationVariant } from '../../util/definition/relation';

const defaultTheme = createMuiTheme();

export type ProvenanceView = 'Responsibility' | 'Data Flow' | 'Proccess Flow'

const tbdIsProvenanceView = (tbd: string): tbd is ProvenanceView => (
  tbd === 'Responsibility' || tbd === 'Data Flow' || tbd === 'Proccess Flow'
);

export const PROVENANCE_VIEW_NAMES: ProvenanceView[] = ['Proccess Flow', 'Data Flow', 'Responsibility'];

export type ProvenanceViewDefinition = {
  description: string;
  nodes: ('activity' | 'agent' | 'entity')[];
  relations: RelationVariant[]
}

// Descriptions taken from Chapter 3 of 'Provenance: An Introduction to PROV'
export const PROVENANVE_VIEW_DEFINITIONS: { [key: string]: ProvenanceViewDefinition} = {
  'Data Flow': {
    description: 'The data flow view focuses on the flow of information and the transformation of things in systems. Information items and things are termed entities, whereas flows and transformations are termed derivations.',
    nodes: ['entity'],
    relations: ['wasDerivedFrom'],
  },
  'Proccess Flow': {
    description: 'The process flow view refines the data flow view by introducing activities, their inter-relations with entities, and their respective times.',
    nodes: ['entity', 'activity'],
    relations: ['wasGeneratedBy', 'used', 'wasInvalidatedBy', 'wasStartedBy', 'wasEndedBy', 'wasInformedBy'],
  },
  Responsibility: {
    description: 'The responsibility view is concerned with the assignment of responsibility to agents for what happened in a system.',
    nodes: ['entity', 'activity', 'agent'],
    relations: ['wasAttributedTo', 'wasAssociatedWith', 'actedOnBehalfOf'],
  },
};

export type HiddenNamespace = {
  bundleID?: string;
  prefix: string;
}

const tbdIsHiddenNamespace = (tbd: object): tbd is HiddenNamespace => (
  typeof (tbd as HiddenNamespace).prefix === 'string'
);

export type VisualisationSettings = {
  palette: {
    agent: string;
    activity: string;
    entity: string;
    bundle: string;
  }
  hideAllNodeAttributes: boolean;
  hiddenNamespaces: HiddenNamespace[];
  view: ProvenanceView | null;
}

export const tbdIsVisualisationSettings = (tbd: any): tbd is VisualisationSettings => (
  (
    tbd.palette !== undefined
    && typeof tbd.palette === 'object'
    && typeof tbd.palette.agent === 'string'
    && typeof tbd.palette.activity === 'string'
    && typeof tbd.palette.entity === 'string'
    && typeof tbd.palette.bundle === 'string'
  )
  && (
    tbd.hideAllNodeAttributes !== undefined
    && typeof tbd.hideAllNodeAttributes === 'boolean'
  )
  && (
    tbd.hiddenNamespaces !== undefined
    && typeof tbd.hiddenNamespaces === 'object'
    && Array.isArray(tbd.hiddenNamespaces)
    && tbd.hiddenNamespaces.filter(tbdIsHiddenNamespace).length === 0
  )
  && (
    tbd.view !== undefined
    && (
      (typeof tbd.view === 'string' && tbdIsProvenanceView(tbd.view))
      || tbd.view === null
    )
  )
);

export type VisualisationContext = {
  visualisationSettings: VisualisationSettings;
  setVisualisationSettings: Dispatch<SetStateAction<VisualisationSettings>>;
}

export const defaultSettings: VisualisationSettings = {
  palette: {
    agent: '#fed37f',
    activity: '#9fb1fc',
    entity: '#fffc87',
    bundle: defaultTheme.palette.grey['300'],
  },
  hideAllNodeAttributes: false,
  hiddenNamespaces: [],
  view: null,
};

export default React.createContext<VisualisationContext>({
  visualisationSettings: defaultSettings,
  setVisualisationSettings: (
    dispatch: VisualisationSettings | ((action: VisualisationSettings) => VisualisationSettings),
  ) => undefined,
});
