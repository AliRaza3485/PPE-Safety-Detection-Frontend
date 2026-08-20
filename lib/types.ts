export interface Detection {
  label: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2] in source-image pixels
  violation: boolean;
}

export interface Summary {
  total: number;
  counts: Record<string, number>;
  violation_count: number;
  compliant: boolean;
}

export interface PredictResponse {
  filename: string;
  detections: Detection[];
  summary: Summary;
}