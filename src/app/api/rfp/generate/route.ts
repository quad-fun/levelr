import { NextRequest, NextResponse } from 'next/server';
import { RFPGenerationRequest } from '@/types/rfp';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body: RFPGenerationRequest = await request.json();
    const { projectType, estimatedValue, csiDivisions, sectionType, context } = body;

    // Check API key
    if (!process.env.CLAUDE_API_KEY) {
      console.error('Missing CLAUDE_API_KEY environment variable');
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    // Generate appropriate prompt based on section type
    let prompt = '';
    
    if (sectionType === 'scope') {
      prompt = generateScopePrompt(projectType, estimatedValue, csiDivisions, context);
    } else if (sectionType === 'commercial') {
      prompt = generateCommercialPrompt(projectType, estimatedValue, context);
    } else if (sectionType === 'qualifications') {
      prompt = generateQualificationsPrompt(projectType, estimatedValue, context);
    } else {
      return NextResponse.json(
        { error: 'Invalid section type specified' },
        { status: 400 }
      );
    }

    // Make request to Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content?.[0];
    
    if (!content || content.type !== 'text') {
      throw new Error('Unexpected response format from Claude API');
    }

    return NextResponse.json({ 
      content: content.text,
      sectionType 
    });
    
  } catch (error) {
    console.error('RFP generation error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait a moment and try again.' },
          { status: 429 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to generate RFP content. Please try again.',
        details: error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

function generateScopePrompt(
  projectType: string, 
  estimatedValue: number, 
  csiDivisions: string[], 
  context: Record<string, unknown>
): string {
  return `
You are a professional construction RFP writer. Generate detailed scope descriptions for a ${projectType.replace('_', ' ')} project.

Project Details:
- Type: ${projectType.replace('_', ' ')}
- Estimated Value: $${estimatedValue.toLocaleString()}
- CSI Divisions: ${csiDivisions.join(', ')}
- Location: ${context.location || 'Not specified'}
- Special Requirements: ${context.specialRequirements || 'None specified'}

Generate professional, detailed scope descriptions for each CSI division. Include:
- Specific work items and deliverables
- Performance standards and quality requirements  
- Coordination requirements with other trades
- Any special conditions or constraints

Write in professional RFP language that is clear, comprehensive, and legally appropriate for construction contracting.

Focus on typical work items for each division in a ${projectType.replace('_', ' ')} project of this size and complexity.
`;
}

function generateCommercialPrompt(
  projectType: string, 
  estimatedValue: number, 
  context: Record<string, unknown>
): string {
  return `
You are a professional construction contract specialist. Generate comprehensive commercial terms for an RFP.

Project Details:
- Type: ${projectType.replace('_', ' ')}
- Estimated Value: $${estimatedValue.toLocaleString()}
- Contract Type: ${context.contractType || 'Lump Sum'}
- Delivery Method: ${context.deliveryMethod || 'Design-Bid-Build'}

Generate professional commercial terms including:
- Payment terms and schedule
- Change order procedures
- Warranty requirements
- Insurance and bonding requirements appropriate for project size
- General conditions and special conditions
- Risk allocation and liability terms

Use industry-standard language that protects the owner's interests while being fair to contractors.
Base insurance amounts and bonding requirements on the project value and typical industry standards.

Write in professional contract language suitable for construction projects of this type and scale.
`;
}

function generateQualificationsPrompt(
  projectType: string, 
  estimatedValue: number, 
  context: Record<string, unknown>
): string {
  return `
You are a construction procurement specialist. Generate comprehensive qualification requirements for contractor selection.

Project Details:
- Type: ${projectType.replace('_', ' ')}
- Estimated Value: $${estimatedValue.toLocaleString()}
- Project Complexity: ${context.complexity || 'Standard'}
- Special Requirements: ${context.specialRequirements || 'None'}

Generate appropriate qualification criteria including:
- Minimum experience requirements (years in business, similar project experience)
- Financial capacity requirements (minimum revenue, bonding capacity)
- Key personnel requirements (licenses, certifications, experience)
- Safety requirements (EMR, safety programs, training)
- Technical capabilities and equipment
- References and past performance requirements

Base requirements on:
- Project size and complexity
- Industry standards for this project type
- Risk factors and special requirements
- Local market conditions and availability

Ensure requirements are reasonable and not overly restrictive while maintaining quality standards.
Write in professional procurement language suitable for public or private construction projects.
`;
}