import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import { PROVJSONDocument, tbdIsPROVJSONDocument } from '../util/document';
import DocumentContext from './contexts/DocumentContext';
import Editor, { EDITOR_CONTENT_HEIGHT } from './Editor';
import D3Graphviz from './D3Graphviz';
import MenuBar, { MENU_BAR_HEIGHT, View } from './MenuBar';
import TreeView from './TreeView';

export type VisualiserProps = {
  document: object;
  onChange: (newDocumnet: object) => void | null;
  width: number;
  height: number;
  wasmFolderURL: string;
}

const TABS_HEIGHT = 48;

const useStyles = makeStyles((theme) => ({
  wrapper: {
    position: 'relative',
    overflow: 'hidden',
    borderStyle: 'solid',
    borderColor: theme.palette.grey[300],
    borderWidth: 1,
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

  return (
    <DocumentContext.Provider
      value={{
        document: controllingState ? localDocument : document,
        setDocument: controllingState ? setLocalDocument : onChange,
      }}
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
              - (displayEditor ? EDITOR_CONTENT_HEIGHT : 0))}
          />
        )}
        <Editor
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
