import React, { useContext } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Divider from '@material-ui/core/Divider';
import Button from '@material-ui/core/Button';
import WarningIcon from '@material-ui/icons/Warning';
import { Link } from '@material-ui/core';
import DocumentContext from '../contexts/DocumentContext';
import EditableIdentifier from '../EditableIdentifier';
import queries from '../../util/queries';
import mutations from '../../util/mutations';
import Section from './Section';
import { palette } from '../../util/theme';
import { Selection } from '../Visualiser';
import { NodeVariant } from '../../util/document';

const useStyles = makeStyles((theme) => ({
  deleteButton: {
    marginRight: theme.spacing(1),
    backgroundColor: palette.danger.main,
    color: theme.palette.common.white,
    '&:hover': {
      backgroundColor: palette.danger.dark,
    },
  },
  link: {
    '&:hover': {
      cursor: 'pointer',
    },
  },
  warningIcon: {
    color: palette.danger.main,
  },
  warningTypography: {
    color: palette.danger.main,
  },
}));

type BundleTabProps = {
  id: string;
  setSelected: (selected: Selection | undefined) => void;
  onIDChange?: (id: string) => void;
  onDelete?: () => void;
}

const BundleTab: React.FC<BundleTabProps> = ({
  id, setSelected, onIDChange, onDelete,
}) => {
  const classes = useStyles();
  const { document, setDocument } = useContext(DocumentContext);

  const fullName = queries.node.getFullName(id)(document);

  const handleDelete = () => {
    setDocument(mutations.bundle.delete(id));
    if (onDelete) onDelete();
  };

  const agents = queries.bundle.getNodes(id, 'agent')(document);
  const entities = queries.bundle.getNodes(id, 'entity')(document);
  const activities = queries.bundle.getNodes(id, 'activity')(document);
  const nodes = [...(agents || []), ...(entities || []), ...(activities || [])];

  const mapNodeIDToLink = (variant: NodeVariant) => (nodeID: string) => (
    <Typography>
      <Link
        className={classes.link}
        onClick={() => setSelected({ variant, id: nodeID })}
      >
        {nodeID}
      </Link>
    </Typography>
  );

  const collapsableSections = [
    {
      name: 'Definition',
      initiallyOpen: false,
      content: <EditableIdentifier initialID={id} onChange={onIDChange} />,
    },
    (agents && agents.length > 0)
      ? {
        name: 'Agents',
        initiallyOpen: false,
        content: (
          <Box>
            {agents.map(mapNodeIDToLink('agent'))}
          </Box>
        ),
      } : [],
    (entities && entities.length > 0)
      ? {
        name: 'Entities',
        initiallyOpen: false,
        content: (
          <Box>
            {entities.map(mapNodeIDToLink('entity'))}
          </Box>
        ),
      } : [],
    (activities && activities.length > 0)
      ? {
        name: 'Acvtivities',
        initiallyOpen: false,
        content: (
          <Box>
            {activities.map(mapNodeIDToLink('activity'))}
          </Box>
        ),
      } : [],
  ].flat();

  return (
    <>
      <Box display="flex" mb={1}>
        <Typography variant="h5">
          <strong>Bundle: </strong>
          {fullName}
        </Typography>
      </Box>
      <Divider />
      {collapsableSections.map(({ initiallyOpen, name, content }) => (
        <Section
          key={name}
          initiallyOpen={initiallyOpen}
          name={name}
        >
          {content}
        </Section>
      ))}
      <Box display="flex" flexWrap="wrap" alignItems="center" mt={2}>
        <Button onClick={handleDelete} className={classes.deleteButton} variant="contained">Delete</Button>
        {nodes.length > 0 && (
          <Box my={1} display="flex" flexWrap="wrap" alignItems="center">
            <Box display="flex" alignItems="center" mr={1}>
              <WarningIcon className={classes.warningIcon} />
              <Typography className={classes.warningTypography}>
                <strong>Warning:</strong>
              </Typography>
            </Box>
            <Typography>
              {'deleting this Bundle will also '}
              <strong>{`delete ${nodes.length} agents, activities or entities`}</strong>
            </Typography>
          </Box>
        )}
      </Box>
    </>
  );
};

export default BundleTab;
