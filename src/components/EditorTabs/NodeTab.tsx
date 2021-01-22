import React, { useContext, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import { Collapse, Divider, IconButton } from '@material-ui/core';
import DocumentContext from '../contexts/DocumentContext';
import EditableIdentifier from '../EditableIdentifier';
import NodeAutocomplete from '../Autocomplete/NodeAutocomplete';
import queries from '../../util/queries';
import mutations from '../../util/mutations';
import { RelationName, relations } from '../../util/document';

const useStyles = makeStyles((theme) => ({
  collapseHeadingWrapper: {
    position: 'relative',
    left: -1 * theme.spacing(2),
  },
  collapseIconButton: {
    padding: theme.spacing(1),
  },
  collapseTypography: {
    fontWeight: 800,
  },
  collapse: {
    padding: theme.spacing(0, 0, 0, 3),
  },
}));

type NodeTabProps = {
  variant: 'agent' | 'activity' | 'entity';
  id: string;
  onIDChange?: (id: string) => void;
}

const NodeTab: React.FC<NodeTabProps> = ({ variant, id, onIDChange }) => {
  const { document, setDocument } = useContext(DocumentContext);
  const classes = useStyles();

  const [collapseDefinition, setCollapseDefinition] = useState<boolean>(false);
  const [collapseRelationships, setCollapseRelationships] = useState<boolean>(true);

  const relationRangeIncludes = relations
    .filter(({ domain }) => domain === variant)
    .reduce((prev, { name }) => ({
      ...prev,
      [name]: queries.relation.getRangeWithDomain(document)(name, id),
    }), {} as { [key: string]: string[] });

  const handleRelationRangeChange = (relationName: RelationName) => (rangeIDs: string[]) => {
    const rangeIncludes = relationRangeIncludes[relationName];
    const add = rangeIDs.filter((rangeID) => !rangeIncludes.includes(rangeID));
    const remove = rangeIncludes.filter((rangeID) => !rangeIDs.includes(rangeID));

    add.forEach((activityID) => {
      const relationID = queries.relation.generateID(document);
      setDocument((prevDocument) => (
        mutations.relation.create(prevDocument)(relationName, relationID, id, activityID)));
    });
    remove.forEach((activityID) => {
      const relationID = queries.relation.getID(document)(relationName, id, activityID);
      if (!relationID) throw new Error('Could not find relationID');

      setDocument((prevDocument) => ({
        ...prevDocument,
        ...mutations.relation.delete(prevDocument)(relationName, relationID),
      }));
    });
  };

  const fullName = queries.node.getFullName(document)(id);

  return (
    <>
      <Box display="flex" mb={3}>
        <Typography variant="h5">
          <strong>
            {`${variant[0].toUpperCase()}${variant.slice(1)}: `}
          </strong>
          {fullName}
        </Typography>
      </Box>
      <Box display="flex" alignItems="center" className={classes.collapseHeadingWrapper}>
        <IconButton
          className={classes.collapseIconButton}
          onClick={() => setCollapseDefinition(!collapseDefinition)}
        >
          <ArrowDropDownIcon style={{ transform: `rotate(${collapseDefinition ? -90 : 0}deg)` }} />
        </IconButton>
        <Typography className={classes.collapseTypography} variant="h5">Definition</Typography>
      </Box>
      <Collapse className={classes.collapse} in={!collapseDefinition}>
        <EditableIdentifier initialID={id} onChange={onIDChange} />
      </Collapse>
      <Divider />
      <Box display="flex" alignItems="center" className={classes.collapseHeadingWrapper}>
        <IconButton
          className={classes.collapseIconButton}
          onClick={() => setCollapseRelationships(!collapseRelationships)}
        >
          <ArrowDropDownIcon style={{ transform: `rotate(${collapseRelationships ? -90 : 0}deg)` }} />
        </IconButton>
        <Typography className={classes.collapseTypography} variant="h5">Relationships</Typography>
      </Box>
      <Collapse className={classes.collapse} in={!collapseRelationships}>
        {relations.filter(({ domain }) => domain === variant).map(({ name, range }) => (
          <NodeAutocomplete
            key={name}
            variant={range}
            label={name}
            value={relationRangeIncludes[name]}
            exclude={[id]}
            onChange={handleRelationRangeChange(name)}
          />
        ))}
      </Collapse>
      <Divider />
    </>
  );
};

export default NodeTab;
