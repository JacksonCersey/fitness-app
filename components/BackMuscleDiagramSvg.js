import React from 'react';
import Svg, { G, Path } from 'react-native-svg';
import { dashboardPreviewFillBack } from '../data/dashboardMusclePreviewFill';
import {
  LABELED_BACK_LAYER_TRANSFORM,
  LABELED_BACK_PATH_SHAPES,
  LABELED_BACK_VIEW_BOX,
} from '../data/labeledMuscleSvgShapes';
import { heatFillForBackPath, recoveryStatusFillForBackPath } from '../data/workoutMuscleHeat';

const SHAPES = LABELED_BACK_PATH_SHAPES;
const VIEW_BOX = LABELED_BACK_VIEW_BOX;
const LAYER_TRANSFORM = LABELED_BACK_LAYER_TRANSFORM;

/**
 * Back body from `assets/images/musclessvglabeledback.svg` with heat-map fills from activationBySlug.
 * @param {{
 *   activationBySlug?: Record<string, number>;
 *   statusBySlug?: Record<string, 'ready' | 'recovering' | 'highFatigue'>;
 *   height: number;
 *   width?: number | string;
 *   viewBox?: string;
 *   previewHighlightLabel?: string;
 *   previewHighlightLabels?: string[];
 *   previewOnlyPathIds?: string[];
 * }} props
 */
export default function BackMuscleDiagramSvg({
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
      accessibilityLabel="Back muscle diagram">
      <G transform={LAYER_TRANSFORM}>
        {SHAPES.map((shape) => {
          const fill = statusBySlug
            ? recoveryStatusFillForBackPath(shape.id, statusBySlug)
            : previewLabels
              ? dashboardPreviewFillBack(shape.id, previewLabels, {
                  onlyPathIds: previewOnlyPathIds,
                })
              : heatFillForBackPath(shape.id, activation);
          return <Path key={shape.id} id={shape.id} d={shape.d} fill={fill} />;
        })}
      </G>
    </Svg>
  );
}
