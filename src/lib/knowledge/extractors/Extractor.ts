import type { ResourceInputPayload, ExtractionResult, ResourceType } from "../types";

/**
 * Extractor Interface
 *
 * Each resource type has a dedicated Extractor implementing this contract.
 */
export interface Extractor {
  readonly supportedTypes: ResourceType[];
  canHandle(type: ResourceType): boolean;
  extract(payload: ResourceInputPayload): Promise<ExtractionResult>;
}
