// src/lib/document-analysis.ts
// Document analysis service for auto-populating project information

import { ProjectWizardData } from '@/types/project';

export interface DocumentAnalysisResult {
  projectName?: string;
  description?: string;
  discipline?: 'construction' | 'design' | 'trade';
  projectType?: string;
  location?: {
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  estimatedBudget?: number;
  timeline?: {
    startDate?: string;
    endDate?: string;
    duration?: number;
  };
  keyMilestones?: string[];
  anticipatedRFPs?: Array<{
    name: string;
    discipline: 'construction' | 'design' | 'trade';
    estimatedBudget: number;
    description: string;
    timeline: string;
  }>;
  requirements?: string[];
  stakeholders?: Array<{
    name?: string;
    role?: string;
    company?: string;
    email?: string;
  }>;
  specifications?: string[];
  confidence?: number;
}

export interface DocumentFile {
  file: File;
  content?: string;
  analysisResult?: DocumentAnalysisResult;
}

// Document analysis prompt for Claude
const DOCUMENT_ANALYSIS_PROMPT = `
You are a construction and project management expert. Analyze the uploaded document and extract key project information.

Please extract and return the following information in JSON format:

{
  "projectName": "string - Project name or title",
  "description": "string - Project description or overview",
  "discipline": "construction|design|trade|mixed - Primary project discipline",
  "projectType": "string - Type of project (e.g., commercial_office, residential, healthcare, etc.)",
  "location": {
    "address": "string - Street address if available",
    "city": "string - City name",
    "state": "string - State or province",
    "zipCode": "string - Postal/ZIP code"
  },
  "estimatedBudget": "number - Total project budget in USD",
  "timeline": {
    "startDate": "string - YYYY-MM-DD format",
    "endDate": "string - YYYY-MM-DD format",
    "duration": "number - Project duration in months"
  },
  "keyMilestones": ["array of important project milestones"],
  "anticipatedRFPs": [
    {
      "name": "string - RFP name",
      "discipline": "construction|design|trade",
      "estimatedBudget": "number - RFP budget",
      "description": "string - RFP description"
    }
  ],
  "requirements": ["array of key project requirements"],
  "stakeholders": [
    {
      "name": "string - Person name",
      "role": "string - Role/title",
      "company": "string - Company name",
      "email": "string - Email if available"
    }
  ],
  "specifications": ["array of technical specifications"],
  "confidence": "number - Confidence level 0-100 for extraction accuracy"
}

Focus on extracting factual information. If information is not clearly stated, omit those fields rather than guessing.
For budgets and dates, only include if explicitly mentioned in the document.
For discipline, categorize based on the primary focus:
- construction: Building construction, general contracting
- design: Architectural, engineering design services
- trade: Specialized systems (MEP, elevators, etc.)

Return only the JSON object, no additional text.
`;

export async function analyzeDocument(file: File): Promise<DocumentAnalysisResult> {
  try {
    // Convert file to base64
    const base64Content = await fileToBase64(file);

    // Prepare the request for Claude API
    const response = await fetch('/api/claude', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: DOCUMENT_ANALYSIS_PROMPT,
        document: base64Content,
        fileName: file.name,
        fileType: file.type
      }),
    });

    if (!response.ok) {
      throw new Error(`Analysis request failed: ${response.statusText}`);
    }

    const result = await response.json();

    // Parse the JSON response from Claude
    let analysisResult: DocumentAnalysisResult;
    try {
      analysisResult = JSON.parse(result.content);
    } catch (parseError) {
      console.warn('Failed to parse Claude response as JSON:', result.content);
      // Fallback: extract basic info from filename
      analysisResult = extractBasicInfoFromFilename(file.name);
    }

    return {
      ...analysisResult,
      confidence: analysisResult.confidence || 50
    };

  } catch (error) {
    console.error('Document analysis error:', error);
    // Return basic info extracted from filename as fallback
    return extractBasicInfoFromFilename(file.name);
  }
}

export async function analyzeMultipleDocuments(files: File[]): Promise<DocumentAnalysisResult> {
  const results = await Promise.all(files.map(analyzeDocument));

  // Merge results with confidence weighting
  return mergeAnalysisResults(results);
}

