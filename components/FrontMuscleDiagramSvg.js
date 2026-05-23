import React from 'react';
import Svg, { G, Path } from 'react-native-svg';
import { dashboardPreviewFillFront } from '../data/dashboardMusclePreviewFill';
import {
  LABELED_FRONT_LAYER_TRANSFORM,
  LABELED_FRONT_PATH_SHAPES,
  LABELED_FRONT_VIEW_BOX,
} from '../data/labeledMuscleSvgShapes';
import { heatFillForFrontPath, recoveryStatusFillForFrontPath } from '../data/workoutMuscleHeat';

const SHAPES = LABELED_FRONT_PATH_SHAPES;
const VIEW_BOX = LABELED_FRONT_VIEW_BOX;
const LAYER_TRANSFORM = LABELED_FRONT_LAYER_TRANSFORM;

/**
 * Front body from `assets/images/musclessvglabeledfront.svg` with heat-map fills from activationBySlug.
 * @param {{
 *   activationBySlug?: Record<string, number>;
 *   statusBySlug?: Record<string, 'rested' | 'moderate' | 'fatigued'>;
 *   height: number;
 *   width?: number | string;
 *   viewBox?: string;
 *   previewHighlightLabel?: string;
 *   previewHighlightLabels?: string[];
 *   previewOnlyPathIds?: string[];
 * }} props
 */
export default function FrontMuscleDiagramSvg({
  activationBySlug,
  statusBySlug,
  height,
  width = '100%',
  viewBox,
  previewHighlightLabel,
  previewHighlightLabels,
  previewOnlyPathIds,
}) {
  const activation = activationBySlug ?? {};
  const vb = viewBox ?? VIEW_BOX;
  const previewLabels =
    previewHighlightLabels?.length > 0
      ? previewHighlightLabels
      : previewHighlightLabel
        ? [previewHighlightLabel]
        : null;

  return (
    <Svg
      width={width}
      height={height}
      viewBox={vb}
      preserveAspectRatio="xMidYMid meet"
      pointerEvents="none"
      accessibilityLabel="Front muscle diagram">
      <G transform={LAYER_TRANSFORM}>
        {SHAPES.map((shape) => {
          const fill = statusBySlug
            ? recoveryStatusFillForFrontPath(shape.id, statusBySlug)
            : previewLabels
              ? dashboardPreviewFillFront(shape.id, previewLabels, {
                  onlyPathIds: previewOnlyPathIds,
                })
              : heatFillForFrontPath(shape.id, activation);
          return <Path key={shape.id} id={shape.id} d={shape.d} fill={fill} />;
        })}
      </G>
    </Svg>
  );
}
