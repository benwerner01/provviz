import { createMuiTheme } from '@material-ui/core/styles';
import React, { Dispatch, SetStateAction } from 'react';

const defaultTheme = createMuiTheme();

type PaletteOverride = {
  nodeID: string;
  color: string;
}

export type VisualisationSettings = {
  palette: {
    agent: string;
    activity: string;
    entity: string;
    bundle: string;
    overrides: PaletteOverride[];
  }
}

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
    overrides: [],
  },
};

export default React.createContext<VisualisationContext>({
  visualisationSettings: defaultSettings,
  setVisualisationSettings: (
    dispatch: VisualisationSettings | ((action: VisualisationSettings) => VisualisationSettings),
  ) => undefined,
});
