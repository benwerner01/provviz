import React, {
  useState, useEffect, useRef, useContext,
} from 'react';
import {
  select, BaseType, Selection, mouse,
} from 'd3';
import { wasmFolder } from '@hpcc-js/wasm';
import { Graphviz, graphviz } from 'd3-graphviz';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Fade from '@material-ui/core/Fade';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import AddIcon from '@material-ui/icons/Add';
import { mapDocumentToDots } from '../lib/dot';
import DocumentContext from './context/DocumentContext';
import VisualisationContext from './context/VisualisationContext';
import queries from '../lib/queries';
import { Selection as PROVVizSelection } from './Visualiser';
import { Relation, RELATIONS } from '../lib/definition/relation';
import mutations from '../lib/mutations';
import { tbdIsNodeVariant } from '../lib/definition/document';

interface Datum {
  attributes: {
    id: string;
    class: string;
  }
  key: string;
  tag: string;
}

interface EllipseDatum extends Datum {
  center: { x: string; y: string; }
  tag: 'ellipse'
}

interface PolygonDatum extends Datum {
  center: { x: string; y: string; }
  tag: 'polygon'
}

interface PathDatum extends Datum {
  center: { x: string; y: string; }
  tag: 'path'
}

interface GroupDatum extends Datum {
  children: Datum[];
  tag: 'g';
}

interface NodeGroupDatum extends GroupDatum {
  children: (EllipseDatum | PolygonDatum)[];
  tag: 'g';
}

interface ClusterGroupDatum extends GroupDatum {
  children: PolygonDatum[];
  tag: 'g';
}

interface EdgeGroupDatum extends GroupDatum {
  children: (PathDatum | PolygonDatum)[];
  tag: 'g';
}

const useStyles = makeStyles((theme) => ({
  wrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
    transition: theme.transitions.create('max-height'),
    overflow: 'hidden',
  },
  graphvizWrapper: {
    '& svg': {
      '& .node': {
        '&.selected': {
          '& [stroke="black"]': {
            stroke: 'red',
          },
          '&.midpoint': {
            '& [fill="black"]': {
              fill: 'red',
            },
          },
        },
        '&.hover': {
          cursor: 'pointer',
          '& [stroke="black"]': {
            stroke: 'red',
          },
          '&.midpoint': {
            '& [fill="black"]': {
              fill: 'red',
            },
          },
        },
      },
      '& .cluster': {
        '&.selected': {
          '& ellipse, polygon': {
            stroke: 'red',
          },
        },
        '&.hover': {
          cursor: 'pointer',
          '& ellipse, polygon': {
            stroke: 'red',
          },
        },
      },
      '& .edge': {
        '&.selected': {
          '& path, polygon': {
            stroke: 'red',
          },
          '& polygon, text': {
            fill: 'red',
          },
        },
        '&.hover': {
          cursor: 'pointer',
          '& path, polygon': {
            stroke: 'red',
          },
          '& polygon, text': {
            fill: 'red',
          },
        },
      },
    },
  },
  creatingRelationWrapper: {
    position: 'absolute',
    bottom: 0,
    overflowX: 'hidden',
  },
  createRelationButton: {
    margin: theme.spacing(1),
    textTransform: 'none',
  },
  stopCreatingRelationIconButton: {
    padding: theme.spacing(0.75),
    margin: theme.spacing(1),
  },
  relationButtonsWrapper: {
    overflow: 'auto',
    whiteSpace: 'nowrap',
    display: 'flex',
  },
  relationButton: {
    margin: theme.spacing(1),
    flexShrink: 0,
    display: 'inline-block',
  },
}));

type GraphViewProps = {
  width: number;
  height: number;
  wasmFolderURL: string;
  selected: PROVVizSelection | undefined;
  setSelected: (selected: PROVVizSelection) => void;
  setSVGElement: (svg: SVGSVGElement) => void;
}

