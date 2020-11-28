import React, { useContext } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import AddIcon from '@material-ui/icons/Add';
import {
  createActivity, createAgent, createEntity,
} from '../util/document';
import DocumentContext from './contexts/DocumentContext';

export const MENU_BAR_HEIGHT = 48;

const useStyles = makeStyles((theme) => ({
  wrapper: {
    height: MENU_BAR_HEIGHT,
    backgroundColor: theme.palette.grey[100],
    borderBottomStyle: 'solid',
    borderBottomColor: theme.palette.grey[300],
    borderBottomWidth: 1,
  },
  buttonRoot: {
    '&:not(:first-child)': {
      marginLeft: theme.spacing(1),
    },
  },
  buttonLabel: {
    textTransform: 'none',
  },
}));

type MenuBarProps = {

}

const MenuBar: React.FC<MenuBarProps> = () => {
  const classes = useStyles();
  const { document, setDocument } = useContext(DocumentContext);

  const handleCreateAgent = () => {
    setDocument(createAgent(document)('test', '1'));
  };

  const handleCreateActivity = () => {
    setDocument(createActivity(document)('test', '1'));
  };

  const handleCreateEntity = () => {
    setDocument(createEntity(document)('test', '1'));
  };

  const buttonClasses = { root: classes.buttonRoot, label: classes.buttonLabel };

  return (
    <Box px={1} display="flex" alignItems="center" className={classes.wrapper}>
      <Button classes={buttonClasses} onClick={handleCreateAgent} variant="contained" endIcon={<AddIcon />}>Agent</Button>
      <Button classes={buttonClasses} onClick={handleCreateActivity} variant="contained" endIcon={<AddIcon />}>Activity</Button>
      <Button classes={buttonClasses} onClick={handleCreateEntity} variant="contained" endIcon={<AddIcon />}>Entity</Button>
    </Box>
  );
};

export default MenuBar;
