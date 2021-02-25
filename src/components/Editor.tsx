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
import Tooltip from '@material-ui/core/Tooltip';
import { Fade, useTheme } from '@material-ui/core';
import DocumentContext from './contexts/DocumentContext';
import queries from '../util/queries';
import NodeTab from './EditorTabs/NodeTab';
import SettingsTab from './EditorTabs/SettingsTab';
import { Variant } from '../util/document';
import BundleTab from './EditorTabs/BundleTab';

export const TABS_HEIGHT = 48 + 1;

type TapType = {
  name: string;
  variant: 'default' | Variant;
}

const defaultTabs: TapType[] = [];

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
    transition: theme.transitions.create('bottom'),
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
  display: boolean;
  setDisplay: (display: boolean) => void;
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
  display,
  setDisplay,
}) => {
  const { document } = useContext(DocumentContext);
  const classes = useStyles();
  const theme = useTheme();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [currentTabIndex, setCurrentTabIndex] = useState<number>(-1);
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
    window.addEventListener('pointerup', handleMouseUp);
    window.addEventListener('pointermove', handleMouseMove);
    return () => {
      window.removeEventListener('pointerup', handleMouseUp);
      window.removeEventListener('pointermove', handleMouseMove);
    };
  }, [dragging]);

  useEffect(() => {
    if (tabs.length === 0) setDisplay(false);
    else setDisplay(true);
  }, [tabs]);

  useEffect(() => {
    if (selectedNodeID) {
      const existingTabIndex = tabs.findIndex(({ name }) => name === selectedNodeID);

      if (existingTabIndex < 0) {
        const variant: Variant | undefined = queries.document.hasEntity(selectedNodeID)(document)
          ? 'entity'
          : queries.document.hasActivity(selectedNodeID)(document)
            ? 'activity'
            : queries.document.hasAgent(selectedNodeID)(document)
              ? 'agent'
              : queries.document.hasBundle(selectedNodeID)(document)
                ? 'bundle' : undefined;

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
        setTabs((prev) => [{ name: 'Settings', variant: 'default' }, ...prev]);
        setCurrentTabIndex(0);
      } else {
        setCurrentTabIndex(existingSettingsTabIndex);
      }
    }
  }, [displaySettings]);

  const handleCloseTab = (
    variant: string, name: string,
  ) => (e?: React.MouseEvent<HTMLElement, MouseEvent>) => {
    if (e) e.stopPropagation();
    const tabIndex = tabs.findIndex((t) => t.name === name);
    if (variant === 'default' && name === 'Settings') setDisplaySettings(false);
    if (tabIndex >= 0) {
      const updatedTabs = [...tabs.slice(0, tabIndex), ...tabs.slice(tabIndex + 1, tabs.length)];
      setTabs(updatedTabs);
      if (
        currentTabIndex >= tabIndex
        && currentTabIndex !== 0) {
        setCurrentTabIndex(currentTabIndex - 1);
      }
      if (updatedTabs.length === 0) {
        setCurrentTabIndex(-1);
        setOpen(false);
      }
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

  const currentTabVariant = currentTabIndex < 0 ? undefined : tabs[currentTabIndex].variant;
  const currentTabName = currentTabIndex < 0 ? undefined : tabs[currentTabIndex].name;

  return (
    <div
      style={{
        bottom: display ? 0 : -1 * TABS_HEIGHT,
      }}
      ref={wrapperRef}
      className={classes.wrapper}
    >
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
          <Tooltip
            arrow
            title="Drag Editor Height"
            aria-label="drag-editor-height"
            placement="top"
          >
            <IconButton
              onPointerDown={() => setDragging(true)}
              disableFocusRipple
              disableRipple
            >
              <DragHandleIcon />
            </IconButton>
          </Tooltip>
        </Fade>
        <Tooltip
          arrow
          title={`${open ? 'Close' : 'Open'} Editor`}
          aria-label={`${open ? 'close' : 'open'}-editor`}
          placement="top"
        >
          <IconButton
            onClick={() => tabs.length > 0 && setOpen(!open)}
            className={classes.displayEditorIconButton}
          >
            <ExpandLessIcon style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </IconButton>
        </Tooltip>
      </Box>
      <Collapse in={open}>
        <Box
          style={{ height: contentHeight - theme.spacing(4) - 2 }}
          className={classes.content}
          py={2}
          px={4}
        >
          {(currentTabName && currentTabVariant) && (currentTabVariant === 'default'
            ? (
              <>
                {currentTabName === 'Settings' && <SettingsTab />}
              </>
            ) : currentTabVariant === 'bundle' ? (
              <BundleTab
                key={currentTabIndex}
                id={tabs[currentTabIndex].name}
                onIDChange={handleTabIDChange(currentTabIndex)}
                onDelete={handleCloseTab(currentTabVariant, currentTabName)}
              />
            ) : (
              <NodeTab
                key={currentTabIndex}
                variant={currentTabVariant}
                id={tabs[currentTabIndex].name}
                onIDChange={handleTabIDChange(currentTabIndex)}
                onDelete={handleCloseTab(currentTabVariant, currentTabName)}
              />
            ))}
        </Box>
      </Collapse>
    </div>
  );
};

export default Editor;