const GraphView: React.FC<GraphViewProps> = ({
  width, height, wasmFolderURL, selected, setSelected, setSVGElement,
}) => {
  const { document, setDocument } = useContext(DocumentContext);
  const { visualisationSettings } = useContext(VisualisationContext);
  const classes = useStyles();
  const graphvizWrapper = useRef<HTMLDivElement>(null);

  const [
    creatingRelation,
    setCreatingRelation] = useState<{ relation?: Relation; domainID: string; } | undefined>();

  const [
    graphvizInstance,
    setGraphvizInstance] = useState<Graphviz<BaseType, any, BaseType, any> | undefined>();
  const [
    d3Nodes,
    setD3Nodes,
  ] = useState<Selection<SVGGElement, NodeGroupDatum, SVGSVGElement, unknown> | undefined>();
  const [
    d3Edges,
    setD3Edges,
  ] = useState<Selection<SVGGElement, EdgeGroupDatum, SVGSVGElement, unknown> | undefined>();
  const [
    d3EdgeMidpoints,
    setD3EdgeMidpoints,
  ] = useState<Selection<SVGGElement, NodeGroupDatum, SVGSVGElement, unknown> | undefined>();
  const [
    d3Clusters,
    setD3Clusters,
  ] = useState<Selection<SVGGElement, ClusterGroupDatum, SVGSVGElement, unknown> | undefined>();

  useEffect(() => {
    if (graphvizWrapper.current && d3Nodes) {
      const graph = select<HTMLDivElement, unknown>(graphvizWrapper.current).select<SVGGElement>('.graph');
      if (creatingRelation && creatingRelation.relation) {
        const { domainID } = creatingRelation;

        const datum = d3Nodes.filter(({ key }) => key === domainID).datum();

        const { center } = datum.children.find(({ tag }) => tag === 'ellipse' || tag === 'polygon')!;

        const x1 = parseFloat(center.x);
        const y1 = parseFloat(center.y);

        const line = graph.append('line')
          .attr('id', 'creatingRelation')
          .attr('x1', x1)
          .attr('y1', y1)
          .attr('x2', x1)
          .attr('y2', y1)
          .attr('stroke-width', 1)
          .attr('stroke', 'black')
          .attr('marker-end', 'url(#triangle)');

        graph.on('mousemove', function mouseover() {
          const [x2, y2] = mouse(this);
          line.attr('x2', x2 + (x1 < x2 ? -10 : 20));
          line.attr('y2', y2 + (y1 < y2 ? -10 : 20));
        });
      } else {
        graph.select('#creatingRelation').remove();
        graph.on('mousemove', null);
      }
    }
  }, [graphvizWrapper, creatingRelation, d3Nodes]);

  useEffect(() => {
    if (selected && d3Nodes && d3Clusters && d3Edges) {
      const d3Selected = selected.variant === 'bundle'
        ? d3Clusters.filter(({ key }) => key === `cluster_${selected.id}`)
        : tbdIsNodeVariant(selected.variant)
          ? d3Nodes.filter(({ key }) => key === selected.id)
          : d3Edges.filter(({ attributes }) => attributes.id === selected.id);

      const datum = d3Selected.empty() ? undefined : d3Selected.datum();

      const { children } = datum || {};

      if (children && graphvizInstance && graphvizWrapper.current) {
        const svg = select<HTMLDivElement, unknown>(graphvizWrapper.current).select<SVGSVGElement>('svg');
        const zoom = graphvizInstance.zoomBehavior();

        const { center } = (children as (PathDatum | PolygonDatum | EllipseDatum)[])
          .find(({ tag }) => tag === 'ellipse' || tag === 'polygon' || tag === 'path') || {};

        if (zoom && center) {
          const graph = svg.select<SVGGElement>('.graph');
          const graphHeight = graph.node()!.getBBox().height;
          const graphWidth = graph.node()!.getBBox().width;

          const x = parseFloat(center.x);
          const y = parseFloat(center.y);

          zoom.scaleTo(svg as any, 1);
          zoom.translateTo(
            svg.transition() as any,
            width / 2 - graphWidth / 2 + x,
            height / 2 - graphHeight / 2 + y,
          );
        }
      }
    }
  }, [selected, d3Nodes, d3Clusters, d3Edges]);

  useEffect(() => {
    wasmFolder(wasmFolderURL);

    if (graphvizWrapper.current) {
      setGraphvizInstance(
        graphviz(graphvizWrapper.current, { useWorker: false })
          .width(width)
          .height(height)
          .fit(true)
          .transition(() => 'ease'),
      );
    }
  }, [graphvizWrapper]);

  useEffect(() => {
    if (graphvizWrapper.current) {
      select<HTMLDivElement, unknown>(graphvizWrapper.current)
        .select<SVGSVGElement>('svg')
        .attr('width', `${width}px`)
        .attr('height', `${height}px`);
    }
  }, [graphvizWrapper, width, height]);

  useEffect(() => {
    if (graphvizInstance) {
      graphvizInstance
        .height(height)
        .width(width)
        .renderDot(mapDocumentToDots(document, visualisationSettings))
        .on('end', () => {
          const svg = select(graphvizWrapper.current).select<SVGSVGElement>('svg');
          setD3Nodes(svg
            .selectAll<SVGGElement, NodeGroupDatum>('.node')
            .filter(({ key }) => queries.document.hasNode(key)(document)));
          setD3Clusters(svg
            .selectAll<SVGGElement, ClusterGroupDatum>('.cluster')
            .filter(({ key }) => queries.document.hasBundle(key.slice(8))(document)));
          setD3Edges(svg
            .selectAll<SVGGElement, EdgeGroupDatum>('.edge')
            .filter(({ attributes }) => queries.document.hasRelation(attributes.id)(document)));
          setD3EdgeMidpoints(svg
            .selectAll<SVGGElement, NodeGroupDatum>('.node')
            .filter(({ attributes }) => queries.document.hasRelation(attributes.id)(document)));

          if (svg.select('defs').select('#triangle').empty()) {
            svg.append('svg:defs').append('marker')
              .attr('id', 'triangle')
              .attr('refX', 6)
              .attr('refY', 6)
              .attr('markerWidth', 30)
              .attr('markerHeight', 30)
              .attr('orient', 'auto')
              .append('path')
              .attr('d', 'M 0 0 12 6 0 12 3 6')
              .style('fill', 'black');
          }

          const svgElement = svg.node();

          if (svgElement) setSVGElement(svgElement);
        });
    }
  }, [graphvizInstance, visualisationSettings, document]);

  useEffect(() => {
    if (
      graphvizWrapper.current
      && graphvizInstance
      && d3Nodes
      && d3Edges
      && d3Clusters
      && d3EdgeMidpoints) {
      if (selected) {
        const d3Selected = selected.variant === 'bundle'
          ? [d3Clusters.filter(({ key }) => selected.id === key.slice(8))]
          : tbdIsNodeVariant(selected.variant)
            ? [d3Nodes.filter(({ key }) => selected.id === key)]
            : [
              d3Edges.filter(({ attributes }) => selected.id === attributes.id),
              d3EdgeMidpoints.filter(({ attributes }) => selected.id === attributes.id),
            ];

        d3Selected.forEach((d3Item: any) => d3Item.classed('selected', true));
      }

      const deselectedNodeGroups = d3Nodes
        .filter(({ key }) => !selected || selected.variant === 'bundle' || selected.id !== key);
      const deselectedClusterGroups = d3Clusters
        .filter(({ key }) => !selected || selected.variant !== 'bundle' || selected.id !== key.slice(8));

      if (deselectedNodeGroups) deselectedNodeGroups.classed('selected', false);
      if (deselectedClusterGroups) deselectedClusterGroups.classed('selected', false);

      const deselectedEdges = d3Edges
        .filter(({ attributes }) => (
          !selected
          || selected.variant === 'bundle'
          || attributes.id !== selected.id));

      deselectedEdges.classed('selected', false);

      const deselectedEdgeMidpoints = d3EdgeMidpoints
        .filter(({ attributes }) => (
          !selected
          || selected.variant === 'bundle'
          || attributes.id !== selected.id));

      deselectedEdgeMidpoints.classed('selected', false);

      d3Nodes.on('mouseover', function mouseover({ key }) {
        const variant = queries.node.getVariant(key)(document);
        if (
          creatingRelation
          && creatingRelation.relation
          && creatingRelation.relation.range !== variant) return;

        const nodeGroup = select(this);
        nodeGroup.classed('hover', true);
      });

      d3Edges.on('mouseover', ({ attributes }) => {
        d3EdgeMidpoints.filter((edgeMidpointDatum) => edgeMidpointDatum.attributes.id === attributes.id).classed('hover', true);
        d3Edges.filter((edgeDatum) => edgeDatum.attributes.id === attributes.id).classed('hover', true);
      });

      d3EdgeMidpoints.classed('midpoint', true);

      d3EdgeMidpoints.on('mouseover', function mouseover({ attributes }) {
        if (creatingRelation) return;

        const edgeGroup = select(this);
        edgeGroup.classed('hover', true);

        d3Edges.filter((edgeDatum) => edgeDatum.attributes.id === attributes.id).classed('hover', true);
      });

      d3Nodes.on('mouseout', function mouseout() {
        const nodeGroup = select(this);
        nodeGroup.classed('hover', false);
      });

      d3Edges.on('mouseout', ({ attributes }) => {
        d3EdgeMidpoints.filter((edgeMidpointDatum) => edgeMidpointDatum.attributes.id === attributes.id).classed('hover', false);
        d3Edges.filter((edgeDatum) => edgeDatum.attributes.id === attributes.id).classed('hover', false);
      });

      d3EdgeMidpoints.on('mouseout', function mouseout({ attributes }) {
        const edgeGroup = select(this);
        edgeGroup.classed('hover', false);
        d3Edges.filter((edgeDatum) => edgeDatum.attributes.id === attributes.id).classed('hover', false);
      });

      d3Nodes.on('click', ({ key, attributes }) => {
        const variant = queries.node.getVariant(key)(document);
        if (creatingRelation && creatingRelation.relation) {
          const { relation, domainID } = creatingRelation;
          if (relation.range === variant) {
            const relationID = queries.relation.generateID()(document);
            setDocument(mutations.relation.create(relation.name, relationID, domainID, key));
            setSelected({ id: relationID, variant: relation.name });
            setCreatingRelation(undefined);
          }
        } else {
          setSelected({ id: key, variant });
        }
      });

      d3Edges.on('click', ({ attributes }) => {
        const { id } = attributes;
        const variant = queries.relation.getVariant(id)(document);
        setSelected({ id, variant });
      });

      if (!d3Clusters.empty()) {
        d3Clusters.call((d3Cluster) => {
          const datum = d3Cluster.datum();
          const key = datum.key.slice(8);

          d3Cluster.select('text')
            .on('mouseover', () => d3Cluster.classed('hover', true))
            .on('mouseout', () => d3Cluster.classed('hover', false))
            .on('click', () => setSelected({ id: key, variant: 'bundle' }));
        });
      }
    }
  }, [d3Nodes, d3Edges, d3EdgeMidpoints, d3Clusters, selected, creatingRelation]);

  const usingMouse = !('ontouchstart' in window);

  return (
    <div className={classes.wrapper} style={{ maxHeight: height }}>
      {usingMouse && (
      <Fade in={selected && tbdIsNodeVariant(selected.variant)}>
        <Box display="flex" alignItems="center" className={classes.creatingRelationWrapper} style={{ width }}>
          {selected && (creatingRelation
            ? creatingRelation.relation ? (
              <>
                <Button className={classes.createRelationButton} variant="contained" onClick={() => setCreatingRelation(undefined)}>
                  Cancel
                </Button>
                <Typography>
                  {'Creating '}
                  <i>{creatingRelation.relation.name}</i>
                  {' relation'}
                </Typography>
              </>
            ) : (
              <>
                <Box display="flex" className={classes.relationButtonsWrapper}>
                  {RELATIONS
                    .filter(({ domain }) => domain === selected.variant)
                    .map((relation) => (
                      <Button
                        key={relation.name}
                        className={[classes.createRelationButton, classes.relationButton].join(' ')}
                        variant="contained"
                        onClick={() => setCreatingRelation({ relation, domainID: selected.id })}
                      >
                        {relation.name}
                      </Button>
                    ))}
                </Box>
                <IconButton
                  className={classes.stopCreatingRelationIconButton}
                  onClick={() => setCreatingRelation(undefined)}
                >
                  <CloseIcon />
                </IconButton>
              </>
            ) : (
              <Button
                variant="contained"
                className={classes.createRelationButton}
                onClick={() => setCreatingRelation({ domainID: selected.id })}
                endIcon={<AddIcon />}
              >
                Relation
              </Button>
            ))}
        </Box>
      </Fade>
      )}
      <div
        className={classes.graphvizWrapper}
        ref={graphvizWrapper}
      />
    </div>
  );
};

export default GraphView;
