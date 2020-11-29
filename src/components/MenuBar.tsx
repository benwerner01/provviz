import React, { useContext } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import AddIcon from '@material-ui/icons/Add';
import queries from '../util/queries';
import mutations from '../util/mutations';
import DocumentContext from './contexts/DocumentContext';
import { palette } from '../util/dot';

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
  agentButton: {
    backgroundColor: palette.agent.main,
    '&:hover': {
      backgroundColor: palette.agent.light,
    },
  },
  activityButton: {
    backgroundColor: palette.activity.main,
    '&:hover': {
      backgroundColor: palette.activity.light,
    },
  },
  entityButton: {
    backgroundColor: palette.entity.main,
    '&:hover': {
      backgroundColor: palette.entity.light,
    },
  },
}));

type MenuBarProps = {
  setSelectedNodeID: (id: string) => void;
}

const MenuBar: React.FC<MenuBarProps> = ({ setSelectedNodeID }) => {
  const classes = useStyles();
  const { document, setDocument } = useContext(DocumentContext);

  const handleCreateAgent = () => {
    const prefix = queries.prefix.getAll(document)[0];
    const name = queries.agent.generateName(document)(prefix);
    setDocument(mutations.agent.create(document)(prefix, name));
    setSelectedNodeID(`${prefix}:${name}`);
  };

  const handleCreateActivity = () => {
    const prefix = queries.prefix.getAll(document)[0];
    const name = queries.activity.generateName(document)(prefix);
    setDocument(mutations.activity.create(document)(prefix, name));
    setSelectedNodeID(`${prefix}:${name}`);
  };

  const handleCreateEntity = () => {
    const prefix = queries.prefix.getAll(document)[0];
    const name = queries.entity.generateName(document)(prefix);
    setDocument(mutations.entity.create(document)(prefix, name));
    setSelectedNodeID(`${prefix}:${name}`);
  };

  const buttonClasses = { root: classes.buttonRoot, label: classes.buttonLabel };

  return (
    <Box px={1} display="flex" alignItems="center" className={classes.wrapper}>
      <Button className={classes.agentButton} classes={buttonClasses} onClick={handleCreateAgent} variant="contained" endIcon={<AddIcon />}>Agent</Button>
      <Button className={classes.activityButton} classes={buttonClasses} onClick={handleCreateActivity} variant="contained" endIcon={<AddIcon />}>Activity</Button>
      <Button className={classes.entityButton} classes={buttonClasses} onClick={handleCreateEntity} variant="contained" endIcon={<AddIcon />}>Entity</Button>
    </Box>
  );
};

export default MenuBar;