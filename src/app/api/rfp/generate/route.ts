import { NextRequest, NextResponse } from 'next/server';
import { RFPGenerationRequest } from '@/types/rfp';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body: RFPGenerationRequest = await request.json();
    const { discipline, projectType, estimatedValue, scopeSections, sectionType, context } = body;

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
      prompt = generateScopePrompt(discipline, projectType, estimatedValue, scopeSections, context);
    } else if (sectionType === 'commercial') {
      prompt = generateCommercialPrompt(discipline, projectType, estimatedValue, context);
    } else if (sectionType === 'qualifications') {
      prompt = generateQualificationsPrompt(discipline, projectType, estimatedValue, context);
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
  discipline: string,
  projectType: string, 
  estimatedValue: number, 
  scopeSections: string[], 
  context: Record<string, unknown>
): string {
  // Generate discipline-specific prompt
  const disciplineSpecificPrompts = {
    construction: `
You are a professional construction RFP writer with expertise in MasterFormat 2018 and construction contracting. Generate detailed scope descriptions for a ${projectType.replace('_', ' ')} construction project.

Project Details:
- Discipline: Construction Services
- Type: ${projectType.replace('_', ' ')}
- Estimated Value: $${estimatedValue.toLocaleString()}
- CSI Divisions: ${scopeSections.join(', ')}
- Location: ${context.location || 'Not specified'}
- Special Requirements: ${context.specialRequirements || 'None specified'}

For each CSI Division, generate professional scope descriptions that include:
- Specific construction work items and deliverables
- Performance standards and quality requirements
- Coordination requirements with other trades and disciplines
- Materials and workmanship standards
- Testing and commissioning requirements
- Any special conditions or project-specific constraints

Write in professional RFP language appropriate for general contractors and construction professionals. Use industry-standard terminology and reference applicable building codes, standards, and best practices.

Focus on construction work typical for each division in a ${projectType.replace('_', ' ')} project of this scale and complexity.`,

    design: `
You are a professional design services RFP writer with expertise in AIA contract documents and professional services procurement. Generate detailed scope descriptions for a ${projectType.replace('_', ' ')} design project.

Project Details:
- Discipline: Design Services (Architecture/Engineering)
- Type: ${projectType.replace('_', ' ')}
- Estimated Value: $${estimatedValue.toLocaleString()}
- Design Phases: ${scopeSections.join(', ')}
- Location: ${context.location || 'Not specified'}
- Special Requirements: ${context.specialRequirements || 'None specified'}

For each design phase, generate professional scope descriptions that include:
- Specific design deliverables and documentation requirements
- Professional standards and quality expectations
- Coordination requirements with consultants and stakeholders
- Code compliance and regulatory requirements
- Review and approval processes
- Sustainability and performance criteria
- Project management and communication protocols

Write in professional RFP language appropriate for architects, engineers, and design professionals. Reference AIA standards, professional licensing requirements, and industry best practices.

Focus on design services typical for each phase in a ${projectType.replace('_', ' ')} project of this scale and complexity.`,

    trade: `
You are a professional trade services RFP writer with expertise in specialized construction systems and trade contracting. Generate detailed scope descriptions for a ${projectType.replace('_', ' ')} trade project.

Project Details:
- Discipline: Trade Services (MEP/Specialty)
- Type: ${projectType.replace('_', ' ')}
- Estimated Value: $${estimatedValue.toLocaleString()}
- Technical Categories: ${scopeSections.join(', ')}
- Location: ${context.location || 'Not specified'}
- Special Requirements: ${context.specialRequirements || 'None specified'}

For each technical category, generate professional scope descriptions that include:
- Specific system installations and technical deliverables
- Equipment specifications and performance requirements
- Testing, commissioning, and startup procedures
- Manufacturer certifications and warranty requirements
- Coordination with general contractor and other trades
- Code compliance and permit requirements
- Training and maintenance documentation
- System integration and controls requirements

Write in professional RFP language appropriate for trade contractors and specialty system installers. Reference relevant industry codes, manufacturer standards, and certification requirements.

Focus on trade work typical for each category in a ${projectType.replace('_', ' ')} project of this scale and complexity.`
  };

  return disciplineSpecificPrompts[discipline as keyof typeof disciplineSpecificPrompts] || disciplineSpecificPrompts.construction;
}