function mergeAnalysisResults(results: DocumentAnalysisResult[]): DocumentAnalysisResult {
  if (results.length === 0) return { confidence: 0 };
  if (results.length === 1) return results[0];

  const merged: DocumentAnalysisResult = {
    confidence: Math.max(...results.map(r => r.confidence || 0))
  };

  // Take the result with highest confidence for each field
  results.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

  const highestConfidence = results[0];

  // Use values from highest confidence result where available
  if (highestConfidence.projectName) merged.projectName = highestConfidence.projectName;
  if (highestConfidence.description) merged.description = highestConfidence.description;
  if (highestConfidence.discipline) merged.discipline = highestConfidence.discipline;
  if (highestConfidence.projectType) merged.projectType = highestConfidence.projectType;
  if (highestConfidence.location) merged.location = highestConfidence.location;
  if (highestConfidence.estimatedBudget) merged.estimatedBudget = highestConfidence.estimatedBudget;
  if (highestConfidence.timeline) merged.timeline = highestConfidence.timeline;

  // Merge arrays from all results
  merged.keyMilestones = Array.from(new Set(
    results.flatMap(r => r.keyMilestones || [])
  ));

  merged.anticipatedRFPs = results.flatMap(r =>
    (r.anticipatedRFPs || []).map(rfp => ({
      ...rfp,
      timeline: rfp.timeline || 'TBD'
    }))
  );

  merged.requirements = Array.from(new Set(
    results.flatMap(r => r.requirements || [])
  ));

  merged.stakeholders = results.flatMap(r => r.stakeholders || []);

  merged.specifications = Array.from(new Set(
    results.flatMap(r => r.specifications || [])
  ));

  return merged;
}

function extractBasicInfoFromFilename(filename: string): DocumentAnalysisResult {
  const nameParts = filename.toLowerCase().replace(/\.[^/.]+$/, "").split(/[-_\s]+/);

  let discipline: 'construction' | 'design' | 'trade' | 'mixed' = 'construction';

  // Detect discipline from filename
  if (nameParts.some(part => ['design', 'architectural', 'engineering', 'arch', 'eng'].includes(part))) {
    discipline = 'design';
  } else if (nameParts.some(part => ['mep', 'electrical', 'plumbing', 'hvac', 'elevator'].includes(part))) {
    discipline = 'trade';
  }

  // Extract potential project name
  const projectName = nameParts
    .filter(part => !['project', 'spec', 'specification', 'rfp', 'bid', 'proposal'].includes(part))
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Untitled Project';

  return {
    projectName,
    discipline,
    confidence: 30
  };
}

export function applyAnalysisToWizard(
  analysisResult: DocumentAnalysisResult,
  currentWizardData: ProjectWizardData
): Partial<ProjectWizardData> {
  const updates: Partial<ProjectWizardData> = {};

  // Apply extracted data only if not already filled in wizard
  if (analysisResult.projectName && !currentWizardData.name.trim()) {
    updates.name = analysisResult.projectName;
  }

  if (analysisResult.description && !currentWizardData.description.trim()) {
    updates.description = analysisResult.description;
  }

  if (analysisResult.discipline) {
    updates.discipline = analysisResult.discipline;
  }

  if (analysisResult.projectType) {
    updates.projectType = analysisResult.projectType;
  }

  if (analysisResult.location) {
    updates.location = {
      ...currentWizardData.location,
      ...analysisResult.location
    };
  }

  if (analysisResult.estimatedBudget && analysisResult.estimatedBudget > currentWizardData.totalBudget) {
    updates.totalBudget = analysisResult.estimatedBudget;
  }

  if (analysisResult.timeline?.startDate) {
    updates.startDate = analysisResult.timeline.startDate;
  }

  if (analysisResult.timeline?.endDate) {
    updates.endDate = analysisResult.timeline.endDate;
  }

  if (analysisResult.keyMilestones && analysisResult.keyMilestones.length > 0) {
    updates.keyMilestones = [
      ...currentWizardData.keyMilestones,
      ...analysisResult.keyMilestones.filter(m => !currentWizardData.keyMilestones.includes(m))
    ];
  }

  if (analysisResult.anticipatedRFPs && analysisResult.anticipatedRFPs.length > 0) {
    updates.anticipatedRFPs = [
      ...currentWizardData.anticipatedRFPs,
      ...analysisResult.anticipatedRFPs.map(rfp => ({
        name: rfp.name,
        discipline: rfp.discipline,
        estimatedBudget: rfp.estimatedBudget,
        timeline: rfp.timeline || 'TBD'
      }))
    ];
  }

  // Apply stakeholder information to owner if not set
  if (analysisResult.stakeholders && analysisResult.stakeholders.length > 0 && !currentWizardData.owner.name.trim()) {
    const primaryStakeholder = analysisResult.stakeholders[0];
    if (primaryStakeholder.name) {
      updates.owner = {
        ...currentWizardData.owner,
        name: primaryStakeholder.name,
        email: primaryStakeholder.email || currentWizardData.owner.email,
        company: primaryStakeholder.company || currentWizardData.owner.company,
        role: primaryStakeholder.role || currentWizardData.owner.role
      };
    }
  }

  return updates;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data:mime/type;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

export function getSupportedFileTypes(): string[] {
  return [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ];
}

export function isFileTypeSupported(file: File): boolean {
  return getSupportedFileTypes().includes(file.type);
}