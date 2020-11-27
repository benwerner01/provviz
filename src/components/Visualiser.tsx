import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import {
  createActivity, createAgent, createEntity, PROVJSONDocument, tbdIsPROVJSONDocument,
} from '../util/document';
import DocumentContext from './contexts/DocumentContext';
import Editor from './Editor';
import D3Graphviz from './D3Graphviz';

export type VisualiserProps = {
  document: object;
  onChange?: (newDocumnet: object) => void;
  width: number;
  height: number;
  wasmFolderURL: string;
}

const HEADER_HEIGHT = 48;
const TABS_HEIGHT = 48;

const useStyles = makeStyles((theme) => ({
  wrapper: {
    position: 'relative',
    overflow: 'hidden',
    borderStyle: 'solid',
    borderColor: theme.palette.grey[300],
    borderWidth: 1,
  },
  heading: {
    height: HEADER_HEIGHT,
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

  const [localDocument, setLocalDocument] = useState<PROVJSONDocument>(document);
  const [displayEditor, setDisplayEditor] = useState<boolean>(false);

  const [selectedNodeID, setSelectedNodeID] = useState<string | undefined>();

  const handleCreateAgent = () => {
    setLocalDocument(createAgent(localDocument)('test', '1'));
  };

  const handleCreateActivity = () => {
    setLocalDocument(createActivity(localDocument)('test', '1'));
  };

  const handleCreateEntity = () => {
    setLocalDocument(createEntity(localDocument)('test', '1'));
  };

  return (
    <DocumentContext.Provider value={{ document: localDocument, setDocument: setLocalDocument }}>
      <Box className={classes.wrapper} style={{ width, height }}>
        <Box display="flex" className={classes.heading}>
          <Button onClick={handleCreateAgent} variant="contained">Create Agent</Button>
          <Button onClick={handleCreateActivity} variant="contained">Create Activity</Button>
          <Button onClick={handleCreateEntity} variant="contained">Create Entity</Button>
        </Box>
        <D3Graphviz
          selectedNodeID={selectedNodeID}
          setSelectedNodeID={setSelectedNodeID}
          width={width}
          wasmFolderURL={wasmFolderURL}
          height={height - HEADER_HEIGHT - TABS_HEIGHT}
        />
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
