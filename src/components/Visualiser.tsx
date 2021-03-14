import React, {
  ReactNode, SetStateAction, useEffect, useState,
} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import download from 'downloadjs';
import { Typography } from '@material-ui/core';
import { PROVJSONDocument, validateDocument, Variant } from '../util/document';
import DocumentContext from './contexts/DocumentContext';
import Editor, { TABS_HEIGHT } from './Editor';
import D3Graphviz from './D3Graphviz';
import MenuBar, { MENU_BAR_HEIGHT, View } from './MenuBar';
import TreeView from './TreeView';
import VisualisationContext, { VisualisationSettings, defaultSettings } from './contexts/VisualisationContext';
import { palette } from '../util/theme';

export const MIN_WIDTH = 350;

export type VisualiserProps = {
  documentName?: string;
  document: object;
  onChange: ((updatedDocument: object) => void) | null;
  initialSettings?: VisualisationSettings;
  onSettingsChange?: (updatedSettings: VisualisationSettings) => void;
  width: number;
  height: number;
  wasmFolderURL: string;
}

export type Selection = {
  variant: Variant;
  id: string;
}

const useStyles = makeStyles((theme) => ({
  wrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  graphvizWrapper: {
    width: '100%',
    height: '100%',
    transition: theme.transitions.create('max-height'),
    overflow: 'hidden',
  },
  validationErrorHeading: {
    color: palette.danger.main,
  },
}));

const Visualiser: React.FC<VisualiserProps> = ({
  wasmFolderURL, width, height, documentName, document, onChange, initialSettings, onSettingsChange,
}) => {
  const classes = useStyles();
  const [svgElement, setSVGElement] = useState<SVGSVGElement | undefined>();

  const [controllingState, setControllingState] = useState(onChange === null);

  const [
    visualisationSettings,
    setVisualisationSettings] = useState<VisualisationSettings>(initialSettings || defaultSettings);

  const [localDocument, setLocalDocument] = useState<PROVJSONDocument>(document);
  const [displayEditor, setDisplayEditor] = useState<boolean>(false);
  const [displayEditorContent, setDisplayEditorContent] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<View>('Graph');
  const [editorContentHeight, setEditorContentHeight] = useState<number>(400);
  const [validationErrors, setValidationErrors] = useState<ReactNode[]>(validateDocument(document));

  const [selected, setSelected] = useState<Selection | undefined>();
  const [displaySettings, setDisplaySettings] = useState<boolean>(false);
  const [searching, setSearching] = useState<boolean>(false);
  const [searchString, setSearchString] = useState<string>('');

  useEffect(() => {
    if (searching) setCurrentView('Tree');
  }, [searching]);

  useEffect(() => {
    if (controllingState && onChange !== null) {
      console.log('⚠️ WARNING: Visualiser component is changing from controlled state to uncontrolled state');
      setControllingState(false);
    } else if (!controllingState && onChange === null) {
      console.log('⚠️ WARNING: Visualiser component is changing from uncontrolled state to controlled state');
      setControllingState(true);
    }
  }, [controllingState, onChange]);

  useEffect(() => {
    setVisualisationSettings(initialSettings || defaultSettings);
  }, [documentName]);

  const contextDocument = controllingState ? localDocument : document;

  useEffect(() => {
    setValidationErrors(validateDocument(contextDocument));
  }, [contextDocument]);

  const contextSetDocument = controllingState
    ? setLocalDocument
    : (action: SetStateAction<PROVJSONDocument>) => {
      if (onChange) {
        if (typeof action === 'function') onChange(action(contextDocument));
        else onChange(action);
      }
    };

  const downloadVisualisation = () => {
    if (svgElement) {
      const serializedSVG = (new XMLSerializer())
        .serializeToString(svgElement);
      download(new Blob([serializedSVG]), `${documentName || 'Visualisation'}.svg`, 'image/svg');
    }
  };

  const handleSelectedChange = (updatedSelected: Selection | undefined) => {
    if (updatedSelected && !displayEditorContent) setDisplayEditorContent(true);
    setSelected(updatedSelected);
  };

  const handleVisualisationSettings = (
    action: SetStateAction<VisualisationSettings>,
  ) => {
    setVisualisationSettings(action);
    if (onSettingsChange) {
      if (typeof action === 'function') onSettingsChange(action(visualisationSettings));
      else onSettingsChange(action);
    }
  };

  return (
    <DocumentContext.Provider
      value={{ document: contextDocument, setDocument: contextSetDocument }}
    >
      <VisualisationContext.Provider
        value={{
          visualisationSettings,
          setVisualisationSettings: handleVisualisationSettings,
        }}
      >
        <Box
          className={classes.wrapper}
          style={{ width, height }}
        >
          <MenuBar
            displaySettings={() => {
              setSelected(undefined);
              setDisplaySettings(true);
              setDisplayEditorContent(true);
            }}
            collapseButtons={width < (searching ? 800 : 650)}
            collapseIconButtons={width < 650 && searching}
            setSelected={handleSelectedChange}
            currentView={currentView}
            setCurrentView={setCurrentView}
            downloadVisualisation={downloadVisualisation}
            searching={searching}
            setSearching={setSearching}
            searchString={searchString}
            setSearchString={setSearchString}
          />
          {validationErrors.length > 0
            ? (
              <Box m={1}>
                <Typography className={classes.validationErrorHeading} variant="h5">
                  <strong>Error Validating PROV Document</strong>
                </Typography>
                <ul>
                  {validationErrors.map((error, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <li key={i}><Typography>{error}</Typography></li>
                  ))}
                </ul>
              </Box>
            )
            : (
              <>
                {currentView === 'Graph' && (
                <D3Graphviz
                  selected={selected}
                  setSelected={handleSelectedChange}
                  width={width}
                  wasmFolderURL={wasmFolderURL}
                  setSVGElement={setSVGElement}
                  height={(
                    height
                    - MENU_BAR_HEIGHT
                    - (displayEditor ? TABS_HEIGHT : 0)
                    - (displayEditorContent ? editorContentHeight : 0))}
                />
                )}
                {currentView === 'Tree' && (
                <TreeView
                  width={width}
                  height={(
                    height
                    - MENU_BAR_HEIGHT
                    - (displayEditor ? TABS_HEIGHT : 0)
                    - (displayEditorContent ? editorContentHeight : 0))}
                  selected={selected}
                  setSelected={handleSelectedChange}
                  searchString={searchString}
                />
                )}
                <Editor
                  displaySettings={displaySettings}
                  setDisplaySettings={setDisplaySettings}
                  contentHeight={editorContentHeight}
                  setContentHeight={setEditorContentHeight}
                  selected={selected}
                  setSelected={handleSelectedChange}
                  display={displayEditor}
                  setDisplay={setDisplayEditor}
                  open={displayEditorContent}
                  setOpen={setDisplayEditorContent}
                />
              </>
            )}
        </Box>
      </VisualisationContext.Provider>
    </DocumentContext.Provider>
  );
};

export default Visualiser;
