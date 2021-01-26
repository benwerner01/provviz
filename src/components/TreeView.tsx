import React, { useContext, useEffect, useState } from 'react';
import SortableTree, { TreeItem } from 'react-sortable-tree';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import 'react-sortable-tree/style.css';
import Color from 'color';
import DocumentContext from './contexts/DocumentContext';
import { PROVJSONBundle, tbdIsNodeVariant } from '../util/document';
import queries from '../util/queries';
import mutations from '../util/mutations';
import VisualisationContext from './contexts/VisualisationContext';

type TreeViewProps = {
  width: number;
  height: number;
  selectedNodeID: string | undefined;
  setSelectedNodeID: (id: string | undefined) => void;
}

type TreeViewSylesProps = {
  agentColor: string;
  activityColor: string;
  entityColor: string;
  bundleColor: string;
}

const useStyles = makeStyles((theme) => ({
  node: {
    '& .rst__rowContents': {
      '&:hover': {
        cursor: 'pointer',
      },
    },
  },
  selectedNode: {
    '& .rst__moveHandle': {
      backgroundColor: 'red',
    },
  },
  activity: ({ activityColor }: TreeViewSylesProps) => ({
    '& .rst__rowContents': {
      backgroundColor: Color(activityColor).lighten(0.1).hex(),
      color: Color(activityColor).isLight()
        ? theme.palette.common.black
        : theme.palette.common.white,
    },
  }),
  agent: ({ agentColor }: TreeViewSylesProps) => ({
    '& .rst__rowContents': {
      backgroundColor: Color(agentColor).lighten(0.1).hex(),
      color: Color(agentColor).isLight() ? theme.palette.common.black : theme.palette.common.white,
    },
  }),
  entity: ({ entityColor }: TreeViewSylesProps) => ({
    '& .rst__rowContents': {
      backgroundColor: Color(entityColor).lighten(0.1).hex(),
      color: Color(entityColor).isLight() ? theme.palette.common.black : theme.palette.common.white,
    },
  }),
  bundle: ({ bundleColor }: TreeViewSylesProps) => ({
    '& .rst__rowContents': {
      backgroundColor: Color(bundleColor).lighten(0.1).hex(),
      color: Color(bundleColor).isLight() ? theme.palette.common.black : theme.palette.common.white,
    },
  }),
}));

// Whether or not a bundle is expanded in the Tree Data
const isBundleExpanded = (treeData: TreeItem[], bundleID: string) => {
  const bundles = treeData.filter(({ variant }) => variant === 'bundle');

  if (bundles.find(({ key }) => key === bundleID)?.expanded) return true;

  const allChildren = bundles.map(({ children }) => children || []).flat();

  if (allChildren.length > 0 && isBundleExpanded(allChildren, bundleID)) return true;

  return false;
};

const mapBundleToTreeData = ({
  activity, agent, entity, bundle,
}: PROVJSONBundle, prevTreeData?: TreeItem[]): TreeItem[] => [
  ...(activity ? Object.keys(activity).map((key) => ({
    title: <Typography variant="body1">{key}</Typography>,
    variant: 'activity',
    key,
  })) : []),
  ...(agent ? Object.keys(agent).map((key) => ({
    title: <Typography variant="body1">{key}</Typography>,
    variant: 'agent',
    key,
  })) : []),
  ...(entity ? Object.keys(entity).map((key) => ({
    title: <Typography variant="body1">{key}</Typography>,
    variant: 'entity',
    key,
  })) : []),
  ...(bundle ? Object.keys(bundle).map((key) => ({
    title: <Typography variant="body1">{key}</Typography>,
    variant: 'bundle',
    expanded: prevTreeData ? isBundleExpanded(prevTreeData, key) : false,
    children: mapBundleToTreeData(bundle[key], prevTreeData),
    key,
  })) : []),
].flat();

const getAddedToBundle = (
  bundle: PROVJSONBundle,
  bundleID: string,
  treeData: TreeItem[],
): { bundleID: string, nodeID: string }[] => [
  ...treeData
    .filter(({ key }) => !queries.bundle.hasLocalNode(bundle)(key))
    .map(({ key }) => ({ bundleID, nodeID: key })),
  ...(Object
    .entries(bundle.bundle || {})
    .map(([key, value]) => {
      const treeItem = treeData.find((n) => n.key === key);
      return treeItem?.children && typeof treeItem?.children !== 'function'
        ? getAddedToBundle(value, key, treeItem.children)
        : [];
    })),
].flat();

const getRemovedFromBundle = (
  bundle: PROVJSONBundle,
  bundleID: string,
  treeData: TreeItem[],
): { bundleID: string, nodeID: string }[] => [
  ...(Object
    .keys({
      ...bundle.agent,
      ...bundle.activity,
      ...bundle.entity,
      ...bundle.bundle,
    })
    .filter((key) => treeData.find((n) => n.key === key) === undefined)
    .map((key) => ({ bundleID, nodeID: key }))
  ),
  ...(Object
    .entries(bundle.bundle || {})
    .map(([key, value]) => {
      const treeItem = treeData.find((n) => n.key === key);
      return treeItem?.children && typeof treeItem?.children !== 'function'
        ? getRemovedFromBundle(value, key, treeItem.children)
        : [];
    })),
].flat();

const TreeView: React.FC<TreeViewProps> = ({
  width, height, selectedNodeID, setSelectedNodeID,
}) => {
  const { document, setDocument } = useContext(DocumentContext);
  const { visualisationSettings } = useContext(VisualisationContext);

  const {
    agent, activity, entity, bundle,
  } = visualisationSettings.palette;

  const classes = useStyles({
    agentColor: agent, activityColor: activity, entityColor: entity, bundleColor: bundle,
  });

  const [treeData, setTreeData] = useState<TreeItem[]>(mapBundleToTreeData(document));

  useEffect(() => {
    setTreeData((prevTreeData) => mapBundleToTreeData(document, prevTreeData));
  }, [document]);

  const handleChange = (updatedTreeData: TreeItem[]) => {
    setTreeData(updatedTreeData);

    const addToBundle = getAddedToBundle(document, 'root', updatedTreeData);
    const removeFromBundle = getRemovedFromBundle(document, 'root', updatedTreeData);

    // If an item was added to a bundle and removed...
    if (addToBundle.length > 0 && removeFromBundle.length > 0) {
      // ...we can assume it was moved
      removeFromBundle.forEach((removed) => {
        const oldBundleID = removed.bundleID;
        const newBundleID = addToBundle.find(({ nodeID }) => nodeID === removed.nodeID)!.bundleID;

        const { nodeID } = removed;

        const variant = queries.node.getVariant(document)(nodeID);

        setDocument(mutations.document.moveNode(document)(
          oldBundleID, newBundleID, variant, nodeID,
        ));
      });
    }
  };

  return (
    <Box
      width={width}
      style={{ maxHeight: height, transition: 'max-height 0.3s' }}
      height="100%"
    >
      <SortableTree
        treeData={treeData}
        onChange={handleChange}
        canNodeHaveChildren={({ variant }) => variant === 'bundle'}
        generateNodeProps={({ node }) => ({
          className: [
            classes.node,
            tbdIsNodeVariant(node.variant) ? classes[node.variant] : [],
            selectedNodeID === node.key ? classes.selectedNode : [],
          ].flat().join(' '),
          onClick: () => setSelectedNodeID(node.key),
        })}
      />
    </Box>
  );
};

export default TreeView;