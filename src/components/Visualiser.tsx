import React, { SetStateAction, useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import download from 'downloadjs';
import { PROVJSONBundle, tbdIsPROVJSONBundle } from '../util/document';
import DocumentContext from './contexts/DocumentContext';
import Editor, { TABS_HEIGHT } from './Editor';
import D3Graphviz from './D3Graphviz';
import MenuBar, { MENU_BAR_HEIGHT, View } from './MenuBar';
import TreeView from './TreeView';
import VisualisationContext, { VisualisationSettings, defaultSettings } from './contexts/VisualisationContext';

export const MIN_WIDTH = 350;

export type VisualiserProps = {
  documentName?: string;
  document: object;
  onChange: ((newDocumnet: object) => void) | null;
  width: number;
  height: number;
  wasmFolderURL: string;
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
}));

const Visualiser: React.FC<VisualiserProps> = ({
  wasmFolderURL, width, height, documentName, document, onChange,
}) => {
  if (!tbdIsPROVJSONBundle(document)) throw new Error('Could not parse PROV JSON Document');
  const classes = useStyles();
  const [svgElement, setSVGElement] = useState<SVGSVGElement | undefined>();

  const [controllingState, setControllingState] = useState(onChange === null);

  const [
    visualisationSettings,
    setVisualisationSettings] = useState<VisualisationSettings>(defaultSettings);

  const [localDocument, setLocalDocument] = useState<PROVJSONBundle>(document);
  const [displayEditor, setDisplayEditor] = useState<boolean>(false);
  const [displayEditorContent, setDisplayEditorContent] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<View>('Graph');
  const [editorContentHeight, setEditorContentHeight] = useState<number>(400);

  const [selectedNodeID, setSelectedNodeID] = useState<string | undefined>();
  const [displaySettings, setDisplaySettings] = useState<boolean>(false);

  useEffect(() => {
    if (controllingState && onChange !== null) {
      console.log('⚠️ WARNING: Visualiser component is changing from controlled state to uncontrolled state');
      setControllingState(false);
    } else if (!controllingState && onChange === null) {
      console.log('⚠️ WARNING: Visualiser component is changing from uncontrolled state to controlled state');
      setControllingState(true);
    }
  }, [controllingState, onChange]);

  const contextDocument = controllingState ? localDocument : document;

  const contextSetDocument = controllingState
    ? setLocalDocument
    : (action: SetStateAction<PROVJSONBundle>) => {
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

  const handleSelectedNodeIDChange = (id: string | undefined) => {
    if (id && !displayEditorContent) setDisplayEditorContent(true);
    setSelectedNodeID(id);
  };
  console.log(contextDocument);
  return (
    <DocumentContext.Provider
      value={{ document: contextDocument, setDocument: contextSetDocument }}
    >
      <VisualisationContext.Provider value={{ visualisationSettings, setVisualisationSettings }}>
        <Box
          className={classes.wrapper}
          style={{ width, height }}
        >
          <MenuBar
            displaySettings={() => {
              setDisplaySettings(true);
              setDisplayEditorContent(true);
            }}
            collapseButtons={width < 650}
            setSelectedNodeID={handleSelectedNodeIDChange}
            currentView={currentView}
            setCurrentView={setCurrentView}
            downloadVisualisation={downloadVisualisation}
          />
          {currentView === 'Graph' && (
          <D3Graphviz
            selectedNodeID={selectedNodeID}
            setSelectedNodeID={handleSelectedNodeIDChange}
            width={width}
            wasmFolderURL={wasmFolderURL}
            setSVGElement={setSVGElement}
            height={(
              height
              - MENU_BAR_HEIGHT
              - (displayEditor ? TABS_HEIGHT : 0))}
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
              selectedNodeID={selectedNodeID}
              setSelectedNodeID={handleSelectedNodeIDChange}
            />
          )}
          <Editor
            displaySettings={displaySettings}
            setDisplaySettings={setDisplaySettings}
            contentHeight={editorContentHeight}
            setContentHeight={setEditorContentHeight}
            selectedNodeID={selectedNodeID}
            setSelectedNodeID={handleSelectedNodeIDChange}
            display={displayEditor}
            setDisplay={setDisplayEditor}
            open={displayEditorContent}
            setOpen={setDisplayEditorContent}
          />
        </Box>
      </VisualisationContext.Provider>
    </DocumentContext.Provider>
  );
};

export default Visualiser;
