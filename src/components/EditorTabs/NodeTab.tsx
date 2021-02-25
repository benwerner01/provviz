import React, { useContext } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Divider from '@material-ui/core/Divider';
import Button from '@material-ui/core/Button';
import WarningIcon from '@material-ui/icons/Warning';
import DocumentContext from '../contexts/DocumentContext';
import EditableIdentifier from '../EditableIdentifier';
import NodeAutocomplete from '../Autocomplete/NodeAutocomplete';
import queries from '../../util/queries';
import mutations from '../../util/mutations';
import {
  ATTRIBUTE_DEFINITIONS,
  PROVJSONBundle,
  RelationName,
  RELATIONS,
  PROVVIZ_ATTRIBUTE_DEFINITIONS,
  NodeVariant,
} from '../../util/document';
import Section from './Section';
import { palette } from '../../util/theme';
import CustomAttributes from '../CustomAttributes';
import DefinedAttribute from '../DefinedAttribute';

const useStyles = makeStyles((theme) => ({
  deleteButton: {
    marginRight: theme.spacing(1),
    backgroundColor: palette.danger.main,
    color: theme.palette.common.white,
    '&:hover': {
      backgroundColor: palette.danger.dark,
    },
  },
  warningIcon: {
    color: palette.danger.main,
  },
  warningTypography: {
    color: palette.danger.main,
  },
}));

type NodeTabProps = {
  variant: NodeVariant;
  id: string;
  onIDChange?: (id: string) => void;
  onDelete?: () => void;
}

const NodeTab: React.FC<NodeTabProps> = ({
  variant, id, onIDChange, onDelete,
}) => {
  const classes = useStyles();
  const { document, setDocument } = useContext(DocumentContext);

  const relationRangeIncludes = RELATIONS
    .filter(({ domain }) => domain === variant)
    .reduce((prev, { name }) => ({
      ...prev,
      [name]: queries.relation.getRangeWithDomain(name, id)(document),
    }), {} as { [key: string]: string[] });

  const handleRelationRangeChange = (relationName: RelationName) => (
    updatedDocument: PROVJSONBundle, rangeIDs: string[],
  ) => {
    const rangeIncludes = relationRangeIncludes[relationName];
    const add = rangeIDs.filter((rangeID) => !rangeIncludes.includes(rangeID));
    const remove = rangeIncludes.filter((rangeID) => !rangeIDs.includes(rangeID));

    add.forEach((activityID) => {
      const relationID = queries.relation.generateID()(document);
      // eslint-disable-next-line no-param-reassign
      updatedDocument = mutations.relation.create(
        relationName, relationID, id, activityID,
      )(updatedDocument);
    });
    remove.forEach((activityID) => {
      const relationID = queries.relation.getID(relationName, id, activityID)(document);
      if (!relationID) throw new Error('Could not find relationID');
      // eslint-disable-next-line no-param-reassign
      updatedDocument = {
        ...updatedDocument,
        ...mutations.relation.delete(relationName, relationID)(updatedDocument),
      };
    });

    setDocument(updatedDocument);
  };

  const fullName = queries.node.getFullName(id)(document);

  const handleDelete = () => {
    setDocument(mutations.node.delete(variant, id));
    if (onDelete) onDelete();
  };

  const collapsableSections = [
    {
      name: 'Definition',
      initiallyOpen: false,
      content: (
        <>
          <EditableIdentifier initialID={id} onChange={onIDChange} />
          {ATTRIBUTE_DEFINITIONS
            .filter(({ domain }) => domain.includes(variant))
            .map((attribute) => (
              <DefinedAttribute
                key={attribute.name}
                attribute={attribute}
                variant={variant}
                domainID={id}
              />
            ))}
        </>
      ),
    },
    {
      name: 'Attributes',
      initiallyOpen: false,
      content: <CustomAttributes nodeVariant={variant} nodeID={id} />,
    },
    {
      name: 'Relationships',
      content: RELATIONS.filter(({ domain }) => domain === variant).map(({ name, range }) => (
        <NodeAutocomplete
          key={name}
          variant={range}
          label={name}
          value={relationRangeIncludes[name]}
          exclude={[id]}
          onChange={handleRelationRangeChange(name)}
        />
      )),
    },
    {
      name: 'Visualisation',
      content: PROVVIZ_ATTRIBUTE_DEFINITIONS
        .filter(({ domain }) => domain.includes(variant))
        .map((attribute) => (
          <DefinedAttribute
            key={attribute.name}
            attribute={attribute}
            variant={variant}
            domainID={id}
          />
        )),
    },
  ].flat();

  const outgoingRelationships = queries.node.getOutgoingRelations(id)(document);
  const incomingRelationships = queries.node.getIncomingRelations(id)(document);

  return (
    <>
      <Box display="flex" mb={1}>
        <Typography variant="h5">
          <strong>
            {`${variant[0].toUpperCase()}${variant.slice(1)}: `}
          </strong>
          {fullName}
        </Typography>
      </Box>
      <Divider />
      {collapsableSections.map(({ initiallyOpen, name, content }) => (
        <Section key={name} initiallyOpen={initiallyOpen} name={name}>{content}</Section>
      ))}
      <Box display="flex" flexWrap="wrap" alignItems="center" mt={2}>
        <Button onClick={handleDelete} className={classes.deleteButton} variant="contained">Delete</Button>
        {(outgoingRelationships.length > 0 || incomingRelationships.length > 0) && (
          <Box my={1} display="flex" flexWrap="wrap" alignItems="center">
            <Box display="flex" alignItems="center" mr={1}>
              <WarningIcon className={classes.warningIcon} />
              <Typography className={classes.warningTypography}>
                <strong>Warning:</strong>
              </Typography>
            </Box>
            <Typography>
              {`deleting this ${variant} will also `}
              {outgoingRelationships.length > 0
                ? (
                  <>
                    <strong>{`delete ${outgoingRelationships.length} outgoing relationships`}</strong>
                    {incomingRelationships.length > 0 && (
                      <>
                        {' and '}
                        <strong>{`delete ${incomingRelationships.length} incoming relationships`}</strong>
                      </>
                    )}
                  </>
                )
                : <strong>{`delete ${incomingRelationships.length} incoming relationships`}</strong>}
            </Typography>
          </Box>
        )}
      </Box>
    </>
  );
};

export default NodeTab;