import React, { useContext, useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Collapse from '@material-ui/core/Collapse';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import NamespaceTab from './EditorTabs/NamespaceTab';
import DocumentContext from './contexts/DocumentContext';
import queries from '../util/queries';
import NodeTab from './EditorTabs/NodeTab';

export const EDITOR_CONTENT_HEIGHT = 400;

type TapType = {
  name: string;
  variant: 'default' | 'agent' | 'entity' | 'activity';
}

const defaultTabs: TapType[] = [{ name: 'Namespace', variant: 'default' }];

const useStyles = makeStyles((theme) => ({
  wrapper: {
    position: 'absolute',
    overflow: 'hidden',
    width: '100%',
    bottom: 0,
    borderTopStyle: 'solid',
    borderTopColor: theme.palette.grey[300],
    borderTopWidth: 1,
    backgroundColor: theme.palette.common.white,
  },
  graphvizWrapper: {
    width: '100%',
    height: '100%',
    transition: theme.transitions.create('max-height'),
    overflow: 'hidden',
  },
  content: {
    height: EDITOR_CONTENT_HEIGHT - theme.spacing(4) - 2,
    overflowY: 'auto',
  },
  displayEditorIconButton: {
    '& svg': {
      transition: theme.transitions.create('transform'),
    },
  },
  headerWrapper: {
    backgroundColor: theme.palette.grey[100],
  },
  tabsRoot: {
    flexGrow: 1,
  },
  tabRoot: {
    minWidth: 'unset',
    textTransform: 'none',
  },
  tabLabel: {
    maxWidth: 200,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  tabIndicator: {
    height: 4,
  },
}));

type EditorProps = {
  selectedNodeID: string | undefined;
  setSelectedNodeID: (id: string | undefined) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Editor: React.FC<EditorProps> = ({
  selectedNodeID, setSelectedNodeID, open, setOpen,
}) => {
  const { document } = useContext(DocumentContext);
  const classes = useStyles();

  const [currentTabIndex, setCurrentTabIndex] = useState<number>(0);
  const [tabs, setTabs] = useState<TapType[]>(defaultTabs);

  useEffect(() => {
    if (selectedNodeID) {
      const existingTabIndex = tabs.findIndex(({ name }) => name === selectedNodeID);

      if (existingTabIndex < 0) {
        const variant: 'entity' | 'activity' | 'agent' | undefined = queries.bundle.hasEntity(document)(selectedNodeID)
          ? 'entity'
          : queries.bundle.hasActivity(document)(selectedNodeID)
            ? 'activity'
            : queries.bundle.hasAgent(document)(selectedNodeID)
              ? 'agent'
              : undefined;

        if (!variant) throw new Error(`Could not find variant of selected node with identifier ${selectedNodeID}`);
        const updatedTabs = [...tabs, { name: selectedNodeID, variant }];
        setTabs(updatedTabs);
        setCurrentTabIndex(updatedTabs.length - 1);
      } else {
        setCurrentTabIndex(existingTabIndex);
      }
    }
  }, [selectedNodeID]);

  const handleCloseTab = (name: string) => (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e.stopPropagation();
    const tabIndex = tabs.findIndex((t) => t.name === name);
    if (tabIndex !== -1) {
      setTabs([...tabs.slice(0, tabIndex), ...tabs.slice(tabIndex + 1, tabs.length)]);
      if (currentTabIndex >= tabIndex) setCurrentTabIndex(currentTabIndex - 1);
    }
  };

  const handleTabIDChange = (tabIndex: number) => (updatedID: string) => {
    const prevID = tabs[tabIndex].name;
    const { variant } = tabs[tabIndex];
    setTabs([
      ...tabs.slice(0, tabIndex),
      { name: updatedID, variant },
      ...tabs.slice(tabIndex + 1, tabs.length),
    ]);
    if (selectedNodeID === prevID) setSelectedNodeID(updatedID);
  };

  const currentTabVariant = tabs[currentTabIndex].variant;
  const currentTabName = tabs[currentTabIndex].name;

  return (
    <Box className={classes.wrapper}>
      <Box className={classes.headerWrapper} display="flex" justifyContent="space-between">
        <Tabs
          value={currentTabIndex}
          indicatorColor="primary"
          onChange={(_, newTab) => setCurrentTabIndex(newTab)}
          classes={{ root: classes.tabsRoot, indicator: classes.tabIndicator }}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabs.map(({ name, variant }) => (
            <Tab
              classes={{ root: classes.tabRoot }}
              onClick={() => {
                setSelectedNodeID(name);
                setOpen(true);
              }}
              key={name}
              label={variant === 'default'
                ? name
                : (
                  <Box display="flex" alignItems="center">
                    <Typography className={classes.tabLabel}>{name}</Typography>
                    <Box display="flex" alignItems="center" onClick={handleCloseTab(name)} ml={1}><CloseIcon /></Box>
                  </Box>
                )}
            />
          ))}
        </Tabs>
        <IconButton
          onClick={() => setOpen(!open)}
          className={classes.displayEditorIconButton}
        >
          <ExpandLessIcon style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </IconButton>
      </Box>
      <Collapse in={open}>
        <Box className={classes.content} py={2} px={4}>
          {currentTabVariant === 'default'
            ? (currentTabName === 'Namespace' && <NamespaceTab />)
            : (
              <NodeTab
                key={currentTabIndex}
                variant={currentTabVariant}
                id={tabs[currentTabIndex].name}
                onIDChange={handleTabIDChange(currentTabIndex)}
              />
            )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default Editor;