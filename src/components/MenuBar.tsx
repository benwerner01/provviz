import React, { useContext, useState } from 'react';
import Color from 'color';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Grow from '@material-ui/core/Grow';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import AddIcon from '@material-ui/icons/Add';
import IconButton from '@material-ui/core/IconButton';
import AccountTreeIcon from '@material-ui/icons/AccountTree';
import SettingsIcon from '@material-ui/icons/Settings';
import GetAppIcon from '@material-ui/icons/GetApp';
import Tooltip from '@material-ui/core/Tooltip';
import Fade from '@material-ui/core/Fade';
import queries from '../lib/queries';
import mutations from '../lib/mutations';
import DocumentContext from './context/DocumentContext';
import VisualisationContext from './context/VisualisationContext';
import { NodeVariant, NODE_VARIANTS } from '../lib/definition/document';
import SearchTextField from './TextField/SearchTextField';
import { Selection } from './Visualiser';

export const MENU_BAR_HEIGHT = 48;

type MenuBarStyleProps = {
  agentColor: string;
  activityColor: string;
  entityColor: string;
  bundleColor: string;
}

const BUTTON_GROUP_FIRST_BUTTON_WIDTH = 100;

const useStyles = makeStyles((theme) => ({
  wrapper: {
    height: MENU_BAR_HEIGHT,
    backgroundColor: theme.palette.grey[100],
    borderBottomStyle: 'solid',
    borderBottomColor: theme.palette.grey[300],
    borderBottomWidth: 1,
  },
  buttonGroupRoot: {
    '& > :first-child': {
      width: BUTTON_GROUP_FIRST_BUTTON_WIDTH,
    },
  },
  menuListRoot: {
    width: BUTTON_GROUP_FIRST_BUTTON_WIDTH + 44,
  },
  buttonRoot: {
    '&:not(:first-child)': {
      marginLeft: theme.spacing(1),
    },
  },
  buttonLabel: {
    textTransform: 'none',
  },
  agent: ({ agentColor }: MenuBarStyleProps) => ({
    backgroundColor: agentColor,
    color: Color(agentColor).isLight() ? theme.palette.common.black : theme.palette.common.white,
    borderColor: `${Color(agentColor).isLight() ? theme.palette.common.black : theme.palette.common.white} !important`,
    '&:hover': {
      backgroundColor: Color(agentColor).lighten(0.1).hex(),
    },
  }),
  activity: ({ activityColor }: MenuBarStyleProps) => ({
    backgroundColor: activityColor,
    color: Color(activityColor).isLight() ? theme.palette.common.black : theme.palette.common.white,
    borderColor: `${Color(activityColor).isLight() ? theme.palette.common.black : theme.palette.common.white} !important`,
    '&:hover': {
      backgroundColor: Color(activityColor).lighten(0.1).hex(),
    },
  }),
  entity: ({ entityColor }: MenuBarStyleProps) => ({
    backgroundColor: entityColor,
    color: Color(entityColor).isLight() ? theme.palette.common.black : theme.palette.common.white,
    borderColor: `${Color(entityColor).isLight() ? theme.palette.common.black : theme.palette.common.white} !important`,
    '&:hover': {
      backgroundColor: Color(entityColor).lighten(0.1).hex(),
    },
  }),
  bundle: ({ bundleColor }: MenuBarStyleProps) => ({
    backgroundColor: bundleColor,
    color: Color(bundleColor).isLight() ? theme.palette.common.black : theme.palette.common.white,
    borderColor: `${Color(bundleColor).isLight() ? theme.palette.common.black : theme.palette.common.white} !important`,
    '&:hover': {
      backgroundColor: Color(bundleColor).lighten(0.1).hex(),
    },
  }),
  iconButton: {
    padding: theme.spacing(1),
  },
  collapseIconButtons: {
    transition: theme.transitions.create('max-width'),
    overflow: 'hidden',
  },
}));

export type View = 'Graph' | 'Tree'

export type MenuBarProps = {
  displaySettings: () => void;
  setSelected: (selected: Selection) => void;
  collapseButtons: boolean;
  collapseIconButtons: boolean;
  currentView: View;
  isEmptyDocument: boolean;
  setCurrentView: (newCurrentView: View) => void;
  searching: boolean;
  setSearching: (searching: boolean) => void;
  searchString: string;
  setSearchString: (searchString: string) => void;
  downloadVisualisation: () => void;
}

