import Context from "../context-detection";
import { PostProcessor } from "../types";

class RemoveMathIndicators implements PostProcessor {
  process(
    prefix: string,
    suffix: string,
    completion: string,
    context: Context
  ): string {
    if (context === Context.MathBlock) {
      completion = completion.replace(/\n?\$\$\n?/g, "");
      completion = completion.replace(/\$/g, "");
    }

    return completion;
  }
}

export default RemoveMathIndicators;
