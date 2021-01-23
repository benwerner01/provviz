import React, { useContext } from 'react';
import Color from 'color';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import AddIcon from '@material-ui/icons/Add';
import IconButton from '@material-ui/core/IconButton';
import AccountTreeIcon from '@material-ui/icons/AccountTree';
import SettingsIcon from '@material-ui/icons/Settings';
import queries from '../util/queries';
import mutations from '../util/mutations';
import DocumentContext from './contexts/DocumentContext';
import VisualisationContext from './contexts/VisualisationContext';

export const MENU_BAR_HEIGHT = 48;

type MenuBarStyleProps = {
  agentColor: string;
  activityColor: string;
  entityColor: string;
  bundleColor: string;
}

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
  agentButton: ({ agentColor }: MenuBarStyleProps) => ({
    backgroundColor: agentColor,
    '&:hover': {
      backgroundColor: Color(agentColor).lighten(0.1).hex(),
    },
  }),
  activityButton: ({ activityColor }: MenuBarStyleProps) => ({
    backgroundColor: activityColor,
    '&:hover': {
      backgroundColor: Color(activityColor).lighten(0.1).hex(),
    },
  }),
  entityButton: ({ entityColor }: MenuBarStyleProps) => ({
    backgroundColor: entityColor,
    '&:hover': {
      backgroundColor: Color(entityColor).lighten(0.1).hex(),
    },
  }),
  bundleButton: ({ bundleColor }: MenuBarStyleProps) => ({
    backgroundColor: bundleColor,
    '&:hover': {
      backgroundColor: Color(bundleColor).lighten(0.1).hex(),
    },
  }),
}));

export type View = 'Graph' | 'Tree'

type MenuBarProps = {
  displaySettings: () => void;
  setSelectedNodeID: (id: string) => void;
  currentView: View;
  setCurrentView: (newCurrentView: View) => void;
}

const MenuBar: React.FC<MenuBarProps> = ({
  displaySettings, setSelectedNodeID, currentView, setCurrentView,
}) => {
  const { document, setDocument } = useContext(DocumentContext);
  const { visualisationSettings } = useContext(VisualisationContext);

  const {
    agent, activity, entity, bundle,
  } = visualisationSettings.palette;
  const classes = useStyles({
    agentColor: agent, activityColor: activity, entityColor: entity, bundleColor: bundle,
  });

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
        <Button className={classes.bundleButton} classes={buttonClasses} onClick={handleCreateBundle} variant="contained" endIcon={<AddIcon />}>Bundle</Button>
      </Box>
      <Box>
        <IconButton onClick={() => setCurrentView(currentView === 'Graph' ? 'Tree' : 'Graph')}>
          <AccountTreeIcon />
        </IconButton>
        <IconButton onClick={displaySettings}>
          <SettingsIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default MenuBar;
