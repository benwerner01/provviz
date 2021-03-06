import React, {
  Dispatch, SetStateAction, useEffect, useRef, useState,
  useContext,
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
import NodeInspector from './NodeInspector';
import SettingsInspector from './SettingsInspector';
import RelationInspector from './RelationInspector';
import BundleInspector from './BundleInspector';
import { PROVJSONDocument, tbdIsNodeVariant, Variant } from '../../lib/definition/document';
import { Selection } from '../Visualiser';
import DocumentContext from '../context/DocumentContext';
import queries from '../../lib/queries';

export const TABS_HEIGHT = 48 + 1;

type TapType = {
  id: string;
  variant: Variant;
  openSections: string[];
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

export type InspectorProps = {
  displaySettings: boolean;
  setDisplaySettings: (updated: boolean) => void;
  contentHeight: number;
  setContentHeight: Dispatch<SetStateAction<number>>;
  selected: Selection | undefined;
  setSelected: (selected: Selection | undefined) => void;
  display: boolean;
  setDisplay: (display: boolean) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const possiblyUpdateNodeInspectorTabIDs = (
  prevDocument: PROVJSONDocument,
  document: PROVJSONDocument,
  tabs: TapType[],
): false | TapType[] => {
  let hasChanged = false;

  const updatedTabs = tabs.map((tab) => {
    const { variant } = tab;

    if (
      tbdIsNodeVariant(variant)
      && !queries.document.hasNode(tab.id)(document)
      && queries.document.hasNode(tab.id)(prevDocument)
    ) {
      hasChanged = true;

      const updatedID = queries.document.getUpdatedNodeID(prevDocument, document);

      return updatedID
        ? { ...tab, id: updatedID }
        : [];
    }

    return tab;
  }).flat();

  return hasChanged ? updatedTabs : false;
};

const Inspector: React.FC<InspectorProps> = ({
  displaySettings,
  setDisplaySettings,
  contentHeight,
  setContentHeight,
  selected,
  setSelected,
  open,
  setOpen,
  display,
  setDisplay,
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { document } = useContext(DocumentContext);

  const prevDocumentRef = useRef<PROVJSONDocument>(document);

  const [currentTabIndex, setCurrentTabIndex] = useState<number>(-1);
  const [tabs, setTabs] = useState<TapType[]>(defaultTabs);

  useEffect(() => {
    const updatedTabs = possiblyUpdateNodeInspectorTabIDs(
      prevDocumentRef.current,
      document,
      tabs,
    );

    if (updatedTabs) setTabs(updatedTabs);

    prevDocumentRef.current = document;
  }, [document]);

  const [dragging, setDragging] = useState<boolean>(false);

  const handleMouseUp = () => {
    if (dragging) setDragging(false);
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
    if (tabs.length === 0 && !displaySettings) setDisplay(false);
    else setDisplay(true);
  }, [tabs, displaySettings]);

  useEffect(() => {
    if (selected) {
      const existingTabIndex = tabs.findIndex(({ id, variant }) => (
        variant === selected.variant
        && id === selected.id));

      if (existingTabIndex < 0) {
        const updatedTabs = [...tabs, { ...selected, openSections: [] }];
        setTabs(updatedTabs);
        setCurrentTabIndex(updatedTabs.length - 1 + (displaySettings ? 1 : 0));
      } else {
        setCurrentTabIndex(existingTabIndex + (displaySettings ? 1 : 0));
      }
    }
  }, [selected]);

  useEffect(() => {
    if (displaySettings) setCurrentTabIndex(0);
  }, [displaySettings]);

  const handleCloseTab = (
    id: string,
  ) => (e?: React.MouseEvent<HTMLElement, MouseEvent>) => {
    if (e) e.stopPropagation();
    const tabIndex = tabs.findIndex((t) => t.id === id);
    if (tabIndex >= 0) {
      const updatedTabs = [...tabs.slice(0, tabIndex), ...tabs.slice(tabIndex + 1, tabs.length)];
      setTabs(updatedTabs);
      if (
        currentTabIndex !== 0
        && currentTabIndex >= tabIndex + (displaySettings ? 1 : 0)
      ) {
        const updatedIndex = currentTabIndex - 1;
        setCurrentTabIndex(updatedIndex);
        setSelected(displaySettings
          ? updatedIndex >= 1
            ? updatedTabs[updatedIndex - 1]
            : undefined
          : updatedIndex >= 0
            ? updatedTabs[updatedIndex]
            : undefined);
      }
      if (!displaySettings && updatedTabs.length === 0) {
        setCurrentTabIndex(-1);
        setOpen(false);
        setSelected(undefined);
      }
    }
  };

  const handleTabIDChange = (tabIndex: number) => (updatedID: string) => {
    const prevID = tabs[tabIndex].id;
    const { variant } = tabs[tabIndex];
    setTabs((prevTabs) => [
      ...prevTabs.slice(0, tabIndex),
      { ...prevTabs[tabIndex], id: updatedID },
      ...prevTabs.slice(tabIndex + 1, prevTabs.length),
    ]);

    if (selected && selected.variant === variant && selected.id === prevID) {
      setSelected({ variant, id: updatedID });
    }
  };

  const handleTabOpenSectionsChange = (tabIndex: number) => (openSections: string[]) => {
    setTabs((prevTabs) => [
      ...prevTabs.slice(0, tabIndex),
      { ...prevTabs[tabIndex], openSections },
      ...prevTabs.slice(tabIndex + 1),
    ]);
  };

  const adjustedTabIndex = currentTabIndex - (displaySettings ? 1 : 0);

  const currentTab = (
    adjustedTabIndex < 0
    || (displaySettings && currentTabIndex === 0))
    ? undefined
    : tabs[adjustedTabIndex];

  const currentTabVariant = currentTab?.variant;
  const currentTabID = currentTab?.id;

  return (
    <div
      style={{ bottom: display ? 0 : -1 * TABS_HEIGHT }}
      ref={wrapperRef}
      className={classes.wrapper}
    >
      <Box className={classes.headerWrapper} display="flex" justifyContent="space-between">
        <Tabs
          value={currentTabIndex < 0 ? 0 : currentTabIndex}
          indicatorColor="primary"
          onChange={(_, newTab) => setCurrentTabIndex(newTab)}
          classes={{ root: classes.tabsRoot, indicator: classes.tabIndicator }}
          variant="scrollable"
          scrollButtons="auto"
        >
          {displaySettings && (
            <Tab
              classes={{ root: classes.tabRoot }}
              onClick={() => {
                setCurrentTabIndex(0);
                setSelected(undefined);
                setOpen(true);
              }}
              label={(
                <Box display="flex" alignItems="center">
                  <Typography className={classes.tabLabel}>Settings</Typography>
                  <Box
                    display="flex"
                    alignItems="center"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (tabs.length === 0) {
                        setOpen(false);
                        setCurrentTabIndex(-1);
                      }
                      setDisplaySettings(false);
                    }}
                    ml={1}
                  >
                    <CloseIcon />
                  </Box>
                </Box>
            )}
            />
          )}
          {tabs.map(({ id, variant }) => (
            <Tab
              classes={{ root: classes.tabRoot }}
              onClick={() => {
                setSelected({ variant, id });
                setOpen(true);
              }}
              key={`${id}-${variant}`}
              label={(
                <Box display="flex" alignItems="center">
                  <Typography className={classes.tabLabel}>{id}</Typography>
                  <Box display="flex" alignItems="center" onClick={handleCloseTab(id)} ml={1}><CloseIcon /></Box>
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
            onClick={() => (tabs.length > 0 || displaySettings) && setOpen(!open)}
            className={classes.displayEditorIconButton}
          >
            <ExpandLessIcon titleAccess={open ? 'Close' : 'Open'} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
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
          {(displaySettings && currentTabIndex === 0)
            ? <SettingsInspector />
            : (
              currentTabVariant
              && currentTabID
              && (currentTabVariant === 'bundle' ? (
                <BundleInspector
                  key={currentTabIndex}
                  id={currentTabID}
                  setSelected={setSelected}
                  onIDChange={handleTabIDChange(currentTabIndex - (displaySettings ? 1 : 0))}
                  onDelete={handleCloseTab(currentTabID)}
                  openSections={tabs[currentTabIndex - (displaySettings ? 1 : 0)].openSections}
                  setOpenSections={
                    handleTabOpenSectionsChange(currentTabIndex - (displaySettings ? 1 : 0))
                  }
                />
              ) : tbdIsNodeVariant(currentTabVariant) ? (
                <NodeInspector
                  key={currentTabIndex}
                  variant={currentTabVariant}
                  id={currentTabID}
                  onIDChange={handleTabIDChange(currentTabIndex - (displaySettings ? 1 : 0))}
                  onDelete={handleCloseTab(currentTabID)}
                  openSections={tabs[currentTabIndex - (displaySettings ? 1 : 0)].openSections}
                  setOpenSections={
                    handleTabOpenSectionsChange(currentTabIndex - (displaySettings ? 1 : 0))
                  }
                  setSelected={setSelected}
                />
              ) : (
                <RelationInspector
                  key={currentTabIndex}
                  variant={currentTabVariant}
                  id={currentTabID}
                  onDelete={handleCloseTab(currentTabID)}
                  openSections={tabs[currentTabIndex - (displaySettings ? 1 : 0)].openSections}
                  setOpenSections={
                    handleTabOpenSectionsChange(currentTabIndex - (displaySettings ? 1 : 0))
                  }
                />
              )))}
        </Box>
      </Collapse>
    </div>
  );
};

export default Inspector;
