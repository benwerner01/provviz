import React, { SetStateAction, useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import { PROVJSONDocument, tbdIsPROVJSONDocument } from '../util/document';
import DocumentContext from './contexts/DocumentContext';
import Editor, { TABS_HEIGHT } from './Editor';
import D3Graphviz from './D3Graphviz';
import MenuBar, { MENU_BAR_HEIGHT, View } from './MenuBar';
import TreeView from './TreeView';

export type VisualiserProps = {
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
  wasmFolderURL, width, height, document, onChange,
}) => {
  if (!tbdIsPROVJSONDocument(document)) throw new Error('Could not parse PROV JSON Document');
  const classes = useStyles();

  const [controllingState, setControllingState] = useState(onChange === null);

  const [localDocument, setLocalDocument] = useState<PROVJSONDocument>(document);
  const [displayEditor, setDisplayEditor] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<View>('Graph');
  const [editorContentHeight, setEditorContentHeight] = useState<number>(400);

  const [selectedNodeID, setSelectedNodeID] = useState<string | undefined>();

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
    : (action: SetStateAction<PROVJSONDocument>) => {
      if (onChange) {
        if (typeof action === 'function') onChange(action(contextDocument));
        else onChange(action);
      }
    };

  return (
    <DocumentContext.Provider
      value={{ document: contextDocument, setDocument: contextSetDocument }}
    >
      <Box
        className={classes.wrapper}
        style={{ width, height }}
      >
        <MenuBar
          setSelectedNodeID={setSelectedNodeID}
          currentView={currentView}
          setCurrentView={setCurrentView}
        />
        {currentView === 'Graph' && (
          <D3Graphviz
            selectedNodeID={selectedNodeID}
            setSelectedNodeID={setSelectedNodeID}
            width={width}
            wasmFolderURL={wasmFolderURL}
            height={height - MENU_BAR_HEIGHT - TABS_HEIGHT}
          />
        )}
        {currentView === 'Tree' && (
          <TreeView
            width={width}
            height={(
              height
              - MENU_BAR_HEIGHT
              - TABS_HEIGHT
              - (displayEditor ? editorContentHeight : 0))}
          />
        )}
        <Editor
          contentHeight={editorContentHeight}
          setContentHeight={setEditorContentHeight}
          selectedNodeID={selectedNodeID}
          setSelectedNodeID={setSelectedNodeID}
          open={displayEditor}
          setOpen={setDisplayEditor}
        />
      </Box>
    </DocumentContext.Provider>
  );
};

export default Visualiser;
