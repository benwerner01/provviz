import React, { useContext, useEffect, useState } from 'react';
import SortableTree, { TreeItem } from 'react-sortable-tree';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import 'react-sortable-tree/style.css';
import DocumentContext from './contexts/DocumentContext';
import { PROVJSONBundle, tbdIsNodeVariant } from '../util/document';
import { palette } from '../util/dot';
import queries from '../util/queries';
import mutations from '../util/mutations';

type TreeViewProps = {
  width: number;
  height: number;
}

const useStyles = makeStyles((theme) => ({
  node: {
    '& .rst__rowContents': {
      '&:hover': {
        cursor: 'pointer',
      },
    },
  },
  activity: {
    '& .rst__rowContents': {
      backgroundColor: palette.activity.light,
    },
  },
  agent: {
    '& .rst__rowContents': {
      backgroundColor: palette.agent.light,
    },
  },
  entity: {
    '& .rst__rowContents': {
      backgroundColor: palette.entity.light,
    },
  },
  bundle: {
    '& .rst__rowContents': {
      backgroundColor: palette.bundle.light,
    },
  },
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

const TreeView: React.FC<TreeViewProps> = ({ width, height }) => {
  const { document, setDocument } = useContext(DocumentContext);
  const classes = useStyles();

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
    <Box width={width} height={height}>
      <SortableTree
        treeData={treeData}
        onChange={handleChange}
        canNodeHaveChildren={({ variant }) => variant === 'bundle'}
        generateNodeProps={({ node }) => ({
          className: [
            classes.node,
            tbdIsNodeVariant(node.variant) ? classes[node.variant] : [],
          ].flat().join(' '),
        })}
      />
    </Box>
  );
};

export default TreeView;
