import React, {
  Dispatch,
  SetStateAction,
  useContext, useEffect, useRef, useState,
} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Collapse from '@material-ui/core/Collapse';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import DragHandleIcon from '@material-ui/icons/DragHandle';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { Fade, useTheme } from '@material-ui/core';
import NamespaceTab from './EditorTabs/NamespaceTab';
import DocumentContext from './contexts/DocumentContext';
import queries from '../util/queries';
import NodeTab from './EditorTabs/NodeTab';
import SettingsTab from './EditorTabs/SettingsTab';

export const TABS_HEIGHT = 48;

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
  displaySettings: boolean;
  setDisplaySettings: (updated: boolean) => void;
  contentHeight: number;
  setContentHeight: Dispatch<SetStateAction<number>>;
  selectedNodeID: string | undefined;
  setSelectedNodeID: (id: string | undefined) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Editor: React.FC<EditorProps> = ({
  displaySettings,
  setDisplaySettings,
  contentHeight,
  setContentHeight,
  selectedNodeID,
  setSelectedNodeID,
  open,
  setOpen,
}) => {
  const { document } = useContext(DocumentContext);
  const classes = useStyles();
  const theme = useTheme();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [currentTabIndex, setCurrentTabIndex] = useState<number>(0);
  const [tabs, setTabs] = useState<TapType[]>(defaultTabs);

  const [dragging, setDragging] = useState<boolean>(false);

  const handleMouseUp = () => {
    if (dragging) {
      setDragging(false);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (dragging && wrapperRef.current) {
      const { clientY } = e;
      const { top } = wrapperRef.current.getBoundingClientRect();

      setContentHeight((prev) => prev + (top - clientY + TABS_HEIGHT / 2));
    }
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [dragging]);

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

  useEffect(() => {
    const existingSettingsTabIndex = tabs.findIndex(({ variant, name }) => variant === 'default' && name === 'Settings');
    if (displaySettings) {
      if (existingSettingsTabIndex < 0) {
        setTabs((prev) => [
          ...prev.slice(0, 1),
          { name: 'Settings', variant: 'default' },
          ...prev.slice(1),
        ]);
        setCurrentTabIndex(1);
      } else {
        setCurrentTabIndex(existingSettingsTabIndex);
      }
    }
  }, [displaySettings]);

  const handleCloseTab = (
    variant: string, name: string,
  ) => (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e.stopPropagation();
    const tabIndex = tabs.findIndex((t) => t.name === name);
    if (variant === 'default' && name === 'Settings') setDisplaySettings(false);
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

  const handleDragHandleMouseDown = () => {
    setDragging(true);
  };

  const currentTabVariant = tabs[currentTabIndex].variant;
  const currentTabName = tabs[currentTabIndex].name;

  return (
    <div ref={wrapperRef} className={classes.wrapper}>
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
              label={(variant === 'default' && name === 'Namespace')
                ? name
                : (
                  <Box display="flex" alignItems="center">
                    <Typography className={classes.tabLabel}>{name}</Typography>
                    <Box display="flex" alignItems="center" onClick={handleCloseTab(variant, name)} ml={1}><CloseIcon /></Box>
                  </Box>
                )}
            />
          ))}
        </Tabs>
        <Fade in={open}>
          <IconButton
            onMouseDown={handleDragHandleMouseDown}
            disableFocusRipple
            disableRipple
          >
            <DragHandleIcon />
          </IconButton>
        </Fade>
        <IconButton
          onClick={() => setOpen(!open)}
          className={classes.displayEditorIconButton}
        >
          <ExpandLessIcon style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </IconButton>
      </Box>
      <Collapse in={open}>
        <Box
          style={{ height: contentHeight - theme.spacing(4) - 2 }}
          className={classes.content}
          py={2}
          px={4}
        >
          {currentTabVariant === 'default'
            ? (
              <>
                {currentTabName === 'Namespace' && <NamespaceTab />}
                {currentTabName === 'Settings' && <SettingsTab />}
              </>
            ) : (
              <NodeTab
                key={currentTabIndex}
                variant={currentTabVariant}
                id={tabs[currentTabIndex].name}
                onIDChange={handleTabIDChange(currentTabIndex)}
              />
            )}
        </Box>
      </Collapse>
    </div>
  );
};

export default Editor;
