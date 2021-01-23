import React, { Dispatch, SetStateAction } from 'react';

export type VisualisationSettings = {

}

export type VisualisationContext = {
  visualisationSettings: VisualisationSettings;
  setVisualisationSettings: Dispatch<SetStateAction<VisualisationSettings>>;
}

export const defaultSettings: VisualisationSettings = {

};

export default React.createContext<VisualisationContext>({
  visualisationSettings: defaultSettings,
  setVisualisationSettings: (dispatch: VisualisationSettings) => undefined,
});
