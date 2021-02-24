import React, {
  useState, useEffect, useRef, useContext,
} from 'react';
import { select, BaseType, Selection } from 'd3';
import { wasmFolder } from '@hpcc-js/wasm';
import { Graphviz, graphviz } from 'd3-graphviz';
import { makeStyles } from '@material-ui/core/styles';
import { mapDocumentToDots } from '../util/dot';
import DocumentContext from './contexts/DocumentContext';
import VisualisationContext from './contexts/VisualisationContext';
import queries from '../util/queries';

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
  graphvizWrapper: {
    width: '100%',
    height: '100%',
    transition: theme.transitions.create('max-height'),
    overflow: 'hidden',
    '& svg': {
      '& .node': {
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
          '& polygon': {
            fill: 'red',
          },
        },
      },
    },
  },
}));

type GraphvizProps = {
  width: number;
  height: number;
  wasmFolderURL: string;
  selectedNodeID: string | undefined;
  setSelectedNodeID: (id: string | undefined) => void;
  setSVGElement: (svg: SVGSVGElement) => void;
}

const D3Graphviz: React.FC<GraphvizProps> = ({
  width, height, wasmFolderURL, selectedNodeID, setSelectedNodeID, setSVGElement,
}) => {
  const { document } = useContext(DocumentContext);
  const { visualisationSettings } = useContext(VisualisationContext);
  const classes = useStyles();
  const graphvizWrapper = useRef<HTMLDivElement>(null);

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
    d3Clusters,
    setD3Clusters,
  ] = useState<Selection<SVGGElement, ClusterGroupDatum, SVGSVGElement, unknown> | undefined>();

  useEffect(() => {
    if (selectedNodeID && d3Nodes && d3Clusters) {
      const selectedNode = d3Nodes.filter(({ key }) => key === selectedNodeID);
      const selectedCluster = d3Clusters.filter(({ key }) => key === `cluster_${selectedNodeID}`);

      const datum = selectedCluster.empty()
        ? selectedNode.empty()
          ? undefined
          : selectedNode.datum()
        : d3Clusters.datum();

      const { children } = datum || {};

      if (children && graphvizInstance && graphvizWrapper.current) {
        const svg = select<HTMLDivElement, unknown>(graphvizWrapper.current).select<SVGSVGElement>('svg');
        const zoom = graphvizInstance.zoomBehavior();

        const { center } = children.find(({ tag }) => tag === 'ellipse' || tag === 'polygon') || {};

        if (zoom && center) {
          const graph = svg.select<SVGGElement>('.graph');
          const graphHeight = graph.node()!.getBBox().height;
          const graphWidth = graph.node()!.getBBox().width;

          const x = parseFloat(center.x);
          const y = parseFloat(center.y);

          zoom.scaleTo(svg.transition() as any, 1);
          zoom.translateTo(
            svg.transition() as any,
            width / 2 - graphWidth / 2 + x,
            height / 2 - graphHeight / 4 + y,
          );
        }
      }
    }
  }, [selectedNodeID, d3Nodes, d3Clusters]);

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
        .renderDot(mapDocumentToDots(document, visualisationSettings))
        .on('end', () => {
          const svg = select(graphvizWrapper.current).select<SVGSVGElement>('svg');
          setD3Nodes(svg
            .selectAll<SVGGElement, NodeGroupDatum>('.node')
            .filter(({ key }) => queries.document.hasNode(key)(document)));
          setD3Clusters(svg
            .selectAll<SVGGElement, ClusterGroupDatum>('.cluster')
            .filter(({ key }) => queries.document.hasBundle(key.slice(8))(document)));
          setD3Edges(svg.selectAll<SVGGElement, EdgeGroupDatum>('.edge'));

          const svgElement = svg.node();

          if (svgElement) setSVGElement(svgElement);
        });
    }
  }, [graphvizInstance, visualisationSettings, document]);

  useEffect(() => {
    if (graphvizWrapper.current && graphvizInstance && d3Nodes && d3Edges && d3Clusters) {
      if (selectedNodeID) {
        const selectedNodeGroup = d3Nodes.filter(({ key }) => selectedNodeID === key);
        const selectedClusterGroup = d3Clusters
          .filter(({ key }) => selectedNodeID === key.slice(8));

        selectedNodeGroup.classed('selected', true);
        selectedClusterGroup.classed('selected', true);

        const selectedEdges = d3Edges.filter(({ key }) => key.startsWith(`${selectedNodeID}->`));
        selectedEdges.classed('selected', true);
      }

      const deselectedNodeGroups = d3Nodes.filter(({ key }) => selectedNodeID !== key);
      const deselectedClusterGroups = d3Clusters
        .filter(({ key }) => selectedNodeID !== key.slice(8));

      if (deselectedNodeGroups) deselectedNodeGroups.classed('selected', false);
      if (deselectedClusterGroups) deselectedClusterGroups.classed('selected', false);

      const deselectedEdges = d3Edges.filter(({ key }) => !key.startsWith(`${selectedNodeID}->`));
      deselectedEdges.classed('selected', false);

      d3Nodes.on('mouseover', function mouseover() {
        const nodeGroup = select(this);
        nodeGroup.classed('hover', true);
      });

      d3Nodes.on('mouseout', function mouseout() {
        const nodeGroup = select(this);
        nodeGroup.classed('hover', false);
      });

      d3Nodes.on('click', ({ key }) => setSelectedNodeID(key));

      if (!d3Clusters.empty()) {
        d3Clusters.call((d3Cluster) => {
          const datum = d3Cluster.datum();
          const key = datum.key.slice(8);

          d3Cluster.select('text')
            .on('mouseover', () => d3Cluster.classed('hover', true))
            .on('mouseout', () => d3Cluster.classed('hover', false))
            .on('click', () => setSelectedNodeID(key));
        });
      }
    }
  }, [d3Nodes, d3Edges, d3Clusters, selectedNodeID]);

  return (
    <div
      style={{ maxHeight: height }}
      className={classes.graphvizWrapper}
      ref={graphvizWrapper}
    />
  );
};

export default D3Graphviz;
