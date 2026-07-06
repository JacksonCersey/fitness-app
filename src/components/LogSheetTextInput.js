import React from 'react';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';

/**
 * Text field for the log-set bottom sheet. Must be used inside BottomSheetModal
 * so the sheet can lift inputs and the Save set footer above the keyboard.
 */
export default function LogSheetTextInput(props) {
  return <BottomSheetTextInput {...props} />;
}