function generateCommercialPrompt(
  discipline: string,
  projectType: string, 
  estimatedValue: number, 
  context: Record<string, unknown>
): string {
  const disciplineSpecificPrompts = {
    construction: `
You are a professional construction contract specialist with expertise in AIA and EJCDC contract documents. Generate comprehensive commercial terms for a construction RFP.

Project Details:
- Discipline: Construction Services
- Type: ${projectType.replace('_', ' ')}
- Estimated Value: $${estimatedValue.toLocaleString()}
- Contract Type: ${context.contractType || 'Lump Sum'}
- Delivery Method: ${context.deliveryMethod || 'Design-Bid-Build'}

Generate professional commercial terms including:
- Payment terms and progress payment schedule based on work completion
- Change order procedures with proper documentation and approval processes  
- Performance and payment bonding requirements appropriate for project size
- Insurance requirements including general liability, workers compensation, and auto coverage
- Warranty requirements for workmanship and materials (typically 1-2 years)
- General conditions referencing applicable AIA or EJCDC documents
- Risk allocation, liquidated damages, and liability limitations
- Lien waiver and release procedures

Use construction industry-standard language that protects the owner while being fair to contractors. Base insurance amounts on project value (typically $1M+ for projects of this size) and reference standard construction contract terms.

Write in professional contract language suitable for general contractors and construction projects.`,

    design: `
You are a professional design services contract specialist with expertise in AIA agreements and professional services procurement. Generate comprehensive commercial terms for a design services RFP.

Project Details:
- Discipline: Design Services (Architecture/Engineering) 
- Type: ${projectType.replace('_', ' ')}
- Estimated Value: $${estimatedValue.toLocaleString()}
- Contract Type: ${context.contractType || 'Professional Services Agreement'}
- Fee Structure: ${context.deliveryMethod || 'Percentage of Construction Cost'}

Generate professional commercial terms including:
- Fee structure and payment schedule tied to design phase completion
- Scope modification and additional services procedures
- Professional liability insurance requirements appropriate for design services
- Standard of care and professional responsibility clauses
- Intellectual property rights and document ownership
- General conditions referencing AIA B101 or similar agreements
- Limitation of liability and dispute resolution procedures  
- Copyright and use of documents provisions

Use professional services industry standards that protect the client while recognizing professional design responsibilities. Reference AIA agreements, professional licensing requirements, and standard design practice.

Write in professional contract language suitable for architects, engineers, and design consultants.`,

    trade: `
You are a professional trade services contract specialist with expertise in specialty contractor agreements. Generate comprehensive commercial terms for a trade services RFP.

Project Details:
- Discipline: Trade Services (MEP/Specialty)
- Type: ${projectType.replace('_', ' ')}
- Estimated Value: $${estimatedValue.toLocaleString()}
- Contract Type: ${context.contractType || 'Trade Contract'}
- Installation Method: ${context.deliveryMethod || 'Direct Installation'}

Generate professional commercial terms including:
- Payment terms tied to installation milestones and system commissioning
- Material procurement and equipment warranty procedures
- Trade-specific insurance including general liability and professional coverage for design-build services
- Performance guarantees and system warranty requirements (typically 1-5 years depending on system)
- Coordination requirements with general contractor and other trades
- Testing, commissioning, and startup procedures with owner training
- Manufacturer coordination and certification requirements
- Change order procedures for field conditions and owner changes

Use trade contracting standards appropriate for specialty systems. Reference industry codes, manufacturer requirements, and standard trade practices.

Write in professional contract language suitable for trade contractors and specialty system installers.`
  };

  return disciplineSpecificPrompts[discipline as keyof typeof disciplineSpecificPrompts] || disciplineSpecificPrompts.construction;
}

