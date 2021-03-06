import React, { useContext, useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Divider from '@material-ui/core/Divider';
import Button from '@material-ui/core/Button';
import WarningIcon from '@material-ui/icons/Warning';
import Collapse from '@material-ui/core/Collapse';
import Fade from '@material-ui/core/Fade';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import InfoIcon from '@material-ui/icons/Info';
import DocumentContext from '../context/DocumentContext';
import EditableIdentifier from '../EditableIdentifier';
import MultipleNodeAutocomplete from '../Autocomplete/MultipleNodeAutocomplete';
import queries from '../../lib/queries';
import mutations from '../../lib/mutations';
import { PROVJSONBundle, NodeVariant } from '../../lib/definition/document';
import { Relation, RELATIONS, RelationVariant } from '../../lib/definition/relation';
import { PROVVIZ_ATTRIBUTE_DEFINITIONS, ATTRIBUTE_DEFINITIONS } from '../../lib/definition/attribute';
import Section from './Section';
import Documentation from './Documentation';
import { palette } from '../../lib/theme';
import CustomAttributes from '../CustomAttributes';
import DefinedAttribute from '../DefinedAttribute';
import { Selection } from '../Visualiser';

const nodeDocumentation = {
  agent: {
    documentation: (
      <>
        {'An '}
        <strong><i>Agent</i></strong>
        {' agent is something that bears some form of responsibility for an activity taking place, for the existence of an entity, or for another agent\'s activity.'}
      </>
    ),
    url: 'https://www.w3.org/ns/prov#Agent',
  },
  entity: {
    documentation: (
      <>
        {'An '}
        <strong><i>Entity</i></strong>
        {' entity is a physical, digital, conceptual, or other kind of thing with some fixed aspects; entities may be real or imaginary.'}
      </>
    ),
    url: 'https://www.w3.org/ns/prov#Entity',
  },
  activity: {
    documentation: (
      <>
        {'An '}
        <strong><i>activity</i></strong>
        {' is something that occurs over a period of time and acts upon or with entities; it may include consuming, processing, transforming, modifying, relocating, using, or generating entities.'}
      </>
    ),
    url: 'https://www.w3.org/ns/prov#Activity',
  },
};

type EditableRelationProps = {
  relation: Relation;
  value: string[];
  domainID: string;
  bundleID?: string;
  onChange: (updatedDocument: PROVJSONBundle, value: string[]) => void;
  setSelected: (selected: Selection | undefined) => void;
}

const EditableRelation: React.FC<EditableRelationProps> = ({
  domainID, relation, value, onChange, setSelected, bundleID,
}) => {
  const { document } = useContext(DocumentContext);
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
          bundleID={bundleID}
          onChange={onChange}
          onOptionClick={(rangeID) => {
            const id = queries.relation.getID(relation.name, domainID, rangeID)(document);
            if (id) setSelected({ variant: relation.name, id });
          }}
        />
        <IconButton onClick={() => setDisplayDocumentation(!displayDocumentation)}>
          <InfoIcon />
        </IconButton>
      </Box>
      <Collapse in={displayDocumentation}>
        <Documentation documentation={documentation} url={url} />
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

export type NodeInspectorProps = {
  variant: NodeVariant;
  id: string;
  openSections: string[];
  setOpenSections: (openSections: string[]) => void;
  setSelected: (selected: Selection | undefined) => void;
  onIDChange?: (id: string) => void;
  onDelete?: () => void;
}

const NodeInspector: React.FC<NodeInspectorProps> = ({
  variant, id, onIDChange, onDelete, openSections, setOpenSections, setSelected,
}) => {
  const classes = useStyles();
  const { document, setDocument } = useContext(DocumentContext);

  const [displayDocumentation, setDisplayDocumentation] = useState<boolean>(false);
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
      name: 'Custom Attributes',
      open: openSections.includes('Custom Attributes'),
      content: <CustomAttributes variant={variant} id={id} />,
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
            bundleID={bundleID}
            onChange={handleRelationRangeChange(relation.name)}
            setSelected={setSelected}
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
            bundleID={bundleID}
          />
        )),
    },
  ].flat();

  const outgoingRelationships = queries.node.getOutgoingRelations(id)(document);
  const incomingRelationships = queries.node.getIncomingRelations(id)(document);

  const capitalisedVariant = `${variant[0].toUpperCase()}${variant.slice(1)}`;

  return (
    <>
      <Box display="flex" mb={1} justifyContent="space-between" alignItems="center">
        <Typography variant="h5">
          <strong>
            {`${capitalisedVariant}: `}
          </strong>
          {fullName}
        </Typography>
        <Tooltip
          title={(
            <>
              <strong>
                <i>{capitalisedVariant}</i>
              </strong>
              {' Documentation'}
            </>
          )}
        >
          <IconButton onClick={() => setDisplayDocumentation(!displayDocumentation)}>
            <InfoIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <Collapse in={displayDocumentation}>
        <Documentation
          documentation={nodeDocumentation[variant].documentation}
          url={nodeDocumentation[variant].url}
        />
      </Collapse>
      <Fade in={!displayDocumentation}><Divider /></Fade>
      <Box my={1.5} mx={3}>
        <EditableIdentifier initialID={id} onChange={onIDChange} bundleID={bundleID} />
        {ATTRIBUTE_DEFINITIONS
          .filter(({ domain }) => domain.includes(variant))
          .map((attribute) => (
            <DefinedAttribute
              key={attribute.name}
              attribute={attribute}
              variant={variant}
              domainID={id}
              bundleID={bundleID}
            />
          ))}
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

export default NodeInspector;
