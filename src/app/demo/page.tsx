'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { enableDemoMode } from '@/lib/demo-data';
import DemoModeToggle from '@/components/demo/DemoModeToggle';
import {
  Building2, BarChart3, Users, FileText, Calendar, DollarSign,
  Target, TrendingUp, CheckCircle, ArrowRight, Play, Zap
} from 'lucide-react';

export default function DemoPage() {
  const router = useRouter();

  const handleStartDemo = () => {
    enableDemoMode();
    router.push('/projects');
  };

  const demoFeatures = [
    {
      title: 'Complete Project Management',
      description: 'Experience end-to-end project lifecycle management with realistic construction and design projects.',
      icon: Building2,
      color: 'blue',
      highlights: [
        'Multi-million dollar project examples',
        'Real timeline and milestone tracking',
        'Budget management with variance analysis',
        'Team collaboration tools'
      ]
    },
    {
      title: 'Advanced Analytics Dashboard',
      description: 'Explore comprehensive project analytics with performance metrics and trend analysis.',
      icon: BarChart3,
      color: 'green',
      highlights: [
        'Schedule & budget performance indicators',
        'Risk assessment and trend tracking',
        'Market intelligence insights',
        'Predictive completion forecasting'
      ]
    },
    {
      title: 'RFP & Bid Management',
      description: 'See how procurement works with multiple RFPs, bid evaluations, and contract awards.',
      icon: FileText,
      color: 'purple',
      highlights: [
        'Multiple active and completed RFPs',
        'Bid comparison and analysis',
        'Automated risk scoring',
        'Award tracking and budget impact'
      ]
    },
    {
      title: 'Interactive Gantt Charts',
      description: 'Visualize project timelines with professional Gantt charts and critical path analysis.',
      icon: Calendar,
      color: 'orange',
      highlights: [
        'Interactive timeline visualization',
        'Critical path identification',
        'Milestone dependency tracking',
        'Progress monitoring tools'
      ]
    }
  ];

  const sampleProjects = [
    {
      name: 'Downtown Office Complex',
      description: '15-story mixed-use development with office spaces, retail, and parking',
      budget: '$45,000,000',
      status: 'Active Construction',
      progress: 45,
      highlights: [
        'General contractor awarded',
        'MEP systems in evaluation',
        'Ahead of schedule',
        'Budget variance tracking'
      ]
    },
    {
      name: 'Riverside Residential Complex',
      description: '120-unit luxury residential development with riverfront amenities',
      budget: '$25,000,000',
      status: 'Planning Phase',
      progress: 15,
      highlights: [
        'Environmental studies underway',
        'Design development in progress',
        'Early budget planning',
        'Stakeholder coordination'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-blue-600">
                Levelr
              </div>
              <div className="ml-8 text-gray-400">/</div>
              <div className="ml-8">
                <h1 className="text-2xl font-bold text-gray-900">Demo Experience</h1>
              </div>
            </div>
            <button
              onClick={() => router.push('/analyze')}
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
            >
              Back to Analysis
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-100 rounded-full">
              <Play className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Experience Levelr's Project Management Suite
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Explore our comprehensive project management platform with realistic data from
            real construction and design projects. See how Levelr transforms project delivery
            from initial planning to successful completion.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleStartDemo}
              className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors"
            >
              <Play className="h-5 w-5 mr-3" />
              Start Interactive Demo
            </button>
            <button
              onClick={() => router.push('/projects')}
              className="inline-flex items-center px-8 py-4 border border-gray-300 text-gray-700 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-colors"
            >
              <Building2 className="h-5 w-5 mr-3" />
              View Projects
            </button>
          </div>
        </div>

        {/* Demo Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            What You'll Experience
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {demoFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white rounded-lg shadow-sm border p-8">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 bg-${feature.color}-100 rounded-full flex-shrink-0`}>
                      <Icon className={`h-8 w-8 text-${feature.color}-600`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {feature.description}
                      </p>
                      <ul className="space-y-2">
                        {feature.highlights.map((highlight, idx) => (
                          <li key={idx} className="flex items-center text-sm text-gray-700">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sample Projects Preview */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Sample Projects You'll Explore
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {sampleProjects.map((project, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {project.name}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {project.description}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      project.status === 'Active Construction'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {project.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Budget</p>
                      <p className="font-semibold text-lg">{project.budget}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Progress</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{project.progress}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Key Features:</h4>
                    <ul className="space-y-1">
                      {project.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2" />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-blue-50 rounded-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-blue-900 text-center mb-8">
            Demo Data Included
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">2</div>
              <div className="text-blue-800">Active Projects</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">4</div>
              <div className="text-blue-800">RFPs & Bids</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">8</div>
              <div className="text-blue-800">Team Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">$70M</div>
              <div className="text-blue-800">Total Project Value</div>
            </div>
          </div>
        </div>

        {/* Demo Mode Toggle */}
        <div className="mb-12">
          <DemoModeToggle variant="full" onToggle={(enabled) => {
            if (enabled) router.push('/projects');
          }} />
        </div>

        {/* Call to Action */}
        <div className="text-center bg-white rounded-lg shadow-sm border p-8">
          <Zap className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Project Management?
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Experience the power of AI-driven project management with comprehensive
            analytics, intelligent automation, and seamless collaboration tools.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleStartDemo}
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Start Demo
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
            <button
              onClick={() => router.push('/analyze')}
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Back to Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}