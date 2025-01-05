import { Prec } from "@codemirror/state";
import { keymap } from "@codemirror/view";

function CompletionKeyWatcher(
	handleAcceptKey: () => boolean,
	handlePartialAcceptKey: () => boolean,
	handleCancelKey: () => boolean
) {
	return Prec.highest(
		keymap.of([
			{
				key: "Tab",
				run: handleAcceptKey,
			},
			{
				key: "ArrowRight",
				run: handlePartialAcceptKey,
			},
			{
				key: "Escape",
				run: handleCancelKey,
			},
		])
	);
}

export default CompletionKeyWatcher;