function generateQualificationsPrompt(
  discipline: string,
  projectType: string, 
  estimatedValue: number, 
  context: Record<string, unknown>
): string {
  const disciplineSpecificPrompts = {
    construction: `
You are a construction procurement specialist with expertise in contractor prequalification and selection. Generate comprehensive qualification requirements for construction contractor selection.

Project Details:
- Discipline: Construction Services
- Type: ${projectType.replace('_', ' ')}
- Estimated Value: $${estimatedValue.toLocaleString()}
- Project Complexity: ${context.complexity || 'Standard'}
- Special Requirements: ${context.specialRequirements || 'None'}

Generate appropriate qualification criteria including:
- Minimum experience requirements (years in business, similar construction project experience)
- Financial capacity requirements (minimum annual revenue, bonding capacity for project size)
- Key personnel requirements (licensed project manager, certified superintendent, safety coordinator)
- Safety requirements (EMR below industry average, written safety program, OSHA training)
- Technical capabilities and construction equipment availability
- References from similar construction projects (minimum 3-5 projects)
- Professional licensing and certification requirements
- Previous experience with project delivery method and contract type

Base requirements on construction industry standards, project size and complexity, and local market conditions. Ensure requirements are reasonable for the local contractor base while maintaining quality standards.

Write in professional procurement language suitable for construction projects and general contractor selection.`,

    design: `
You are a design services procurement specialist with expertise in architect and engineer selection. Generate comprehensive qualification requirements for design professional selection.

Project Details:
- Discipline: Design Services (Architecture/Engineering)
- Type: ${projectType.replace('_', ' ')}
- Estimated Value: $${estimatedValue.toLocaleString()}
- Project Complexity: ${context.complexity || 'Standard'}
- Special Requirements: ${context.specialRequirements || 'None'}

Generate appropriate qualification criteria including:
- Professional licensing requirements (registered architects, professional engineers in relevant disciplines)
- Minimum experience requirements (years of practice, similar project types and scale)
- Firm financial stability and professional liability insurance coverage
- Key personnel qualifications (project manager, principal-in-charge, technical specialists)
- Portfolio requirements demonstrating relevant project experience and design excellence
- References from similar design projects (minimum 5 projects within last 5-7 years)
- Technical capabilities including software, modeling, and analysis tools
- Understanding of applicable codes, standards, and sustainability requirements
- Professional certifications (LEED AP, specialized certifications as applicable)

Base requirements on professional practice standards, project complexity, and regulatory requirements. Consider AIA qualifications-based selection principles and professional services procurement best practices.

Write in professional procurement language suitable for architecture and engineering services selection.`,

    trade: `
You are a specialty trade procurement specialist with expertise in trade contractor and systems integrator selection. Generate comprehensive qualification requirements for trade services selection.

Project Details:
- Discipline: Trade Services (MEP/Specialty)
- Type: ${projectType.replace('_', ' ')}
- Estimated Value: $${estimatedValue.toLocaleString()}
- Project Complexity: ${context.complexity || 'Standard'}
- Special Requirements: ${context.specialRequirements || 'None'}

Generate appropriate qualification criteria including:
- Trade licensing and certification requirements specific to work type
- Minimum experience requirements (years in trade, similar system installations)
- Manufacturer certifications and authorized dealer/installer status
- Financial capacity and bonding ability appropriate for trade contract size
- Key personnel qualifications (licensed technicians, certified installers, project coordinators)
- Safety requirements specific to trade work (trade-specific training, insurance)
- Technical capabilities including specialized tools and testing equipment
- References from similar trade installations (minimum 3-5 recent projects)
- Service and warranty capabilities including local service presence
- Understanding of relevant codes, standards, and coordination requirements

Base requirements on trade-specific industry standards, manufacturer requirements, and system complexity. Consider specialized certifications and training requirements for the specific trade.

Write in professional procurement language suitable for trade contractors and specialty system installers.`
  };

  return disciplineSpecificPrompts[discipline as keyof typeof disciplineSpecificPrompts] || disciplineSpecificPrompts.construction;
}