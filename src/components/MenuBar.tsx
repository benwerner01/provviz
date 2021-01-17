import React, { useContext } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import AddIcon from '@material-ui/icons/Add';
import IconButton from '@material-ui/core/IconButton';
import AccountTreeIcon from '@material-ui/icons/AccountTree';
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

export type View = 'Graph' | 'Tree'

type MenuBarProps = {
  setSelectedNodeID: (id: string) => void;
  currentView: View;
  setCurrentView: (newCurrentView: View) => void;
}

const MenuBar: React.FC<MenuBarProps> = ({
  setSelectedNodeID, currentView, setCurrentView
}) => {
  const classes = useStyles();
  const { document, setDocument } = useContext(DocumentContext);

  const handleCreateAgent = () => {
    const prefix = queries.prefix.getAll(document)[0];
    const name = queries.agent.generateName(document)(prefix);
    setDocument((prev) => mutations.agent.create(prev)(prefix, name));
    setSelectedNodeID(`${prefix}:${name}`);
  };

  const handleCreateActivity = () => {
    const prefix = queries.prefix.getAll(document)[0];
    const name = queries.activity.generateName(document)(prefix);
    setDocument((prev) => mutations.activity.create(prev)(prefix, name));
    setSelectedNodeID(`${prefix}:${name}`);
  };

  const handleCreateEntity = () => {
    const prefix = queries.prefix.getAll(document)[0];
    const name = queries.entity.generateName(document)(prefix);
    setDocument((prev) => mutations.entity.create(prev)(prefix, name));
    setSelectedNodeID(`${prefix}:${name}`);
  };

  const handleCreateBundle = () => {
    const prefix = queries.prefix.getAll(document)[0];
    const name = queries.bundle.generateName(document)(prefix);
    setDocument((prev) => mutations.bundle.create(prev)(prefix, name));
  };

  const buttonClasses = { root: classes.buttonRoot, label: classes.buttonLabel };

  return (
    <Box px={1} display="flex" alignItems="center" justifyContent="space-between" className={classes.wrapper}>
      <Box>
        <Button className={classes.agentButton} classes={buttonClasses} onClick={handleCreateAgent} variant="contained" endIcon={<AddIcon />}>Agent</Button>
        <Button className={classes.activityButton} classes={buttonClasses} onClick={handleCreateActivity} variant="contained" endIcon={<AddIcon />}>Activity</Button>
        <Button className={classes.entityButton} classes={buttonClasses} onClick={handleCreateEntity} variant="contained" endIcon={<AddIcon />}>Entity</Button>
        <Button classes={buttonClasses} onClick={handleCreateBundle} variant="contained" endIcon={<AddIcon />}>Bundle</Button>
      </Box>
      <Box>
        <IconButton onClick={() => setCurrentView(currentView === 'Graph' ? 'Tree' : 'Graph')}><AccountTreeIcon /></IconButton>
      </Box>
    </Box>
  );
};

export default MenuBar;
