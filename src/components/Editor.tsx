import React, { useContext, useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Collapse from '@material-ui/core/Collapse';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import NamespaceTab from './EditorTabs/NamespaceTab';
import DocumentContext from './contexts/DocumentContext';
import { bundleHasActivity, bundleHasAgent, bundleHasEntity } from '../util/document';

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
  tabRoot: {
    minWidth: 'unset',
    textTransform: 'none',
  },
  tabIndicator: {
    height: 3,
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
        const variant: 'entity' | 'activity' | 'agent' | undefined = bundleHasEntity(document)(selectedNodeID)
          ? 'entity'
          : bundleHasActivity(document)(selectedNodeID)
            ? 'activity'
            : bundleHasAgent(document)(selectedNodeID)
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
      if (currentTabIndex === tabIndex) {
        setCurrentTabIndex(tabIndex - 1);
        setSelectedNodeID(undefined);
      }
    }
  };

  return (
    <Box className={classes.wrapper}>
      <Box className={classes.headerWrapper} display="flex" justifyContent="space-between">
        <Tabs
          value={currentTabIndex}
          indicatorColor="primary"
          onChange={(_, newTab) => setCurrentTabIndex(newTab)}
          classes={{ indicator: classes.tabIndicator }}
        >
          {tabs.map(({ name, variant }) => (
            <Tab
              classes={{ root: classes.tabRoot }}
              onClick={() => setOpen(true)}
              key={name}
              label={variant === 'default'
                ? name
                : (
                  <Box display="flex" alignItems="center">
                    {name}
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
          {tabs[currentTabIndex].name === 'Namespace' && <NamespaceTab />}
        </Box>
      </Collapse>
    </Box>
  );
};

export default Editor;