const MenuBar: React.FC<MenuBarProps> = ({
  displaySettings,
  setSelected,
  currentView,
  isEmptyDocument,
  setCurrentView,
  downloadVisualisation,
  collapseButtons,
  collapseIconButtons,
  searching,
  setSearching,
  searchString,
  setSearchString,
}) => {
  const buttonGroupRef = React.useRef<HTMLDivElement>(null);
  const { document, setDocument } = useContext(DocumentContext);
  const { visualisationSettings } = useContext(VisualisationContext);

  const [buttonGroupOpen, setButtonGroupOpen] = useState<boolean>(false);
  const [currentButtonGroupVariant, setCurrentButtonGroupVariant] = useState<NodeVariant | 'bundle'>('agent');

  const {
    agent, activity, entity, bundle,
  } = visualisationSettings.palette;
  const classes = useStyles({
    agentColor: agent, activityColor: activity, entityColor: entity, bundleColor: bundle,
  });

  const handleCreateNode = (variant: NodeVariant | 'bundle') => {
    const defaultPrefix = queries.namespace.getDefaultPrefix(document);

    const id = variant === 'bundle'
      ? queries.bundle.generateIdentifier(defaultPrefix)(document)
      : queries.node.generateIdentifier(defaultPrefix, variant)(document);

    setDocument(mutations.document.create(variant, id));
    setSelected({ variant, id });
  };

  const buttonClasses = { root: classes.buttonRoot, label: classes.buttonLabel };

  return (
    <Box px={1} display="flex" alignItems="center" justifyContent="space-between" className={classes.wrapper}>
      {collapseButtons ? (
        <>
          <ButtonGroup
            classes={{ root: classes.buttonGroupRoot }}
            variant="contained"
            color="primary"
            ref={buttonGroupRef}
            aria-label="split button"
          >
            <Button
              className={classes[currentButtonGroupVariant]}
              classes={buttonClasses}
              onClick={() => handleCreateNode(currentButtonGroupVariant)}
              endIcon={<AddIcon />}
            >
              {`${currentButtonGroupVariant.charAt(0).toUpperCase()}${currentButtonGroupVariant.slice(1)}`}
            </Button>
            <Button
              size="small"
              className={classes[currentButtonGroupVariant]}
              aria-controls={buttonGroupOpen ? 'split-button-menu' : undefined}
              aria-expanded={buttonGroupOpen ? 'true' : undefined}
              aria-label="select merge strategy"
              aria-haspopup="menu"
              onClick={() => setButtonGroupOpen((prev) => !prev)}
            >
              <ArrowDropDownIcon titleAccess="Dropdown" />
            </Button>
          </ButtonGroup>
          <Popper
            open={buttonGroupOpen}
            anchorEl={buttonGroupRef.current}
            role={undefined}
            placement="bottom-start"
            transition
          >
            {({ TransitionProps, placement }) => (
              <Grow
                {...TransitionProps}
                style={{
                  transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
                }}
              >
                <Paper>
                  <ClickAwayListener onClickAway={() => setButtonGroupOpen(false)}>
                    <MenuList classes={{ root: classes.menuListRoot }}>
                      {([...NODE_VARIANTS, 'bundle'] as (NodeVariant | 'bundle')[])
                        .filter((v) => v !== currentButtonGroupVariant)
                        .map((variant) => (
                          <MenuItem
                            key={variant}
                            onClick={() => {
                              setCurrentButtonGroupVariant(variant);
                              setButtonGroupOpen(false);
                            }}
                          >
                            {`${variant.charAt(0).toUpperCase()}${variant.slice(1)}`}
                          </MenuItem>
                        ))}
                    </MenuList>
                  </ClickAwayListener>
                </Paper>
              </Grow>
            )}
          </Popper>
        </>
      ) : (
        <Box>
          {([...NODE_VARIANTS, 'bundle'] as (NodeVariant | 'bundle')[]).map((variant) => (
            <Button key={variant} className={classes[variant]} classes={buttonClasses} onClick={() => handleCreateNode(variant)} variant="contained" endIcon={<AddIcon />}>
              {`${variant.charAt(0).toUpperCase()}${variant.slice(1)}`}
            </Button>
          ))}
        </Box>
      )}
      <Box display="flex" alignItems="center">
        <Fade in={!isEmptyDocument}>
          <Box>
            <SearchTextField
              open={searching}
              setOpen={setSearching}
              searchString={searchString}
              setSearchString={setSearchString}
            />
          </Box>
        </Fade>
        <Box display="flex" className={classes.collapseIconButtons} style={{ maxWidth: collapseIconButtons ? 0 : 300 }}>
          <Fade in={!isEmptyDocument}>
            <Box>
              <Tooltip
                arrow
                title="Download Visualisation"
                aria-label="download-visualisation"
              >
                <IconButton className={classes.iconButton} onClick={downloadVisualisation}>
                  <GetAppIcon titleAccess="Download" />
                </IconButton>
              </Tooltip>
              <Tooltip
                arrow
                title={currentView === 'Graph' ? 'Tree View' : 'Graph View'}
                aria-label={currentView === 'Graph' ? 'tree-view' : 'graph-view'}
              >
                <IconButton
                  className={classes.iconButton}
                  onClick={() => setCurrentView(currentView === 'Graph' ? 'Tree' : 'Graph')}
                >
                  <AccountTreeIcon titleAccess={currentView === 'Graph' ? 'Tree View' : 'Graph View'} />
                </IconButton>
              </Tooltip>
            </Box>
          </Fade>
          <Tooltip arrow title="Settings" aria-label="settings">
            <IconButton className={classes.iconButton} onClick={displaySettings}>
              <SettingsIcon titleAccess="Settings" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
};

export default MenuBar;
