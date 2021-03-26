import React, { useContext, useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Divider from '@material-ui/core/Divider';
import Button from '@material-ui/core/Button';
import WarningIcon from '@material-ui/icons/Warning';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import InfoIcon from '@material-ui/icons/Info';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import DocumentContext from '../contexts/DocumentContext';
import EditableIdentifier from '../EditableIdentifier';
import MultipleNodeAutocomplete from '../Autocomplete/MultipleNodeAutocomplete';
import queries from '../../util/queries';
import mutations from '../../util/mutations';
import { PROVJSONBundle, NodeVariant } from '../../util/definition/document';
import { Relation, RELATIONS, RelationVariant } from '../../util/definition/relation';
import { PROVVIZ_ATTRIBUTE_DEFINITIONS, ATTRIBUTE_DEFINITIONS } from '../../util/definition/attribute';
import Section from './Section';
import { palette } from '../../util/theme';
import CustomAttributes from '../CustomAttributes';
import DefinedAttribute from '../DefinedAttribute';

const useEditableRelationStyles = makeStyles((theme) => ({
  documenationWrapper: {
    borderRadius: 8,
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.common.white,
    '& svg': {
      color: theme.palette.common.white,
    },
  },
  openDocumentationIconButton: {
    padding: 0,
  },
}));

type EditableRelationProps = {
  relation: Relation;
  value: string[];
  domainID: string;
  onChange: (updatedDocument: PROVJSONBundle, value: string[]) => void
}

const EditableRelation: React.FC<EditableRelationProps> = ({
  domainID, relation, value, onChange,
}) => {
  const classes = useEditableRelationStyles();
  const [displayDocumentation, setDisplayDocumentation] = useState<boolean>(false);

  const {
    documentation, range, name, url,
  } = relation;

  return (
    <>
      <Box mt={1} mb={1} display="flex" alignItems="center">
        <MultipleNodeAutocomplete
          variant={range}
          label={name}
          value={value}
          exclude={[domainID]}
          onChange={onChange}
        />
        <IconButton onClick={() => setDisplayDocumentation(!displayDocumentation)}>
          <InfoIcon />
        </IconButton>
      </Box>
      <Collapse in={displayDocumentation}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" p={1} className={classes.documenationWrapper}>
          <Typography>{documentation}</Typography>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <IconButton
              disableRipple
              disableFocusRipple
              className={classes.openDocumentationIconButton}
            >
              <OpenInNewIcon />
            </IconButton>
          </a>
        </Box>
      </Collapse>
    </>
  );
};

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
  openSections: string[];
  setOpenSections: (openSections: string[]) => void;
  onIDChange?: (id: string) => void;
  onDelete?: () => void;
}

const NodeTab: React.FC<NodeTabProps> = ({
  variant, id, onIDChange, onDelete, openSections, setOpenSections,
}) => {
  const classes = useStyles();
  const { document, setDocument } = useContext(DocumentContext);

  const [fullName, setFullName] = useState<string>('');
  const [
    bundleID, setBundleID] = useState<string | undefined>();

  useEffect(() => {
    if (queries.document.hasNode(id)(document)) {
      setFullName(queries.node.getFullName(id)(document));
      setBundleID(queries.node.getBundleID(id)(document));
    }
  }, [document, id]);

  const relationRangeIncludes = RELATIONS
    .filter(({ domain }) => domain === variant)
    .reduce((prev, { name }) => ({
      ...prev,
      [name]: queries.relation.getRangeWithDomain(name, id)(document),
    }), {} as { [key: string]: string[] });

  const handleRelationRangeChange = (relationName: RelationVariant) => (
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

  const handleDelete = () => {
    setDocument(mutations.node.delete(variant, id));
    if (onDelete) onDelete();
  };

  const collapsableSections = [
    {
      name: 'Definition',
      open: openSections.includes('Definition'),
      content: (
        <>
          <EditableIdentifier initialID={id} onChange={onIDChange} bundleID={bundleID} />
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
      open: openSections.includes('Attributes'),
      content: <CustomAttributes nodeVariant={variant} nodeID={id} />,
    },
    {
      name: 'Relationships',
      open: openSections.includes('Relationships'),
      content: RELATIONS
        .filter(({ domain }) => domain === variant)
        .map((relation) => (
          <EditableRelation
            key={relation.name}
            relation={relation}
            value={relationRangeIncludes[relation.name]}
            domainID={id}
            onChange={handleRelationRangeChange(relation.name)}
          />
        )),
    },
    {
      name: 'Visualisation',
      open: openSections.includes('Visualisation'),
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
      {collapsableSections.map(({ open, name, content }) => (
        <Section
          key={name}
          open={open}
          name={name}
          toggleOpen={() => setOpenSections(open
            ? openSections.filter((sectionName) => sectionName !== name)
            : [...openSections, name])}
        >
          {content}
        </Section>
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
